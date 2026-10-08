package com.eshoppingzone.auth.controller;

import com.eshoppingzone.auth.service.AuthService;
import com.eshoppingzone.auth.dto.*;
import com.eshoppingzone.auth.enums.UserRole;
import com.eshoppingzone.auth.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user registration, authentication, tokens, and password reset")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user account (CUSTOMER, MERCHANT, ADMIN, DELIVERY_AGENT)")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest request) {
        UserDto userDto = authService.register(request);
        return new ResponseEntity<>(userDto, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user with username/email and password")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/social-login")
    @Operation(summary = "Authenticate or auto-provision user via verified Google/GitHub OAuth profile")
    public ResponseEntity<AuthResponse> socialLogin(@Valid @RequestBody SocialLoginRequest request) {
        AuthResponse response = authService.socialLogin(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using a valid refresh token")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Logout user and revoke refresh tokens")
    public ResponseEntity<Map<String, String>> logout() {
        Long userId = SecurityUtils.getCurrentUserId();
        authService.logout(userId);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset link/token. Always returns generic response to prevent account enumeration.")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of(
                "message", "If an account exists for this email, password reset instructions have been sent."
        ));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using valid, non-expired single-use token")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
    }

    @PostMapping("/change-password")	
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Change password for currently authenticated user")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        authService.changePassword(userId, request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<UserDto> getCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        UserDto userDto = authService.getCurrentUser(userId);
        return ResponseEntity.ok(userDto);
    }

    @GetMapping("/agents")
    @Operation(summary = "Get all active verified delivery agents")
    public ResponseEntity<List<UserDto>> getDeliveryAgents() {
        List<UserDto> agents = authService.getUsersByRole(UserRole.DELIVERY_AGENT);
        return ResponseEntity.ok(agents);
    }

    @GetMapping("/users")
    @Operation(summary = "Get all users, optionally filtered by role")
    public ResponseEntity<List<UserDto>> getUsers(@RequestParam(required = false) UserRole role) {
        if (role != null) {
            return ResponseEntity.ok(authService.getUsersByRole(role));
        }
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PutMapping("/users/{userId}/role")
    @Operation(summary = "Admin update user role")
    public ResponseEntity<UserDto> updateUserRole(
            @PathVariable Long userId,
            @RequestParam UserRole role) {
        UserDto updated = authService.updateUserRole(userId, role);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/users/{userId}/status")
    @Operation(summary = "Admin update user status and enabled flag")
    public ResponseEntity<UserDto> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam(required = false) com.eshoppingzone.auth.enums.AccountStatus status,
            @RequestParam(required = false) Boolean enabled) {
        UserDto updated = authService.updateUserStatus(userId, status, enabled);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/users/{userId}/category")
    @Operation(summary = "Admin assign or update merchant single category domain")
    public ResponseEntity<UserDto> updateUserCategory(
            @PathVariable Long userId,
            @RequestParam Long categoryId,
            @RequestParam String categoryName) {
        UserDto updated = authService.updateUserCategory(userId, categoryId, categoryName);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Admin delete user")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long userId) {
        authService.deleteUser(userId);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
