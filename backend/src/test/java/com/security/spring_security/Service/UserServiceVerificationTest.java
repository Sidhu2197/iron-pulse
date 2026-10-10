package com.security.spring_security.Service;

import com.security.spring_security.Model.User;
import com.security.spring_security.dao.UserRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceVerificationTest {

    @Mock
    private UserRepo userRepo;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void validVerificationTokenVerifiesTheUserAndClearsTheToken() {
        User user = new User();
        user.setVerificationToken("valid-token");
        user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(1));
        when(userRepo.findByVerificationToken("valid-token")).thenReturn(user);

        assertThat(userService.verifyEmail("valid-token")).isTrue();
        assertThat(user.isVerified()).isTrue();
        assertThat(user.getVerificationToken()).isNull();
        assertThat(user.getVerificationTokenExpiresAt()).isNull();
        verify(userRepo).save(user);
    }

    @Test
    void expiredVerificationTokenCannotVerifyTheUser() {
        User user = new User();
        user.setVerificationToken("expired-token");
        user.setVerificationTokenExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(userRepo.findByVerificationToken("expired-token")).thenReturn(user);

        assertThat(userService.verifyEmail("expired-token")).isFalse();
        assertThat(user.isVerified()).isFalse();
        verify(userRepo, never()).save(user);
    }

    @Test
    void passwordChangeInvalidatesPreviouslyIssuedTokens() {
        User user = new User();
        user.setEmail("user@example.com");
        user.setPassword("existing-hash");
        user.setTokenVersion(4);
        when(userRepo.findByEmail("user@example.com")).thenReturn(user);
        when(passwordEncoder.matches("Current1", "existing-hash")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword1")).thenReturn("new-hash");

        userService.changePassword("user@example.com", "Current1", "NewPassword1");

        assertThat(user.getPassword()).isEqualTo("new-hash");
        assertThat(user.getTokenVersion()).isEqualTo(5);
        verify(userRepo).save(user);
    }
}
