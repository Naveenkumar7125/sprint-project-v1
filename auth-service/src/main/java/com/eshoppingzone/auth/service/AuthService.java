package com.eshoppingzone.auth.service;

import com.eshoppingzone.auth.dto.*;
import com.eshoppingzone.auth.enums.AccountStatus;
import com.eshoppingzone.auth.enums.UserRole;
import java.util.List;

public interface AuthService {

    UserDto register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse socialLogin(SocialLoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(Long userId);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(Long userId, ChangePasswordRequest request);

    UserDto getCurrentUser(Long userId);

    List<UserDto> getUsersByRole(UserRole role);

    List<UserDto> getAllUsers();

    UserDto updateUserRole(Long userId, UserRole role);

    UserDto updateUserStatus(Long userId, AccountStatus status, Boolean enabled);

    UserDto updateUserCategory(Long userId, Long categoryId, String categoryName);

    void deleteUser(Long userId);
}
