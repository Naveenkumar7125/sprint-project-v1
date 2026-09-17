package com.eshoppingzone.auth.service;

import com.eshoppingzone.auth.entity.PasswordResetToken;
import com.eshoppingzone.auth.entity.User;
import com.eshoppingzone.auth.event.AuthEventPublisher;
import com.eshoppingzone.auth.repository.PasswordResetTokenRepository;
import com.eshoppingzone.auth.repository.RefreshTokenRepository;
import com.eshoppingzone.auth.repository.UserRepository;
import com.eshoppingzone.auth.service.impl.AuthServiceImpl;
import com.eshoppingzone.common.dto.auth.*;
import com.eshoppingzone.common.enums.AccountStatus;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.exception.BadRequestException;
import com.eshoppingzone.common.exception.ConflictException;
import com.eshoppingzone.common.exception.UnauthorizedException;
import com.eshoppingzone.common.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private AuthEventPublisher eventPublisher;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                userRepository,
                refreshTokenRepository,
                passwordResetTokenRepository,
                passwordEncoder,
                jwtUtils,
                eventPublisher
        );
        ReflectionTestUtils.setField(authService, "resetExpirationMinutes", 15L);
        ReflectionTestUtils.setField(authService, "resetBaseUrl", "http://localhost:3000/reset-password");
    }

    @Test
    @DisplayName("Register new user successfully")
    void register_Success() {
        RegisterRequest request = RegisterRequest.builder()
                .username("john_doe")
                .email("john@example.com")
                .password("Password@123")
                .role(UserRole.CUSTOMER)
                .build();

        when(userRepository.existsByUsername("john_doe")).thenReturn(false);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("encodedPassword");

        User savedUser = User.builder()
                .id(1L)
                .username("john_doe")
                .email("john@example.com")
                .password("encodedPassword")
                .role(UserRole.CUSTOMER)
                .enabled(true)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserDto result = authService.register(request);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("john_doe", result.getUsername());
        verify(eventPublisher, times(1)).publishUserRegistered(any());
    }

    @Test
    @DisplayName("Register duplicate username throws ConflictException")
    void register_DuplicateUsername_ThrowsConflict() {
        RegisterRequest request = RegisterRequest.builder()
                .username("john_doe")
                .email("john@example.com")
                .password("Password@123")
                .role(UserRole.CUSTOMER)
                .build();

        when(userRepository.existsByUsername("john_doe")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Login with valid credentials returns AuthResponse")
    void login_Success() {
        LoginRequest request = LoginRequest.builder()
                .usernameOrEmail("john_doe")
                .password("Password@123")
                .build();

        User user = User.builder()
                .id(1L)
                .username("john_doe")
                .email("john@example.com")
                .password("encodedPassword")
                .role(UserRole.CUSTOMER)
                .enabled(true)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        when(userRepository.findByUsernameOrEmail("john_doe")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password@123", "encodedPassword")).thenReturn(true);
        when(jwtUtils.generateAccessToken(1L, "john_doe", "john@example.com", UserRole.CUSTOMER)).thenReturn("jwt.access.token");
        when(jwtUtils.generateRefreshToken(1L, "john_doe")).thenReturn("jwt.refresh.token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt.access.token", response.getAccessToken());
        assertEquals("jwt.refresh.token", response.getRefreshToken());
        assertEquals(1L, response.getUserId());
    }

    @Test
    @DisplayName("Forgot password with existing email publishes event without revealing sensitive data")
    void forgotPassword_ExistingEmail_PublishesEvent() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("john@example.com")
                .build();

        User user = User.builder()
                .id(1L)
                .username("john_doe")
                .email("john@example.com")
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        authService.forgotPassword(request);

        verify(passwordResetTokenRepository, times(1)).invalidateAllUserTokens(1L);
        verify(passwordResetTokenRepository, times(1)).save(any(PasswordResetToken.class));
        verify(eventPublisher, times(1)).publishPasswordResetRequested(any());
    }

    @Test
    @DisplayName("Forgot password with non-existent email returns silently (Anti-Enumeration)")
    void forgotPassword_NonExistentEmail_SilentSuccess() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("unknown@example.com")
                .build();

        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> authService.forgotPassword(request));
        verify(passwordResetTokenRepository, never()).save(any());
        verify(eventPublisher, never()).publishPasswordResetRequested(any());
    }

    @Test
    @DisplayName("Reset password with valid token updates password and revokes tokens")
    void resetPassword_ValidToken_Success() throws Exception {
        String rawToken = "my_secure_random_token_12345678";
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        String tokenHash = HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token(rawToken)
                .newPassword("NewPassword@123")
                .build();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(10L)
                .userId(1L)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .used(false)
                .build();

        User user = User.builder()
                .id(1L)
                .username("john_doe")
                .email("john@example.com")
                .password("oldEncodedPassword")
                .build();

        when(passwordResetTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(resetToken));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewPassword@123")).thenReturn("newEncodedPassword");

        authService.resetPassword(request);

        assertTrue(resetToken.isUsed());
        assertNotNull(resetToken.getUsedAt());
        assertEquals("newEncodedPassword", user.getPassword());
        verify(refreshTokenRepository, times(1)).revokeAllUserTokens(1L);
        verify(eventPublisher, times(1)).publishPasswordResetCompleted(any());
    }

    @Test
    @DisplayName("Reset password with expired token throws BadRequestException")
    void resetPassword_ExpiredToken_ThrowsBadRequest() throws Exception {
        String rawToken = "expired_token";
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        String tokenHash = HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token(rawToken)
                .newPassword("NewPassword@123")
                .build();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(10L)
                .userId(1L)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().minus(5, ChronoUnit.MINUTES)) // Expired
                .used(false)
                .build();

        when(passwordResetTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(resetToken));

        assertThrows(BadRequestException.class, () -> authService.resetPassword(request));
    }

    @Test
    @DisplayName("Reset password with already used token throws BadRequestException")
    void resetPassword_UsedToken_ThrowsBadRequest() throws Exception {
        String rawToken = "used_token";
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        String tokenHash = HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token(rawToken)
                .newPassword("NewPassword@123")
                .build();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(10L)
                .userId(1L)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .used(true) // Already used
                .build();

        when(passwordResetTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(resetToken));

        assertThrows(BadRequestException.class, () -> authService.resetPassword(request));
    }
}
