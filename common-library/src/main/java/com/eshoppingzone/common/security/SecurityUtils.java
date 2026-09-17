package com.eshoppingzone.common.security;

import com.eshoppingzone.common.enums.UserRole;
import com.eshoppingzone.common.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<UserPrincipal> getCurrentUserPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return Optional.of((UserPrincipal) authentication.getPrincipal());
        }
        return Optional.empty();
    }

    public static Long getCurrentUserId() {
        return getCurrentUserPrincipal()
                .map(UserPrincipal::getUserId)
                .orElseThrow(() -> new UnauthorizedException("User not authenticated"));
    }

    public static String getCurrentUsername() {
        return getCurrentUserPrincipal()
                .map(UserPrincipal::getUsername)
                .orElseThrow(() -> new UnauthorizedException("User not authenticated"));
    }

    public static UserRole getCurrentUserRole() {
        return getCurrentUserPrincipal()
                .map(UserPrincipal::getRole)
                .orElseThrow(() -> new UnauthorizedException("User not authenticated"));
    }

    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof UserPrincipal;
    }
}
