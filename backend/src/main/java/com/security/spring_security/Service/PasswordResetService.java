package com.security.spring_security.Service;

import com.security.spring_security.Model.PasswordResetToken;
import com.security.spring_security.Model.User;
import com.security.spring_security.dao.PasswordResetTokenRepository;
import com.security.spring_security.dao.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordResetTokenRepository tokenRepo;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CacheManager cacheManager;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    /**
     * Process forgot-password request.
     * If user exists: delete old tokens, generate new one, send email.
     */
    @Transactional
    public void processForgotPassword(String email) {
        User user = userRepo.findByEmailIgnoreCase(email);

        if (user == null) {
            return;
        }

        // Delete any old reset tokens for this user
        tokenRepo.deleteByUser(user);

        // Generate new token
        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        resetToken.setUsed(false);
        tokenRepo.save(resetToken);

        // Build reset link and send email
        String resetLink = frontendUrl + "/reset-password/" + token;
        emailService.sendResetLink(user.getEmail(), resetLink);
    }

    /**
     * Validate token and reset password.
     * Returns error message on failure, null on success.
     */
    @Transactional
    public String resetPassword(String token, String newPassword) {
        Optional<PasswordResetToken> optionalToken = tokenRepo.findByToken(token);

        if (optionalToken.isEmpty()) {
            return "Invalid or expired reset link. Please request a new one.";
        }

        PasswordResetToken resetToken = optionalToken.get();

        if (resetToken.isUsed()) {
            return "This reset link has already been used. Please request a new one.";
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return "This reset link has expired. Please request a new one.";
        }

        // Validate new password
        if (newPassword == null || newPassword.length() < 8) {
            return "Password must be at least 8 characters long.";
        }

        if (!newPassword.matches(".*[A-Z].*") || !newPassword.matches(".*[0-9].*")) {
            return "Password must contain at least one uppercase letter and one number.";
        }

        // All checks passed — update password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        // Evict specific user from cache to prevent stale logins
        if (cacheManager.getCache("users") != null && user.getEmail() != null) {
            cacheManager.getCache("users").evict(user.getEmail().toLowerCase());
        }

        // Mark token as used
        resetToken.setUsed(true);
        tokenRepo.save(resetToken);

        return null; // null = success
    }
}
