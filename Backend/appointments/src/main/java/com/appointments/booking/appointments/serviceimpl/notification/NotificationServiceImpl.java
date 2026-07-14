package com.appointments.booking.appointments.serviceimpl.notification;

import com.appointments.booking.appointments.exception.UnauthorizedAccessOrUnknownException;
import com.appointments.booking.appointments.model.appuser.AppUser;
import com.appointments.booking.appointments.model.notification.Notification;
import com.appointments.booking.appointments.model.notification.NotificationType;
import com.appointments.booking.appointments.payload.response.notification.NotificationResponse;
import com.appointments.booking.appointments.repository.notification.NotificationRepository;
import com.appointments.booking.appointments.repository.user.AppUserRepository;
import com.appointments.booking.appointments.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final AppUserRepository appUserRepository;

    @Override
    @Transactional
    public void createNotification(Long userId, String title, String message,
                                   NotificationType type, String referenceId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("User not found"));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .referenceId(referenceId)
                .build();

        notificationRepository.save(notification);
    }

    @Override
    public List<NotificationResponse> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUser_UserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new UnauthorizedAccessOrUnknownException("Notification not found"));

        if (!notification.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedAccessOrUnknownException("Not authorized");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.isRead())
                .referenceId(n.getReferenceId())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
