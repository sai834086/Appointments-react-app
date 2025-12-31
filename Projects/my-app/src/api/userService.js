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
