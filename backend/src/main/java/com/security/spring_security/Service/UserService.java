package com.security.spring_security.Service;

import com.security.spring_security.Model.User;
import com.security.spring_security.Model.UserCacheDTO;
import com.security.spring_security.dao.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {

    private static final long VERIFICATION_TOKEN_VALIDITY_HOURS = 24;

    @Autowired
    private UserRepo repo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    public User register(User user) {
        System.out.println("REGISTER: Registration started");

        try {
            if (repo.findByEmail(user.getEmail()) != null) {
                throw new RuntimeException(
                        "An account with this email already exists."
                );
            }

            user.setPassword(passwordEncoder.encode(user.getPassword()));

            String token = issueVerificationToken(user);
            user.setVerified(false);
            user.setFailedLoginAttempts(0);

            System.out.println("REGISTER: Saving user to database");

            User savedUser = repo.save(user);

            System.out.println(
                    "REGISTER: User saved. Sending verification email"
            );

            try {
                emailService.sendVerificationEmail(
                        savedUser.getEmail(),
                        token
                );

                System.out.println(
                        "REGISTER: Verification email sent successfully"
                );

            } catch (Exception e) {
                System.err.println(
                        "REGISTER EMAIL ERROR: " + e.getClass().getName()
                );
                e.printStackTrace();

                throw new RuntimeException(
                        "Registration failed while sending verification email.",
                        e
                );
            }

            System.out.println("REGISTER: Registration completed");
            return savedUser;

        } catch (Exception e) {
            System.err.println(
                    "REGISTER ERROR: " + e.getClass().getName()
                            + " - " + e.getMessage()
            );
            e.printStackTrace();
            throw e;
        }
    }

    public User findByUsername(String username) {
        return repo.findByUsername(username);
    }

    @Cacheable(value = "users", key = "#email.toLowerCase()", sync = true)
    public UserCacheDTO findByEmail(String email) {
        User user = repo.findByEmail(email);
        return user != null ? new UserCacheDTO(user) : null;
    }

    public User findUserEntityByEmail(String email) {
        return repo.findByEmail(email);
    }

    public User saveUserEntity(User user) {
        return repo.save(user);
    }

    public boolean verifyEmail(String token) {
        User user = repo.findByVerificationToken(token);

        if (user == null
                || user.getVerificationTokenExpiresAt() == null
                || user.getVerificationTokenExpiresAt()
                       .isBefore(LocalDateTime.now())) {
            return false;
        }

        user.setVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);

        repo.save(user);
        return true;
    }

    @CachePut(value = "users", key = "#email.toLowerCase()")
    public UserCacheDTO updateProfile(
            String email,
            String username,
            int age,
            double height,
            double weight) {

        User user = repo.findByEmail(email);

        if (user == null) {
            throw new RuntimeException("User not found");
        }

        if (username != null && !username.isBlank()) {
            user.setUsername(username);
        }

        if (age > 0) {
            user.setAge(age);
        }

        if (height > 0) {
            user.setHeight(height);
        }

        if (weight > 0) {
            user.setWeight(weight);
        }

        User saved = repo.save(user);
        return new UserCacheDTO(saved);
    }

    @CachePut(value = "users", key = "#email.toLowerCase()")
    public UserCacheDTO updateMacros(
            String email,
            String gender,
            String activity,
            String goal,
            int age,
            double height,
            double weight,
            int calories,
            int protein,
            int fats,
            int carbs) {

        User user = repo.findByEmail(email);

        if (user == null) {
            throw new RuntimeException("User not found");
        }

        if (gender != null && !gender.isBlank()) {
            user.setGender(gender);
        }

        if (activity != null && !activity.isBlank()) {
            user.setActivity(activity);
        }

        if (goal != null && !goal.isBlank()) {
            user.setGoal(goal);
        }

        if (age > 0) {
            user.setAge(age);
        }

        if (height > 0) {
            user.setHeight(height);
        }

        if (weight > 0) {
            user.setWeight(weight);
        }

        if (calories > 0) {
            user.setTargetCalories(calories);
        }

        if (protein > 0) {
            user.setTargetProtein(protein);
        }

        if (fats > 0) {
            user.setTargetFats(fats);
        }

        if (carbs > 0) {
            user.setTargetCarbs(carbs);
        }

        user.setHasConfiguredMacros(true);

        User saved = repo.save(user);
        return new UserCacheDTO(saved);
    }

    public void changePassword(
            String email,
            String currentPassword,
            String newPassword) {

        User user = repo.findByEmail(email);

        if (user == null) {
            throw new RuntimeException("User not found");
        }

        if (!passwordEncoder.matches(
                currentPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect current password.");
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new RuntimeException(
                    "Password must be at least 8 characters long."
            );
        }

        if (!newPassword.matches(".*[A-Z].*")
                || !newPassword.matches(".*[0-9].*")) {
            throw new RuntimeException(
                    "Password must contain at least one uppercase letter and one number."
            );
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTokenVersion(user.getTokenVersion() + 1);

        repo.save(user);
    }

    public void resendVerificationEmail(String email) {
        User user = repo.findByEmail(email);

        if (user != null && !user.isVerified()) {
            String token = issueVerificationToken(user);
            repo.save(user);

            emailService.sendVerificationEmail(
                    user.getEmail(),
                    token
            );
        }
    }

    private String issueVerificationToken(User user) {
        String token = UUID.randomUUID().toString();

        user.setVerificationToken(token);
        user.setVerificationTokenExpiresAt(
                LocalDateTime.now().plusHours(
                        VERIFICATION_TOKEN_VALIDITY_HOURS
                )
        );

        return token;
    }
}
