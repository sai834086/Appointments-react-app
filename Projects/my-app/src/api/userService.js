import api from "./api";

/* App User End Points */
export const getAllPartners = (data) =>
  api.get(
    `appUser/getAllPartnerBusinesses/${data.country}/${data.state}/${data.city}`
  );

export const getAllPropertiesToAppUser = (data) =>
  api.get(`appUser/getAllProperties/${data.partnerId}`);

export const getEmployeesToAppUser = (data) => {
  return api.get(`appUser/getAllEmployees/${data.propertyId}`);
};

export const getAvailabilityToAppUser = (employeeId) => {
  return api.get(`appUser/getAvailability/${employeeId}`).then((response) => {
    console.log("getAvailabilityToAppUser response:", response);
    console.log("response.data:", response.data);
    return response;
  });
};

export const getAllServicesByPartner = (partnerId) =>
  api.get(`appUser/getAllServices/${partnerId}`);

export const getEmployeesForService = (propertyId, serviceId) => {
  return api.get(`appUser/getAllEmployees/${propertyId}/${serviceId}`);
};

export const getAvailableSlots = (serviceId, employeeId, date) => {
  let dateString;
  if (date instanceof Date) {
    // Convert to local date string (YYYY-MM-DD) without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    dateString = `${year}-${month}-${day}`;
  } else {
    dateString = date;
  }
  return api.get(`appUser/getAvailability/${serviceId}/${employeeId}`, {
    params: { date: dateString },
  });
};

export const bookAppointment = (appointmentRequest) => {
  return api.post("appUser/bookAppointment", appointmentRequest);
};

export const getBookings = () => {
  return api.get("appUser/getBookings").then((response) => {
    console.log("getBookings response:", response);
    console.log("Bookings data:", response.data);
    return response;
  });
};

export const cancelBooking = (appointmentId) => {
  return api.patch(`appUser/cancelBooking/${appointmentId}`);
};

export const rescheduleAppointment = (rescheduleRequest) => {
  return api.put("appUser/reschedule", rescheduleRequest);
};

export const getUserDetails = () => {
  return api.get("appUser/userDetails");
};

export const updateUserProfile = (fieldName, value) => {
  const updateRequest = {
    [fieldName]: value,
  };
  return api.patch("appUser/update", updateRequest);
};
