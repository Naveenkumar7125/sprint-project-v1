package com.eshoppingzone.auth.service;

import com.eshoppingzone.common.dto.auth.*;

public interface AuthService {

    UserDto register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(Long userId);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(Long userId, ChangePasswordRequest request);

    UserDto getCurrentUser(Long userId);
}
