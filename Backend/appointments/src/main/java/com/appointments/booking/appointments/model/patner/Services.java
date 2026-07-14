package com.appointments.booking.appointments.model.patner;
import com.appointments.booking.appointments.model.enums.StatusEnum;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Table(name = "services")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Services {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_id")
    private Long serviceId;

    @Column(name = "service_name", nullable = false, length = 45)
    private String serviceName;

    @Column(name = "each_appointment_time_in_minus", nullable = false, length = 10)
    private short eachServiceTimeInMinus;

    @Column(name="service_fee")
    private Double serviceFee;

    @Column(name = "description", length = 500)
    private String description;

    /**
     * ACTIVE when at least one employee offers this service, INACTIVE when
     * nobody does. Kept in sync by EmployeeServiceImpl (assign / unassign /
     * employee delete) and re-derived in bulk by StatusUpdateServiceImpl.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 25)
    private StatusEnum status;

    /** New services start INACTIVE until an employee is assigned to them. */
    @PrePersist
    private void applyStatusDefault() {
        if (status == null) {
            status = StatusEnum.INACTIVE;
        }
    }

    /**
     * The single source of truth for what this service's status SHOULD be,
     * derived from the employee link. Callers that mutate the employee list
     * use this to refresh the stored column.
     */
    @Transient
    public StatusEnum computeStatusFromEmployees() {
        return (employees == null || employees.isEmpty())
                ? StatusEnum.INACTIVE
                : StatusEnum.ACTIVE;
    }

    @ManyToMany(mappedBy = "services", fetch = FetchType.LAZY)
    @JsonIgnoreProperties("services")
    private List<Employee> employees;

    @ManyToOne
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

}
