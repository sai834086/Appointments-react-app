import api from "./api";

export const loginUser = (credentials) =>
  api.post("appUser/login", credentials);

export const registerUser = (data) => api.post("registerUser", data);

export const registerPartner = (data) => api.post("partnerUser/register", data);

export const checkBusinessNameAvailability = (businessName) =>
  api.get("partnerUser/check-business-name", { params: { businessName } });

/* Partner login — two-step: (1) email/phone + password returns
   { requiresOtp: true } and triggers a 6-digit code sent to BOTH the
   account's email and phone (same code, either channel completes login);
   (2) verifyPartnerLoginOtp with that code returns the actual token. */
export const loginPartner = (data) => api.post("partnerUser/login", data);

export const verifyPartnerLoginOtp = (userName, otp) =>
  api.post("partnerUser/login/verify-otp", { userName, otp });

/* Forgot password — three steps: send a 6-digit code to the account's
   email, verify it to get a short-lived reset token, then use that token
   (not the OTP again) to set a new password. */
export const sendForgotPasswordOtp = (email) =>
  api.post("partnerUser/forgot-password/send-otp", { email });

export const verifyForgotPasswordOtp = (email, otp) =>
  api.post("partnerUser/forgot-password/verify-otp", { email, otp });

export const resetPartnerPassword = (resetToken, newPassword, confirmPassword) =>
  api.post("partnerUser/forgot-password/reset-password", {
    resetToken,
    newPassword,
    confirmPassword,
  });

/* Email verification (self-serve, post-signup) */
export const verifyEmail = (token) =>
  api.get("auth/verify-email", { params: { token } });

export const resendVerificationEmail = (email) =>
  api.post("auth/resend-verification", { email });

/* Email verification (pre-signup, step 1 OTP) */
export const sendSignupOtp = (email) => api.post("auth/send-otp", { email });

export const verifySignupOtp = (email, otp) =>
  api.post("auth/verify-otp", { email, otp });

/* Phone verification (pre-signup, step 1 OTP) — same shape as the email
   OTP flow above, backed by PhoneOtpService/SmsService on the backend. */
export const checkPhoneAvailability = (phoneNumber) =>
  api.get("auth/check-phone", { params: { phoneNumber } });

export const sendPhoneOtp = (phoneNumber) =>
  api.post("auth/send-phone-otp", { phoneNumber });

export const verifyPhoneOtp = (phoneNumber, otp) =>
  api.post("auth/verify-phone-otp", { phoneNumber, otp });

export const loginManager = (data) => api.post("manager/login", data);

export const getManagerProfile = () => api.get("manager/profile");

export const loginReceptionist = (data) => api.post("receptionist/login", data);

export const getReceptionistProfile = () => api.get("receptionist/profile");

/* Partner End Points*/
export const updatePartner = (partnerId, data) =>
  api.patch(`partnerUser/profileUpdate/${partnerId}`, data);

export const getPartnerProfile = () => api.get(`partnerUser/getPartnerProfile`);

export const registerProperty = (data) =>
  api.post("partnerUser/registerProperty", data);

export const updateProperty = (propertyId, data) =>
  api.patch(`partnerUser/updateProperty/${propertyId}`, data);

export const deleteProperty = (propertyId) =>
  api.delete(`partnerUser/deleteProperty/${propertyId}`);

export const getEmployees = (propertyId) =>
  api.get(`partnerUser/getEmployeesWithServices/${propertyId}`);

export const getAllProperties = () => api.get(`partnerUser/getAllProperties`);

/* Property Manager End Points */
export const getPropertyManager = (propertyId) =>
  api.get(`partnerUser/getManager/${propertyId}`);

export const addPropertyManager = (propertyId, data) =>
  api.post(`partnerUser/addManager/${propertyId}`, data);

export const updatePropertyManager = (propertyId, data) =>
  api.patch(`partnerUser/updateManager/${propertyId}`, data);

export const removePropertyManager = (propertyId) =>
  api.delete(`partnerUser/removeManager/${propertyId}`);

/* Property Receptionist End Points */
// A property may have any number of receptionists, so this returns a list;
// update/remove are scoped to one receptionist via receptionistId.
export const getPropertyReceptionists = (propertyId) =>
  api.get(`partnerUser/getReceptionists/${propertyId}`);

export const addPropertyReceptionist = (propertyId, data) =>
  api.post(`partnerUser/addReceptionist/${propertyId}`, data);

export const updatePropertyReceptionist = (propertyId, receptionistId, data) =>
  api.patch(
    `partnerUser/updateReceptionist/${propertyId}/${receptionistId}`,
    data,
  );

export const removePropertyReceptionist = (propertyId, receptionistId) =>
  api.delete(
    `partnerUser/removeReceptionist/${propertyId}/${receptionistId}`,
  );

export const registerEmployee = (propertyId, data) =>
  api.post(`partnerUser/registerEmployee/${propertyId}`, data);

