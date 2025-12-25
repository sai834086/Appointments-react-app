import { PartnerAuthContext } from "./context/PartnerAuthContext";
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StyleSheet from "./PartnerDashboard.module.css";
import ProfileIcon from "../../components/partnercomponent/dashboardcomponents/ProfileIcon";
import Header from "../../components/partnercomponent/Header";
import PropertyRegister from "../../components/partnercomponent/PropertyRegister";
import PropertyServicesModal from "../../components/partnercomponent/PropertyServicesModal";
import { getEmployees, registerProperty } from "../../api/authService";

export default function PartnerDashboard() {
  const { partnerProfile, properties, refreshProperties } =
    useContext(PartnerAuthContext);
  const navigate = useNavigate();
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [isManageServicesOpen, setIsManageServicesOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageType, setSuccessMessageType] = useState("add"); // "add" or "update"

  // Monitor properties changes
  useEffect(() => {
    // Properties monitoring for debugging purposes
  }, [properties]);

  const handlePropertySubmit = async (formData) => {
    const response = await registerProperty(formData);

    if (response.data.success) {
      // Refresh properties from server to get latest data
      await refreshProperties();

      // Show success message
      setSuccessMessageType("add");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);

      setIsPropertyFormOpen(false);
    } else {
      throw new Error(response.data.message || "Registration failed");
    }
  };

  const handleManageServices = (property) => {
    setSelectedProperty(property);
    setIsManageServicesOpen(true);
  };

  const handleCloseManageServices = () => {
    setIsManageServicesOpen(false);
    setSelectedProperty(null);
  };

  const handleViewEmployees = async (property) => {
    const propertyId = property.propertyId || property.id;

    try {
      // Send request to server to get employees for this property
      const response = await getEmployees(propertyId);

      // Extract employees from the correct path: response.data.data.allEmployeeDetails
      const employees = response.data?.data?.allEmployeeDetails || [];

      // Navigate to employee page with property ID, details, and employees data
      navigate(`/partner/employee?propertyId=${propertyId}`, {
        state: {
          propertyId: propertyId,
          propertyDetails: property,
          employees: employees,
        },
      });
    } catch {
      // If there's an error fetching employees, still navigate but without employee data
      // The Employee page will handle fetching employees itself
      navigate(`partner/employee?propertyId=${propertyId}`, {
        state: {
          propertyId: propertyId,
          propertyDetails: property,
          employees: [],
        },
      });
    }
  };
  return (
    <div className={StyleSheet.MainContainer}>
      <div className={StyleSheet.HeaderContainer}>
        <Header />
      </div>
      <div className={StyleSheet.BodyContainer}>
        {/* Welcome Section */}
        <div className={StyleSheet.WelcomeSection}>
          <div className={StyleSheet.WelcomeContent}>
            <h1 className={StyleSheet.WelcomeTitle}>
              Welcome back, {partnerProfile?.firstName}! 👋
            </h1>
          </div>
          <div className={StyleSheet.QuickStats}>
            <div className={StyleSheet.StatCard}>
              <div className={StyleSheet.StatIcon}>🏠</div>
              <div className={StyleSheet.StatContent}>
                <h3>{properties?.length || 0}</h3>
                <p>Total Properties</p>
              </div>
            </div>
            <div className={StyleSheet.StatCard}>
              <div className={StyleSheet.StatIcon}>
                {partnerProfile?.status === "ACTIVE"
                  ? "✅"
                  : partnerProfile?.status === "INACTIVE"
                  ? "❌"
                  : partnerProfile?.status === "PENDING"
                  ? "⏳"
                  : "❓"}
              </div>
              <div className={StyleSheet.StatContent}>
                <h3>{partnerProfile?.status || "Unknown"}</h3>
                <p>Account Status</p>
              </div>
            </div>
            <div className={StyleSheet.StatCard}>
              <div className={StyleSheet.StatIcon}>
                {partnerProfile?.isVerified ? "✅" : "❌"}
              </div>
              <div className={StyleSheet.StatContent}>
                <h3>
                  {partnerProfile?.isVerified ? "Verified" : "Not Verified"}
                </h3>
                <p>Verification Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Status Info Note */}
        {partnerProfile?.status === "INACTIVE" && (
          <div className={StyleSheet.InfoNote}>
            <div className={StyleSheet.InfoIcon}>💡</div>
            <div className={StyleSheet.InfoContent}>
              <h4>Activate Your Account</h4>
              <p>
                To make your account status active, please add at least one
                property or ensure you have an active property in your
                portfolio.
              </p>
            </div>
          </div>
        )}

        {/* Action Section */}
        <div className={StyleSheet.ActionSection}>
          <div className={StyleSheet.AddPropertyButton}>
            <button onClick={() => setIsPropertyFormOpen(true)}>
              <span className={StyleSheet.ButtonIcon}>+</span>
              Add New Property
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className={StyleSheet.SuccessMessage}>
            <div className={StyleSheet.SuccessContent}>
              <span className={StyleSheet.SuccessIcon}>✅</span>
              <div className={StyleSheet.SuccessText}>
                <h4>
                  {successMessageType === "add"
                    ? "Property Added Successfully!"
                    : "Property Updated Successfully!"}
                </h4>
                <p>
                  {successMessageType === "add"
                    ? "Your new property has been registered and is now visible in your portfolio."
                    : "Your property has been updated and the changes are now visible in your portfolio."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Properties Section */}
        <div className={`${StyleSheet.PropertiesSection} thin-scrollbar`}>
          <div className={StyleSheet.SectionHeader}>
            <h2>My Properties</h2>
            <span className={StyleSheet.PropertyCount}>
              {properties?.length || 0} properties
            </span>
          </div>

          {properties && properties.length > 0 ? (
            <div className={`${StyleSheet.PropertiesGrid} thin-scrollbar`}>
              {properties.map((property) => (
                <div
                  key={property.propertyId || property.id}
                  className={StyleSheet.PropertyCard}
                >
                  <div className={StyleSheet.PropertyHeader}>
                    <h3>{property.propertyName || property.name}</h3>
                    <span
                      className={StyleSheet.PropertyStatus}
                      style={{
                        backgroundColor:
                          property.status === "INACTIVE"
                            ? "#eab308"
                            : "#10b981",
                      }}
                    >
                      {property.status || "Active"}
                    </span>
                  </div>
                  <div className={StyleSheet.PropertyDetails}>
                    <div className={StyleSheet.AddressSection}>
                      <span className={StyleSheet.AddressIcon}>📍</span>
                      <p>
                        {property.buildingNo} {property.street}
                      </p>
                    </div>
                    <p className={StyleSheet.LocationInfo}>
                      {property.city}, {property.state} {property.zipCode}
                    </p>
                    <p className={StyleSheet.CountryInfo}>{property.country}</p>

                    {/* Property Status Note */}
                    {property.status === "INACTIVE" && (
                      <div className={StyleSheet.PropertyInfoNote}>
                        <div className={StyleSheet.PropertyInfoIcon}>💡</div>
                        <p className={StyleSheet.PropertyInfoText}>
                          To activate this property, add at least one employee
                          or ensure you have an active employee.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className={StyleSheet.PropertyActions}>
                    <button
                      className={StyleSheet.ViewButton}
                      onClick={() => handleViewEmployees(property)}
                    >
                      View Employees
                    </button>
                    <button
                      className={StyleSheet.EditButton}
                      onClick={() => handleManageServices(property)}
                    >
                      Manage Services
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={StyleSheet.NoProperties}>
              <div className={StyleSheet.EmptyIcon}>🏢</div>
              <h3>No properties yet</h3>
              <p>
                Start building your property portfolio by adding your first
                property!
              </p>
              <button
                className={StyleSheet.GetStartedButton}
                onClick={() => setIsPropertyFormOpen(true)}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>

      <PropertyRegister
        isOpen={isPropertyFormOpen}
        onClose={() => setIsPropertyFormOpen(false)}
        onSubmit={handlePropertySubmit}
      />

      <PropertyServicesModal
        isOpen={isManageServicesOpen}
        onClose={handleCloseManageServices}
        property={selectedProperty}
      />
    </div>
  );
}
