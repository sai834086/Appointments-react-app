package com.appointments.booking.appointments.mapStruct.patner;

import com.appointments.booking.appointments.model.patner.PartnerUser;
import com.appointments.booking.appointments.payload.request.patner.partnerRequests.PartnerUserSignUpRequest;
import com.appointments.booking.appointments.payload.response.patner.partnerResponse.PartnerProfileResponse;
import com.appointments.booking.appointments.payload.response.user.AllPartnerUsersToAppUsers;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PartnerUserMapStruct {

    // ---------------------------------------------------------
    // 1. Request -> Entity (For Saving)
    // ---------------------------------------------------------
    @Mapping(target = "partnerId", ignore = true)
    @Mapping(target = "appUser", ignore = true) // Linked manually in Service
    @Mapping(target = "status", ignore = true)  // Set manually in Service
    @Mapping(target = "isVerified", ignore = true) // Set manually in Service
    PartnerUser toEntity(PartnerUserSignUpRequest request);


    // ---------------------------------------------------------
    // 2. Entity -> Response DTO (For Single Profile View)
    // ---------------------------------------------------------
    @Mapping(source = "appUser.firstName", target = "firstName")
    @Mapping(source = "appUser.lastName", target = "lastName")
    @Mapping(source = "appUser.email", target = "email")
    @Mapping(source = "appUser.countryCode", target = "countryCode")
    @Mapping(source = "appUser.phoneNumber", target = "phoneNumber")
    PartnerProfileResponse toDTO(PartnerUser partnerUser);


    // ---------------------------------------------------------
    // 3. List Mapping (For Dashboard/Lists)
    // ---------------------------------------------------------
    // MapStruct automatically loops this list using the helper method below
    List<AllPartnerUsersToAppUsers> toDtoList(List<PartnerUser> partnerUsers);

    // HELPER: Maps one PartnerUser entity to one Item in the list
    @Mapping(source = "appUser.firstName", target = "firstName")
    @Mapping(source = "appUser.email", target = "email")
    @Mapping(source = "appUser.phoneNumber", target = "phoneNumber")
    @Mapping(target = "propertyCount", ignore = true)  // populated manually in service
    @Mapping(target = "serviceCount", ignore = true)   // populated manually in service
    AllPartnerUsersToAppUsers mapSingleListItem(PartnerUser partnerUser);

}