package com.security.spring_security.Config;

import com.security.spring_security.Model.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTokenVersionTest {

    @Test
    void tokenIsRejectedWhenTheUserTokenVersionChanges() {
        JwtUtil jwtUtil = new JwtUtil();
        User user = new User();
        user.setEmail("user@example.com");
        user.setTokenVersion(2);

        String token = jwtUtil.generateToken(user);

        assertThat(jwtUtil.validateToken(token, user.getEmail(), 2)).isTrue();
        assertThat(jwtUtil.validateToken(token, user.getEmail(), 3)).isFalse();
    }
}
