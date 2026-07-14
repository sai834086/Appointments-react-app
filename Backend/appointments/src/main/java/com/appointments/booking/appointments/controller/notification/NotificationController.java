package com.appointments.booking.appointments.controller.notification;

import com.appointments.booking.appointments.payload.response.ApiResponse;
import com.appointments.booking.appointments.payload.response.notification.NotificationResponse;
import com.appointments.booking.appointments.security.JwtUserDetails;
import com.appointments.booking.appointments.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appointments/appUser")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** GET all notifications for the logged-in user */
    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotifications(
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        List<NotificationResponse> notifications =
                notificationService.getNotificationsForUser(jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("notifications", notifications);
        payload.put("unreadCount", notifications.stream().filter(n -> !n.isRead()).count());

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    /** GET unread count only (used for badge polling) */
    @GetMapping("/notifications/unreadCount")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        long count = notificationService.getUnreadCount(jwtUserDetails.getId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("unreadCount", count);

        return ResponseEntity.ok(new ApiResponse<>(true, "success", payload));
    }

    /** PATCH mark a single notification as read */
    @PatchMapping("/notifications/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails,
            @PathVariable Long notificationId) {

        notificationService.markAsRead(notificationId, jwtUserDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Marked as read", null));
    }

    /** PATCH mark all notifications as read */
    @PatchMapping("/notifications/markAllRead")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal JwtUserDetails jwtUserDetails) {

        notificationService.markAllAsRead(jwtUserDetails.getId());
        return ResponseEntity.ok(new ApiResponse<>(true, "All marked as read", null));
    }
}
