import api from "./api";

export const loginUser = (credentials) =>
  api.post("appUser/login", credentials);

export const registerUser = (data) => api.post("registerUser", data);

export const registerPartner = (data) => api.post("partnerUser/register", data);

export const loginPartner = (data) => api.post("partnerUser/login", data);

export const loginManager = (data) => api.post("manager/login", data);

/* Partner End Points*/
export const updatePartner = (partnerId, data) =>
  api.patch(`partnerUser/profileUpdate/${partnerId}`, data);

export const getPartnerProfile = () => api.get(`partnerUser/getPartnerProfile`);

export const registerProperty = (data) =>
  api.post("partnerUser/registerProperty", data);

export const updateProperty = (propertyId, data) =>
  api.patch(`partnerUser/updateProperty/${propertyId}`, data);

export const getEmployees = (propertyId) =>
  api.get(`partnerUser/getEmployees/${propertyId}`);

export const getAllProperties = () => api.get(`partnerUser/getAllProperties`);

export const registerEmployee = (propertyId, data) =>
  api.post(`partnerUser/registerEmployee/${propertyId}`, data);

export const updateEmployee = (propertyId, employeeId, data) =>
  api.patch(`partnerUser/updateEmployee/${propertyId}/${employeeId}`, data);

export const getAvailabilityDetails = (propertyId, employeeId) =>
  api.get(`partnerUser/getAvailabilityDetails/${propertyId}/${employeeId}`);

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
    `partnerUser/getEmployees/${propertyId}`,
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
  api.get(`PartnerUser/getServicesToEmployees/${employeeId}`);

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
export const getPropertyAppointments = (propertyId, date) => {
  const baseURL = (api?.defaults?.baseURL || "").toString();
  const hasAppointmentsPrefix = /\/appointments\/?$/i.test(baseURL);
  const endpointPrefix = hasAppointmentsPrefix ? "" : "/appointments";

  return api.get(
    `${endpointPrefix}/partnerUser/getAppointments/${propertyId}`,
    {
      params: {
        date,
      },
    },
  );
};
