package com.eshoppingzone.auth.service.impl;

import com.eshoppingzone.auth.entity.PasswordResetToken;
import com.eshoppingzone.auth.entity.RefreshToken;
import com.eshoppingzone.auth.entity.User;
import com.eshoppingzone.auth.event.AuthEventPublisher;
import com.eshoppingzone.auth.repository.PasswordResetTokenRepository;
import com.eshoppingzone.auth.repository.RefreshTokenRepository;
import com.eshoppingzone.auth.repository.UserRepository;
import com.eshoppingzone.auth.service.AuthService;
import com.eshoppingzone.common.dto.auth.*;
import com.eshoppingzone.common.enums.AccountStatus;
import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.event.PasswordResetCompletedEvent;
import com.eshoppingzone.common.event.PasswordResetRequestedEvent;
import com.eshoppingzone.common.event.UserRegisteredEvent;
import com.eshoppingzone.common.exception.BadRequestException;
import com.eshoppingzone.common.exception.ConflictException;
import com.eshoppingzone.common.exception.ResourceNotFoundException;
import com.eshoppingzone.common.exception.UnauthorizedException;
import com.eshoppingzone.common.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthEventPublisher eventPublisher;

    @Value("${app.password-reset.expiration-minutes:15}")
    private long resetExpirationMinutes;

    @Value("${app.password-reset.base-url:http://localhost:3000/reset-password}")
    private String resetBaseUrl;

    public AuthServiceImpl(UserRepository userRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           PasswordResetTokenRepository passwordResetTokenRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtils jwtUtils,
                           AuthEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public UserDto register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .enabled(true)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered user id: {}, username: {}, role: {}", savedUser.getId(), savedUser.getUsername(), savedUser.getRole());

        eventPublisher.publishUserRegistered(UserRegisteredEvent.builder()
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .build());

        return mapToUserDto(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid username or password");
        }

        if (!user.isEnabled() || user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new UnauthorizedException("Account is deactivated or suspended");
        }

        String accessToken = jwtUtils.generateAccessToken(user.getId(), user.getUsername(), user.getEmail(), user.getRole());
        String refreshToken = jwtUtils.generateRefreshToken(user.getId(), user.getUsername());

        String refreshHash = hashToken(refreshToken);
        RefreshToken rt = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(refreshHash)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();
        refreshTokenRepository.save(rt);

        log.info("User {} logged in successfully", user.getUsername());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400L)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();
        if (!jwtUtils.validateToken(token)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String tokenHash = hashToken(token);
        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Refresh token not recognized or revoked"));

        if (storedToken.isRevoked() || storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token is expired or revoked");
        }

        User user = userRepository.findById(storedToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isEnabled() || user.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new UnauthorizedException("Account is deactivated or suspended");
        }

        // Rotate refresh token
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        String newAccessToken = jwtUtils.generateAccessToken(user.getId(), user.getUsername(), user.getEmail(), user.getRole());
        String newRefreshToken = jwtUtils.generateRefreshToken(user.getId(), user.getUsername());

        RefreshToken newRt = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(hashToken(newRefreshToken))
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();
        refreshTokenRepository.save(newRt);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(86400L)
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Override
    public void logout(Long userId) {
        refreshTokenRepository.revokeAllUserTokens(userId);
        log.info("Logged out user: {}", userId);
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        // Anti-enumeration: Never throw if user doesn't exist
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email: {}", request.getEmail());
            return;
        }

        User user = userOpt.get();
        String rawToken = generateSecureToken();
        String tokenHash = hashToken(rawToken);

        passwordResetTokenRepository.invalidateAllUserTokens(user.getId());

        Instant expiresAt = Instant.now().plus(resetExpirationMinutes, ChronoUnit.MINUTES);
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .used(false)
                .build();
        passwordResetTokenRepository.save(resetToken);

        log.info("Created password reset token for userId: {}", user.getId());

        eventPublisher.publishPasswordResetRequested(PasswordResetRequestedEvent.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .resetToken(rawToken)
                .expiresAt(expiresAt)
                .resetUrl(resetBaseUrl + "?token=" + rawToken)
                .build());
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = hashToken(request.getToken());

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset token"));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Invalid or expired password reset token");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);

        // Revoke all existing sessions/refresh tokens on password reset
        refreshTokenRepository.revokeAllUserTokens(user.getId());

        log.info("Password successfully reset for userId: {}", user.getId());

        eventPublisher.publishPasswordResetCompleted(PasswordResetCompletedEvent.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .build());
    }

    @Override
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        refreshTokenRepository.revokeAllUserTokens(user.getId());
        log.info("Password successfully changed for userId: {}", userId);

        eventPublisher.publishPasswordResetCompleted(PasswordResetCompletedEvent.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToUserDto(user);
    }

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .accountStatus(user.getAccountStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String generateSecureToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}
