package com.appointments.booking.appointments.exception;

public class UnauthorizedAccessOrUnknownException extends RuntimeException{
    public UnauthorizedAccessOrUnknownException(String message){
        super(message);
    }
}
