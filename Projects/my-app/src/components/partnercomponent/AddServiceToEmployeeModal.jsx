import { useState, useEffect, useCallback } from "react";
import {
  getPropertyServices,
  addServicesToEmployee,
} from "../../api/authService";
import StyleSheet from "./PropertyServicesModal.module.css";

export default function AddServiceToEmployeeModal({
  isOpen,
  onClose,
  employee,
  property,
  onServiceAdded,
}) {
  const [propertyServices, setPropertyServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchPropertyServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const propertyId = property?.propertyId || property?.id;
      const response = await getPropertyServices(propertyId);

      if (response.data?.data?.Services) {
        // Add index as serviceId if not present
        const servicesWithId = response.data.data.Services.map(
          (service, index) => ({
            ...service,
            serviceId: service.serviceId || index,
          })
        );
        setPropertyServices(servicesWithId);
      } else {
        setPropertyServices([]);
      }
      setSelectedServices(new Set());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch services");
      setPropertyServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [property]);

  // Fetch property services when modal opens
  useEffect(() => {
    if (isOpen && property) {
      fetchPropertyServices();
    }
  }, [isOpen, property, fetchPropertyServices]);

  const handleServiceToggle = (serviceId) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const handleAddServices = async () => {
    if (selectedServices.size === 0) {
      setError("Please select at least one service");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const employeeId = employee?.id || employee?.employeeId;
      const propertyId = property?.propertyId || property?.id;
      const serviceIds = Array.from(selectedServices);

      await addServicesToEmployee(employeeId, propertyId, serviceIds);

      setSuccessMessage("Services added successfully!");

      // Call the callback to refresh services in parent component
      if (onServiceAdded) {
        onServiceAdded();
      }

      setTimeout(() => {
        setSuccessMessage("");
        setSelectedServices(new Set());
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add services");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={StyleSheet.ModalOverlay}>
      <div
        className={StyleSheet.ModalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={StyleSheet.ModalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.8rem" }}>➕</span>
            <h2 className={StyleSheet.ModalTitle}>
              Add Services to {employee?.firstName} {employee?.lastName}
            </h2>
          </div>
          <button
            className={StyleSheet.CloseButton}
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={StyleSheet.ModalBody}>
          {/* Error Message */}
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "16px",
                color: "#dc2626",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "16px",
                color: "#16a34a",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              ✓ {successMessage}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>
              <p style={{ color: "#6b7280" }}>Loading services...</p>
            </div>
          ) : propertyServices.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                background: "#f9fafb",
                borderRadius: "12px",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📋</div>
              <h3 style={{ color: "#1f2937", marginTop: 0 }}>
                No Services Available
              </h3>
              <p style={{ color: "#6b7280" }}>
                This property has no services. Please create services first.
              </p>
            </div>
          ) : (
            <div>
              <h3
                style={{ marginTop: 0, color: "#1f2937", marginBottom: "16px" }}
              >
                Select services to add:
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                {propertyServices.map((service) => (
                  <label
                    key={service.serviceId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background: selectedServices.has(service.serviceId)
                        ? "#f0f9ff"
                        : "#fff",
                      borderColor: selectedServices.has(service.serviceId)
                        ? "#0ea5e9"
                        : "#e5e7eb",
                    }}
                    onMouseOver={(e) => {
                      if (!selectedServices.has(service.serviceId)) {
                        e.currentTarget.style.background = "#f9fafb";
                        e.currentTarget.style.borderColor = "#d1d5db";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!selectedServices.has(service.serviceId)) {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.has(service.serviceId)}
                      onChange={() => handleServiceToggle(service.serviceId)}
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer",
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: "#1f2937" }}>
                        {service.serviceName}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                        ⏱️ {service.eachServiceTimeInMinus} min • 💰{" "}
                        {service.serviceFee}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {selectedServices.size > 0 && (
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "16px",
                    color: "#1e40af",
                    fontSize: "0.9rem",
                  }}
                >
                  ℹ️ {selectedServices.size} service(s) selected
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={StyleSheet.ModalFooter}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#d1d5db";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#e5e7eb";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddServices}
            disabled={isSubmitting || propertyServices.length === 0}
            style={{
              background:
                selectedServices.size > 0
                  ? "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)"
                  : "#d1d5db",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontWeight: 600,
              cursor:
                isSubmitting || propertyServices.length === 0
                  ? "not-allowed"
                  : "pointer",
              transition: "all 0.2s ease",
              opacity: isSubmitting ? 0.7 : 1,
            }}
            onMouseOver={(e) => {
              if (!isSubmitting && propertyServices.length > 0) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(99, 102, 241, 0.4)";
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {isSubmitting ? "Adding..." : "Add Services"}
          </button>
        </div>
      </div>
    </div>
  );
}
