package com.appointments.booking.appointments.payload.response.notification;

import com.appointments.booking.appointments.model.notification.NotificationType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long notificationId;
    private String title;
    private String message;
    private NotificationType type;

    // Force JSON key to "isRead" — Lombok bool getter "isRead()" would otherwise serialize as "read"
    @JsonProperty("isRead")
    private boolean isRead;

    private String referenceId;
    private LocalDateTime createdAt;
}
