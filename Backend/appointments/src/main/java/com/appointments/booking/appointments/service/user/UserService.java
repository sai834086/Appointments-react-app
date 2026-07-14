package com.appointments.booking.appointments.service.user;

import com.appointments.booking.appointments.payload.request.admin.RegisterRequest;
import com.appointments.booking.appointments.payload.request.support.SupportRegisterRequest;
import com.appointments.booking.appointments.payload.request.user.UserSignUpRequest;
import com.appointments.booking.appointments.payload.request.user.UserUpdateRequest;
import com.appointments.booking.appointments.payload.response.user.AppUserProfileResponse;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;

public interface UserService extends UserDetailsService {
    void saveUser(UserSignUpRequest userDTO);
    AppUserProfileResponse userDetails(String userName);

    Long getAppUserId(String userName);

    AppUserProfileResponse getUserDetails(Long id);

    void updateUserDetails(Long userId, UserUpdateRequest request);

    void registerAdmin(RegisterRequest request);

    void registerSupport(SupportRegisterRequest request);

    List<AppUserProfileResponse> getAllAppUsers();

    List<AppUserProfileResponse> getSupportUsers();
}
