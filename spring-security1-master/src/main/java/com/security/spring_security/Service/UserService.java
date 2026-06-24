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

    @CacheEvict(value = "users", allEntries = true)
    public User register(User user) {
        if (repo.findByEmail(user.getEmail()) != null) {
            throw new RuntimeException("An account with this email already exists.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        // Hash the security answer just like the password
        if (user.getSecurityAnswer() != null) {
            user.setSecurityAnswer(passwordEncoder.encode(user.getSecurityAnswer().trim().toLowerCase()));
        }
        return repo.save(user);
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
    @Cacheable(value = "users", key = "#email.toLowerCase()")
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

    public String getSecurityQuestion(String email) {
        User user = repo.findByEmail(email);
        if (user == null) return null;
        return user.getSecurityQuestion();
    }

    public boolean verifySecurityAnswer(String email, String answer) {
        User user = repo.findByEmail(email);
        if (user == null) return false;
        return user.getSecurityAnswer() != null
                && passwordEncoder.matches(answer.trim().toLowerCase(), user.getSecurityAnswer());
    }

    @CacheEvict(value = "users", key = "#email.toLowerCase()")
    public boolean resetPassword(String email, String securityAnswer, String newPassword) {
        User user = repo.findByEmail(email);
        if (user == null) return false;
        if (!verifySecurityAnswer(email, securityAnswer)) return false;
        user.setPassword(passwordEncoder.encode(newPassword));
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
}
