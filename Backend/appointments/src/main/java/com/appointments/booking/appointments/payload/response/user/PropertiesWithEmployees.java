package com.appointments.booking.appointments.payload.response.user;

import com.appointments.booking.appointments.model.patner.Employee;

import java.util.List;

public class PropertiesWithEmployees {

    private Long propertyId;

    private String propertyName;

    private String buildingNo;

    private String street;

    private String city;

    private String state;

    private String country;

    private String zipCode;

    private List<Employee> employees;
}
