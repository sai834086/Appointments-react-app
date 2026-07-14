package com.appointments.booking.appointments.mapStruct.user;

import com.appointments.booking.appointments.payload.request.user.UserSignUpRequest;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.payload.response.user.AppUserProfileResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapStruct {

    AppUser toEntity(UserSignUpRequest userDTO);
    AppUserProfileResponse EntityToDTO(AppUser appUser);

    UserSignUpRequest toDTO(AppUser appUser);

}
