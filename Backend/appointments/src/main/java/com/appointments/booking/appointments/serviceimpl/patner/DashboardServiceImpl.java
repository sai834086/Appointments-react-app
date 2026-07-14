package com.appointments.booking.appointments.serviceimpl.patner;

import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.model.enums.AppointmentStatus;
import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.appointments.booking.appointments.model.patner.PartnerUser;
import com.appointments.booking.appointments.payload.response.patner.dashboardResponse.DashboardStatsResponse;
import com.appointments.booking.appointments.repository.appointments.AppointmentRepository;
import com.appointments.booking.appointments.repository.patner.EmployeeRepository;
import com.appointments.booking.appointments.repository.patner.PartnerUserRepository;
import com.appointments.booking.appointments.repository.patner.PropertyRepository;
import com.appointments.booking.appointments.repository.patner.ServicesRepository;
import com.appointments.booking.appointments.service.patner.DashboardService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final PartnerUserRepository partnerUserRepository;
    private final PropertyRepository propertyRepository;
    private final EmployeeRepository employeeRepository;
    private final ServicesRepository servicesRepository;
    private final AppointmentRepository appointmentRepository;

    public DashboardServiceImpl(PartnerUserRepository partnerUserRepository,
                                PropertyRepository propertyRepository,
                                EmployeeRepository employeeRepository,
                                ServicesRepository servicesRepository,
                                AppointmentRepository appointmentRepository) {
        this.partnerUserRepository = partnerUserRepository;
        this.propertyRepository = propertyRepository;
        this.employeeRepository = employeeRepository;
        this.servicesRepository = servicesRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats(Long userId, String period) {

        PartnerUser partner = partnerUserRepository.findByAppUser_UserId(userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException(
                        "Partner profile not found for this user"));

        Long partnerId = partner.getPartnerId();
        AppUser appUser = partner.getAppUser();

        String normalizedPeriod = normalizePeriod(period);
        LocalDate[] range = resolveRange(normalizedPeriod);

        long totalAppointments = appointmentRepository
                .countByPartnerIdAndDateBetween(partnerId, range[0], range[1]);
        long bookedAppointments = appointmentRepository
                .countByPartnerIdAndDateBetweenAndStatus(partnerId, range[0], range[1], AppointmentStatus.Booked);
        long completedAppointments = appointmentRepository
                .countByPartnerIdAndDateBetweenAndStatus(partnerId, range[0], range[1], AppointmentStatus.Completed);
        long cancelledAppointments = appointmentRepository
                .countByPartnerIdAndDateBetweenAndStatus(partnerId, range[0], range[1], AppointmentStatus.Cancelled);
        long totalProperties = propertyRepository.countByPartnerUser_PartnerId(partnerId);
        long totalEmployees = employeeRepository.countByProperty_PartnerUser_PartnerId(partnerId);
        long totalServices = servicesRepository.countByProperty_PartnerUser_PartnerId(partnerId);

        long activeProperties = propertyRepository
                .countByPartnerUser_PartnerIdAndStatus(partnerId, StatusEnum.ACTIVE);
        long activeEmployees = employeeRepository
                .countByProperty_PartnerUser_PartnerIdAndStatus(partnerId, StatusEnum.ACTIVE);
        long activeServices = servicesRepository.countInUseByPartnerId(partnerId);

        DashboardStatsResponse response = new DashboardStatsResponse();
        response.setFirstName(appUser != null ? appUser.getFirstName() : null);
        response.setBusinessName(partner.getBusinessName());
        response.setPeriod(normalizedPeriod);
        response.setTotalAppointments(totalAppointments);
        response.setBookedAppointments(bookedAppointments);
        response.setCompletedAppointments(completedAppointments);
        response.setCancelledAppointments(cancelledAppointments);
        response.setTotalProperties(totalProperties);
        response.setTotalEmployees(totalEmployees);
        response.setTotalServices(totalServices);
        // Derive inactive from totals so legacy rows with unexpected status
        // values still add up to the total shown in the header.
        response.setActiveProperties(activeProperties);
        response.setInactiveProperties(Math.max(0, totalProperties - activeProperties));
        response.setActiveEmployees(activeEmployees);
        response.setInactiveEmployees(Math.max(0, totalEmployees - activeEmployees));
        response.setActiveServices(activeServices);
        response.setInactiveServices(Math.max(0, totalServices - activeServices));
        return response;
    }

    // ---- helpers ----

    private String normalizePeriod(String period) {
        if (period == null) return "MONTH";
        String p = period.trim().toUpperCase();
        return switch (p) {
            case "TODAY", "MONTH", "YEAR" -> p;
            default -> "MONTH";
        };
    }

    private LocalDate[] resolveRange(String period) {
        LocalDate today = LocalDate.now();
        return switch (period) {
            case "TODAY" -> new LocalDate[]{today, today};
            case "YEAR" -> new LocalDate[]{
                    today.withDayOfYear(1),
                    today.withMonth(12).withDayOfMonth(31)
            };
            default -> {
                YearMonth ym = YearMonth.from(today);
                yield new LocalDate[]{ym.atDay(1), ym.atEndOfMonth()};
            }
        };
    }
}
