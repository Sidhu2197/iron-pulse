package com.security.spring_security.Controller;

import com.security.spring_security.Model.User;
import com.security.spring_security.Model.UserCacheDTO;
import com.security.spring_security.Service.UserService;
import com.security.spring_security.Config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import com.security.spring_security.Model.UpdateProfileRequest;
import com.security.spring_security.Model.UpdateMacrosRequest;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Value("${auth.cookie.secure:true}")
    private boolean authCookieSecure;

    @Value("${auth.cookie.same-site:Strict}")
    private String authCookieSameSite;

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
            response.put("message", "Unable to complete registration right now.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Unable to complete registration right now.");
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
                String token = jwtUtil.generateToken(dbUser);
                String refreshToken = jwtUtil.generateRefreshToken(dbUser);
                
                org.springframework.http.ResponseCookie accessCookie = createAuthCookie("accessToken", token, 15 * 60);
                org.springframework.http.ResponseCookie refreshCookie = createAuthCookie("refreshToken", refreshToken, 7 * 24 * 60 * 60);
                
                response.put("success", true);
                response.put("message", "Login successful!");
                response.put("username", dbUser.getUsername());
                response.put("email", dbUser.getEmail());
                response.put("age", dbUser.getAge());
                response.put("height", dbUser.getHeight());
                response.put("weight", dbUser.getWeight());
                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.SET_COOKIE, accessCookie.toString())
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
        org.springframework.http.ResponseCookie clearAccessCookie = createAuthCookie("accessToken", "", 0);
        org.springframework.http.ResponseCookie clearRefreshCookie = createAuthCookie("refreshToken", "", 0);
        response.put("success", true);
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
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
            
            if (dbUser != null && jwtUtil.validateToken(refreshToken, email, dbUser.getTokenVersion())) {
                String newToken = jwtUtil.generateToken(dbUser);
                org.springframework.http.ResponseCookie accessCookie = createAuthCookie("accessToken", newToken, 15 * 60);
                response.put("success", true);
                response.put("username", dbUser.getUsername());
                response.put("email", dbUser.getEmail());
                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.SET_COOKIE, accessCookie.toString())
                        .body(response);
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
        response.put("gender", user.getGender());
        response.put("activity", user.getActivity());
        response.put("goal", user.getGoal());
        response.put("targetCalories", user.getTargetCalories());
        response.put("targetProtein", user.getTargetProtein());
        response.put("targetFats", user.getTargetFats());
        response.put("targetCarbs", user.getTargetCarbs());
        response.put("hasConfiguredMacros", user.isHasConfiguredMacros());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateMe(Authentication authentication,
                                                        @Valid @RequestBody UpdateProfileRequest request) {
        Map<String, Object> response = new HashMap<>();
        if (authentication == null) {
            response.put("success", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        String email = authentication.getName();
        try {
            String username = request.getUsername();
            int age = request.getAge() != null ? request.getAge() : 0;
            double height = request.getHeight() != null ? request.getHeight() : 0;
            double weight = request.getWeight() != null ? request.getWeight() : 0;
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
            response.put("message", "Unable to update profile right now.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/me/macros")
    public ResponseEntity<Map<String, Object>> updateMacros(Authentication authentication,
                                                           @Valid @RequestBody UpdateMacrosRequest request) {
        Map<String, Object> response = new HashMap<>();
        if (authentication == null) {
            response.put("success", false);
            response.put("message", "Not authenticated");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        String email = authentication.getName();
        try {
            String gender = request.getGender();
            String activity = request.getActivity();
            String goal = request.getGoal();

            int age = request.getAge() != null ? request.getAge() : 0;
            double height = request.getHeight() != null ? request.getHeight() : 0;
            double weight = request.getWeight() != null ? request.getWeight() : 0;

            int calories = request.getCalories() != null ? request.getCalories() : 0;
            int protein = request.getProtein() != null ? request.getProtein() : 0;
            int fats = request.getFats() != null ? request.getFats() : 0;
            int carbs = request.getCarbs() != null ? request.getCarbs() : 0;

            UserCacheDTO updatedDto = userService.updateMacros(email, gender, activity, goal, age, height, weight, calories, protein, fats, carbs);
            response.put("success", true);
            response.put("message", "Macro targets saved to database successfully!");
            response.put("targetCalories", updatedDto.getTargetCalories());
            response.put("targetProtein", updatedDto.getTargetProtein());
            response.put("targetFats", updatedDto.getTargetFats());
            response.put("targetCarbs", updatedDto.getTargetCarbs());
            response.put("hasConfiguredMacros", updatedDto.isHasConfiguredMacros());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Unable to update macro targets right now.");
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
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.SET_COOKIE, createAuthCookie("accessToken", "", 0).toString())
                    .header(org.springframework.http.HttpHeaders.SET_COOKIE, createAuthCookie("refreshToken", "", 0).toString())
                    .body(response);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", "Unable to change password. Check your current password and the new password requirements.");
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

    private org.springframework.http.ResponseCookie createAuthCookie(String name, String value, long maxAgeSeconds) {
        return org.springframework.http.ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(authCookieSecure)
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite(authCookieSameSite)
                .build();
    }
}