export const updateEmployee = (propertyId, employeeId, data) =>
  api.patch(`partnerUser/updateEmployee/${propertyId}/${employeeId}`, data);

export const getAvailabilityWithOffTime = (employeeId) =>
  api.get(`partnerUser/getAvailabilityWithOffTime/${employeeId}`);

export const updateAvailability = (availabilityId, availabilityData) =>
  api.patch(
    `partnerUser/updateAvailability/${availabilityId}`,
    availabilityData,
  );

export const updateAvailabilityAndRefreshEmployee = async (
  availabilityId,
  availabilityData,
  propertyId,
  employeeId,
) => {
  // First update the availability
  await api.patch(
    `partnerUser/updateAvailability/${availabilityId}`,
    availabilityData,
  );

  // Then fetch fresh employee data
  const employeesResponse = await api.get(
    `partnerUser/getEmployeesWithServices/${propertyId}`,
  );
  const availabilityResponse = await api.get(
    `partnerUser/getAvailabilityWithOffTime/${employeeId}`,
  );

  return {
    employees: employeesResponse.data,
    availability: availabilityResponse.data,
  };
};

export const getAllOffTime = (availabilityId) =>
  api.get(`partnerUser/getAllOffTime/${availabilityId}`);

export const addOffTimeRequest = (availabilityId, offTimeData) =>
  api.post(`partnerUser/offTimeRequest/${availabilityId}`, offTimeData);

export const deleteOffTime = (offTimeId) =>
  api.delete(`partnerUser/deleteOffTime/${offTimeId}`);

export const deleteEmployee = (employeeId) =>
  api.delete(`partnerUser/deleteEmployee/${employeeId}`);

export const logoutUser = () => {
  localStorage.removeItem("authToken");
};

// Utility functions

export const reverseGeocode = async (latitude, longitude) => {
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key not configured");
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch geocode data");
    return await response.json();
  } catch {
    return { status: "ERROR", results: [] };
  }
};

export const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error("Google Maps API key not found"));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(window.google);
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google Maps API"));
    };

    document.head.appendChild(script);
  });
};

export const initializePlacesAutocompleteReact = (inputElement) => {
  return new Promise((resolve, reject) => {
    try {
      if (!inputElement) {
        reject(new Error("Input element is required"));
        return;
      }

      if (!window.google || !window.google.maps || !window.google.maps.places) {
        reject(new Error("Google Maps Places library not loaded"));
        return;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputElement,
        {
          types: ["geocode"],
          componentRestrictions: { country: [] }, // Allow all countries
        },
      );

      resolve(autocomplete);
    } catch (error) {
      reject(error);
    }
  });
};

/* Property Services End Points */
export const addPropertyService = (propertyId, data) =>
  api.post(`partnerUser/addService/${propertyId}`, data);

export const getPropertyServices = (propertyId) =>
  api.get(`partnerUser/getServices/${propertyId}`);

export const updatePropertyService = (propertyId, serviceId, data) =>
  api.patch(`partnerUser/updateService/${propertyId}/${serviceId}`, data);

export const deletePropertyService = (propertyId, serviceId) =>
  api.delete(`partnerUser/deleteService/${propertyId}/${serviceId}`);

/* Employee Services End Points */
export const addServicesToEmployee = (employeeId, propertyId, serviceIds) =>
  api.put(
    `partnerUser/addServicesToEmployee/${employeeId}/${propertyId}`,
    serviceIds,
  );

export const getEmployeeServices = (employeeId) =>
  api.get(`partnerUser/getServicesToEmployees/${employeeId}`);

export const deleteEmployeeService = (employeeId, propertyId, serviceId) =>
  api.delete(
    `partnerUser/removeServiceFromEmployee/${propertyId}/${employeeId}/${serviceId}`,
  );

// Alias for compatibility with Employee.jsx
export const removeServiceFromEmployee = (propertyId, employeeId, serviceId) =>
  api.delete(
    `partnerUser/removeServiceFromEmployee/${propertyId}/${employeeId}/${serviceId}`,
  );

/* Partner Appointments End Points */
export const getPropertyAppointments = (propertyId, date) =>
  api.get(`partnerUser/getAppointments/${propertyId}`, { params: { date } });

/* Partner Dashboard Stats */
export const getDashboardStats = (period = "MONTH") =>
  api.get(`partnerUser/dashboard/stats`, { params: { period } });

/* Partner Notifications End Points */
export const getPartnerNotifications = ({
  unread = false,
  page = 0,
  size = 30,
} = {}) =>
  api.get("partnerUser/notifications", { params: { unread, page, size } });

export const getPartnerUnreadCount = () =>
  api.get("partnerUser/notifications/unreadCount");

export const markPartnerNotificationRead = (notificationId) =>
  api.patch(`partnerUser/notifications/${notificationId}/read`);

export const markAllPartnerNotificationsRead = () =>
  api.patch("partnerUser/notifications/markAllRead");
