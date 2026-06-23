package com.security.spring_security.Controller;

import com.security.spring_security.Service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    @Autowired
    private PasswordResetService passwordResetService;

    /**
     * POST /api/auth/forgot-password
     * Accepts: { "email": "user@gmail.com" }
     * Always returns success (prevents email enumeration).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Map<String, Object> response = new HashMap<>();

        if (email == null || email.isBlank()) {
            response.put("success", false);
            response.put("message", "Email is required.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            passwordResetService.processForgotPassword(email.trim().toLowerCase());
        } catch (Exception e) {
            // Log internally but don't reveal details to client
            System.err.println("Password reset email error: " + e.getMessage());
        }

        // Always return success — never reveal if email exists or not
        response.put("success", true);
        response.put("message", "If an account exists with this email, you will receive a password reset link shortly.");
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/reset-password
     * Accepts: { "token": "uuid-here", "newPassword": "newpass123" }
     * Returns success or specific error message.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        Map<String, Object> response = new HashMap<>();

        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            response.put("success", false);
            response.put("message", "Token and new password are required.");
            return ResponseEntity.badRequest().body(response);
        }

        String error = passwordResetService.resetPassword(token, newPassword);

        if (error != null) {
            response.put("success", false);
            response.put("message", error);
            return ResponseEntity.badRequest().body(response);
        }

        response.put("success", true);
        response.put("message", "Password reset successfully! You can now log in with your new password.");
        return ResponseEntity.ok(response);
    }
}
