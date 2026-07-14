package com.appointments.booking.appointments.payload.response;

import lombok.Data;

@Data
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;

    // sign up success full response
    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    // User login success full response
    public ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> failure(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
