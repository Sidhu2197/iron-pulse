package com.security.spring_security.Controller;

import com.security.spring_security.Model.User;
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

    @PostMapping("/forgot-password/verify-email")
    public Map<String, Object> verifyEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Map<String, Object> response = new HashMap<>();

        if (email == null || email.isBlank()) {
            response.put("success", false);
            response.put("message", "Email is required.");
            return response;
        }

        String question = userService.getSecurityQuestion(email);
        if (question == null) {
            response.put("success", false);
            response.put("message", "No account found with this email.");
        } else {
            response.put("success", true);
            response.put("securityQuestion", question);
        }
        return response;
    }

    @PostMapping("/forgot-password/reset")
    public Map<String, Object> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String securityAnswer = request.get("securityAnswer");
        String newPassword = request.get("newPassword");
        Map<String, Object> response = new HashMap<>();

        if (email == null || email.isBlank()
                || securityAnswer == null || securityAnswer.isBlank()
                || newPassword == null || newPassword.isBlank()) {
            response.put("success", false);
            response.put("message", "All fields are required.");
            return response;
        }

        if (newPassword.length() < 8) {
            response.put("success", false);
            response.put("message", "Password must be at least 8 characters long.");
            return response;
        }

        if (!newPassword.matches(".*[A-Z].*") || !newPassword.matches(".*[0-9].*")) {
            response.put("success", false);
            response.put("message", "Password must contain at least one uppercase letter and one number.");
            return response;
        }

        boolean result = userService.resetPassword(email, securityAnswer, newPassword);
        if (result) {
            response.put("success", true);
            response.put("message", "Password reset successfully! Redirecting to login...");
        } else {
            response.put("success", false);
            response.put("message", "Incorrect security answer or account not found.");
        }
        return response;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");
        Map<String, Object> response = new HashMap<>();

        // Basic email format validation
        if (email == null || email.isBlank() || !email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            response.put("success", false);
            response.put("message", "Incorrect email or password. Please try again.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        try {
            // Spring Security now authenticates by email (via MyUserDetailsService)
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );

            if (authentication.isAuthenticated()) {
                User dbUser = userService.findByEmail(email);
                if (dbUser == null) {
                    response.put("success", false);
                    response.put("message", "Incorrect email or password. Please try again.");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
                }
                
                // Generate JWT token
                String token = jwtUtil.generateToken(dbUser.getEmail());
                
                response.put("success", true);
                response.put("message", "Login successful!");
                response.put("token", token);
                response.put("username", dbUser.getUsername());
                response.put("email", dbUser.getEmail());
                response.put("age", dbUser.getAge());
                response.put("height", dbUser.getHeight());
                response.put("weight", dbUser.getWeight());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Incorrect email or password. Please try again.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
        } catch (BadCredentialsException e) {
            response.put("success", false);
            response.put("message", "Incorrect email or password. Please try again.");
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
        User user = userService.findByEmail(email);
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
            User updated = userService.updateProfile(email, username, age, height, weight);
            response.put("success", true);
            response.put("message", "Profile updated successfully!");
            response.put("username", updated.getUsername());
            response.put("email", updated.getEmail());
            response.put("age", updated.getAge());
            response.put("height", updated.getHeight());
            response.put("weight", updated.getWeight());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Update failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}
