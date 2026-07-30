package com.security.spring_security.Controller;

import com.security.spring_security.Model.User;
import com.security.spring_security.Model.UserCacheDTO;
import com.security.spring_security.Service.UserService;
import com.security.spring_security.Config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody User user) {
        Map<String, Object> response = new HashMap<>();
        try {
            userService.register(user);
            response.put("success", true);
            response.put("message", "User registered successfully!");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@org.springframework.web.bind.annotation.RequestParam String token) {
        Map<String, Object> response = new HashMap<>();
        boolean success = userService.verifyEmail(token);
        
        if (success) {
            response.put("success", true);
            response.put("message", "Email verified successfully! You can now log in.");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Invalid or expired verification token.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");
        Map<String, Object> response = new HashMap<>();

        if (email == null || email.isBlank() || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            response.put("success", false);
            response.put("message", "Invalid email or password. Please try again.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        User dbUser = userService.findUserEntityByEmail(email);
        if (dbUser != null) {
            // Check lockout
            if (dbUser.getLockoutTime() != null && dbUser.getLockoutTime().isAfter(java.time.LocalDateTime.now())) {
                response.put("success", false);
                response.put("message", "Account is locked due to too many failed attempts. Try again later.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            // Check verification
            if (!dbUser.isVerified()) {
                response.put("success", false);
                response.put("message", "Please verify your email before logging in.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );

            if (authentication.isAuthenticated() && dbUser != null) {
                // Reset failed attempts
                dbUser.setFailedLoginAttempts(0);
                dbUser.setLockoutTime(null);
                userService.saveUserEntity(dbUser);
                
                // Generate JWT tokens
                String token = jwtUtil.generateToken(dbUser.getEmail());
                String refreshToken = jwtUtil.generateRefreshToken(dbUser.getEmail());
                
                org.springframework.http.ResponseCookie refreshCookie = org.springframework.http.ResponseCookie.from("refreshToken", refreshToken)
                        .httpOnly(true)
                        .secure(false) // Set to true in production with HTTPS
                        .path("/")
                        .maxAge(7 * 24 * 60 * 60)
                        .sameSite("Lax")
                        .build();
                
                response.put("success", true);
                response.put("message", "Login successful!");
                response.put("token", token);
                response.put("username", dbUser.getUsername());
                response.put("email", dbUser.getEmail());
                response.put("age", dbUser.getAge());
                response.put("height", dbUser.getHeight());
                response.put("weight", dbUser.getWeight());
                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString())
                        .body(response);
            }
        } catch (BadCredentialsException e) {
            if (dbUser != null) {
                int attempts = dbUser.getFailedLoginAttempts() + 1;
                dbUser.setFailedLoginAttempts(attempts);
                if (attempts >= 5) {
                    dbUser.setLockoutTime(java.time.LocalDateTime.now().plusMinutes(15));
                }
                userService.saveUserEntity(dbUser);
            }
        }
        
        response.put("success", false);
        response.put("message", "Invalid email or password. Please try again.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        Map<String, Object> response = new HashMap<>();
        org.springframework.http.ResponseCookie clearCookie = org.springframework.http.ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.put("success", true);
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(response);
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(@org.springframework.web.bind.annotation.CookieValue(name = "refreshToken", required = false) String refreshToken) {
        Map<String, Object> response = new HashMap<>();
        if (refreshToken == null || refreshToken.isBlank()) {
            response.put("success", false);
            response.put("message", "No refresh token provided.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        try {
            String email = jwtUtil.extractEmail(refreshToken);
            User dbUser = userService.findUserEntityByEmail(email);
            
            if (dbUser != null && jwtUtil.validateToken(refreshToken, email)) {
                String newToken = jwtUtil.generateToken(email);
                response.put("success", true);
                response.put("token", newToken);
                response.put("username", dbUser.getUsername());
                response.put("email", dbUser.getEmail());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Invalid refresh token.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Token validation failed.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        if (authentication == null) {
            response.put("success", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        // authentication.getName() returns email (since MyUserDetailsService loads by email)
        String email = authentication.getName();
        UserCacheDTO user = userService.findByEmail(email);
        if (user == null) {
            response.put("success", false);
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        response.put("success", true);
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("age", user.getAge());
        response.put("height", user.getHeight());
        response.put("weight", user.getWeight());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateMe(Authentication authentication,
                                                        @RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        if (authentication == null) {
            response.put("success", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        String email = authentication.getName();
        try {
            String username = body.containsKey("username") ? (String) body.get("username") : null;
            int age = body.containsKey("age") && body.get("age") != null
                    ? ((Number) body.get("age")).intValue() : 0;
            double height = body.containsKey("height") && body.get("height") != null
                    ? ((Number) body.get("height")).doubleValue() : 0;
            double weight = body.containsKey("weight") && body.get("weight") != null
                    ? ((Number) body.get("weight")).doubleValue() : 0;
            User updated = userService.findUserEntityByEmail(email);
            if (updated == null) throw new RuntimeException("User not found");
            UserCacheDTO updatedDto = userService.updateProfile(email,
                    username, age, height, weight);
            response.put("success", true);
            response.put("message", "Profile updated successfully!");
            response.put("username", updatedDto.getUsername());
            response.put("email", updatedDto.getEmail());
            response.put("age", updatedDto.getAge());
            response.put("height", updatedDto.getHeight());
            response.put("weight", updatedDto.getWeight());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Update failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(Authentication authentication,
                                                              @RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();
        if (authentication == null) {
            response.put("success", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        
        String email = authentication.getName();
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        
        try {
            userService.changePassword(email, currentPassword, newPassword);
            response.put("success", true);
            response.put("message", "Password changed successfully.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, Object>> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        Map<String, Object> response = new HashMap<>();
        
        try {
            userService.resendVerificationEmail(email);
            // Always return success to prevent user enumeration
            response.put("success", true);
            response.put("message", "If the email exists and is unverified, a new link has been sent.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to send email. Please try again later.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
