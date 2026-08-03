package com.security.spring_security.Service;

import com.security.spring_security.Model.User;
import com.security.spring_security.Model.UserCacheDTO;
import com.security.spring_security.dao.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepo repo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    // No cache eviction needed — a newly registered user has no cache entry yet.
    // Evicting allEntries would unnecessarily wipe every other user's cached data.
    public User register(User user) {
        if (repo.findByEmail(user.getEmail()) != null) {
            throw new RuntimeException("An account with this email already exists.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Generate verification token
        String token = java.util.UUID.randomUUID().toString();
        user.setVerificationToken(token);
        user.setVerified(false);
        user.setFailedLoginAttempts(0);
        
        User savedUser = repo.save(user);
        
        // Send verification email
        emailService.sendVerificationEmail(savedUser.getEmail(), token);
        
        return savedUser;
    }

    // No cache here — username lookups are infrequent and
    // keeping two keys (email + username) in sync is error-prone
    public User findByUsername(String username) {
        return repo.findByUsername(username);
    }

    /**
     * Returns a cached UserCacheDTO (no sensitive fields).
     * Email keys are normalized to lowercase for consistency.
     */
    @Cacheable(value = "users", key = "#email.toLowerCase()", sync = true)
    public UserCacheDTO findByEmail(String email) {
        User user = repo.findByEmail(email);
        return user != null ? new UserCacheDTO(user) : null;
    }

    /**
     * Returns the full User entity directly from the database (uncached).
     * Use this for operations that need sensitive fields (authentication, security answer verification).
     */
    public User findUserEntityByEmail(String email) {
        return repo.findByEmail(email);
    }

    public User saveUserEntity(User user) {
        return repo.save(user);
    }

    public boolean verifyEmail(String token) {
        User user = repo.findByVerificationToken(token);
        if (user == null) return false;
        
        user.setVerified(true);
        user.setVerificationToken(null);
        repo.save(user);
        return true;
    }

    @CachePut(value = "users", key = "#email.toLowerCase()")
    public UserCacheDTO updateProfile(String email, String username, int age, double height, double weight) {
        User user = repo.findByEmail(email);
        if (user == null) throw new RuntimeException("User not found");
        if (username != null && !username.isBlank()) user.setUsername(username);
        if (age > 0) user.setAge(age);
        if (height > 0) user.setHeight(height);
        if (weight > 0) user.setWeight(weight);
        User saved = repo.save(user);
        return new UserCacheDTO(saved);
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = repo.findByEmail(email);
        if (user == null) throw new RuntimeException("User not found");
        
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect current password.");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        repo.save(user);
    }

    public void resendVerificationEmail(String email) {
        User user = repo.findByEmail(email);
        if (user != null && !user.isVerified()) {
            String token = java.util.UUID.randomUUID().toString();
            user.setVerificationToken(token);
            repo.save(user);
            emailService.sendVerificationEmail(user.getEmail(), token);
        }
    }
}
