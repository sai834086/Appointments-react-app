package com.appointments.booking.appointments.service.notification;

import com.appointments.booking.appointments.model.notification.NotificationType;
import com.appointments.booking.appointments.payload.response.notification.NotificationResponse;

import java.util.List;

public interface NotificationService {

    void createNotification(Long userId, String title, String message, NotificationType type, String referenceId);

    List<NotificationResponse> getNotificationsForUser(Long userId);

    long getUnreadCount(Long userId);

    void markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);
}
