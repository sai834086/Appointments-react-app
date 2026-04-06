import { useState, useEffect, useCallback } from "react";
import {
  addPropertyService,
  getPropertyServices,
  deletePropertyService,
  updatePropertyService,
} from "../../api/authService";
import StyleSheet from "./PropertyServicesModal.module.css";

export default function PropertyServicesModal({ isOpen, onClose, property }) {
  const [services, setServices] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [_isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [newService, setNewService] = useState({
    serviceName: "",
    eachServiceTimeInMinus: "",
    serviceFee: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
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
        setServices(servicesWithId);
      } else {
        setServices([]);
      }
      setShowAddForm(false);
      setEditingServiceId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch services");
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [property]);

  // Initialize services when modal opens
  useEffect(() => {
    if (isOpen && property) {
      fetchServices();
    }
  }, [isOpen, property, fetchServices]);

  const handleAddService = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newService.serviceName.trim()) {
      setError("Please enter a service name");
      return;
    }

    if (!newService.eachServiceTimeInMinus) {
      setError("Please enter service time in minutes");
      return;
    }

    if (!newService.serviceFee) {
      setError("Please enter service fee");
      return;
    }

    try {
      setIsSubmitting(true);
      const propertyId = property?.propertyId || property?.id;

      let response;

      if (editingServiceId) {
        // Update existing service
        response = await updatePropertyService(
          propertyId,
          editingServiceId,
          newService
        );
      } else {
        // Add new service
        response = await addPropertyService(propertyId, newService);
      }

      // Update services list with response data
      if (response.data?.data?.Services) {
        // Map services with index as fallback serviceId
        const servicesWithId = response.data.data.Services.map(
          (service, index) => ({
            ...service,
            serviceId: service.serviceId || index,
          })
        );
        setServices(servicesWithId);
      } else {
        // Fallback if structure is different
        const serviceToAdd = {
          serviceId: Date.now(),
          ...newService,
          propertyId: propertyId,
        };
        setServices([...services, serviceToAdd]);
      }

      // Reset form
      setNewService({
        serviceName: "",
        eachServiceTimeInMinus: "",
        serviceFee: "",
        description: "",
      });
      setShowAddForm(false);
      setEditingServiceId(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (editingServiceId
            ? "Failed to update service"
            : "Failed to add service")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!serviceId) {
      setError("Service ID is missing. Please try again.");
      return;
    }

    // Show confirmation modal instead of window.confirm
    setServiceToDelete(serviceId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      setIsSubmitting(true);
      const propertyId = property?.propertyId || property?.id;
      const response = await deletePropertyService(propertyId, serviceToDelete);

      // Update services list with response data
      if (response.data?.data?.Services) {
        setServices(response.data.data.Services);
      } else {
        // Fallback: filter out the deleted service
        setServices(services.filter((s) => s.serviceId !== serviceToDelete));
      }
      setShowDeleteConfirm(false);
      setServiceToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setServiceToDelete(null);
  };

  const handleEditService = (service) => {
    setEditingServiceId(service.serviceId);
    setNewService({
      serviceName: service.serviceName,
      eachServiceTimeInMinus: service.eachServiceTimeInMinus.toString(),
      serviceFee: service.serviceFee.toString(),
      description: service.description || "",
    });
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingServiceId(null);
    setNewService({
      serviceName: "",
      eachServiceTimeInMinus: "",
      serviceFee: "",
      description: "",
    });
    setError(null);
  };

  if (!isOpen) return null;

  const hasServices = services && services.length > 0;

  return (
    <div className={StyleSheet.ModalOverlay}>
      <div
        className={StyleSheet.ModalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={StyleSheet.ModalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.8rem" }}>⚙️</span>
            <h2 className={StyleSheet.ModalTitle}>
              Manage Services - {property?.propertyName || property?.name}
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

          {/* NO SERVICES - SHOW ADD FORM */}
          {!hasServices && !showAddForm && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                background: "#f9fafb",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📋</div>
              <h3 style={{ color: "#1f2937", marginTop: 0 }}>
                No Services Found
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "20px" }}>
                Add your first service to get started
              </p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "12px 24px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 6px 20px rgba(99, 102, 241, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(99, 102, 241, 0.3)";
                }}
              >
                ➕ Add First Service
              </button>
            </div>
          )}

          {/* SHOW ADD FORM */}
          {showAddForm && (
            <form
              onSubmit={handleAddService}
              className={StyleSheet.AddServiceForm}
            >
              <h3
                style={{ marginTop: 0, color: "#1f2937", fontSize: "1.1rem" }}
              >
                {editingServiceId ? "✏️ Edit Service" : "➕ Add New Service"}
              </h3>

              {/* Service Name */}
              <div className={StyleSheet.FormGroup}>
                <label className={StyleSheet.FormLabel}>
                  Service Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={newService.serviceName}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      serviceName: e.target.value,
                    })
                  }
                  placeholder="e.g., Cleaning, Maintenance"
                  className={StyleSheet.FormInput}
                />
              </div>

              {/* Time & Fee Row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {/* Service Time */}
                <div className={StyleSheet.FormGroup}>
                  <label className={StyleSheet.FormLabel}>
                    Time (min) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={newService.eachServiceTimeInMinus}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        eachServiceTimeInMinus: e.target.value,
                      })
                    }
                    placeholder="e.g., 60"
                    className={StyleSheet.FormInput}
                    min="1"
                  />
                </div>

                {/* Service Fee */}
                <div className={StyleSheet.FormGroup}>
                  <label className={StyleSheet.FormLabel}>
                    Fee <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newService.serviceFee}
                    onChange={(e) =>
                      setNewService({
                        ...newService,
                        serviceFee: e.target.value,
                      })
                    }
                    placeholder="e.g., 50"
                    className={StyleSheet.FormInput}
                  />
                </div>
              </div>

              {/* Description */}
              <div className={StyleSheet.FormGroup}>
                <label className={StyleSheet.FormLabel}>Description</label>
                <textarea
                  value={newService.description}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      description: e.target.value,
                    })
                  }
                  placeholder="Service description (optional)"
                  className={StyleSheet.FormInput}
                  rows="3"
                />
              </div>

              {/* Form Buttons */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={StyleSheet.AddButton}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingServiceId
                    ? "Update Service"
                    : "Add Service"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className={StyleSheet.CancelButton}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  Back
                </button>
              </div>
            </form>
          )}

          {/* SHOW SERVICES LIST */}
          {hasServices && !showAddForm && (
            <div className={StyleSheet.ServicesList}>
              <h3
                style={{ marginTop: 0, color: "#1f2937", fontSize: "1.1rem" }}
              >
                📋 Services ({services.length})
              </h3>

              <div className={StyleSheet.ServicesGrid}>
                {services.map((service) => (
                  <div
                    key={service.serviceId}
                    className={StyleSheet.ServiceCard}
                  >
                    <div className={StyleSheet.ServiceName}>
                      {service.serviceName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#6b7280",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ marginRight: 12 }}>
                        ⏱️ {service.eachServiceTimeInMinus} min
                      </span>
                      <span>💰 {service.serviceFee}</span>
                    </div>
                    {service.description && (
                      <div className={StyleSheet.ServiceDescription}>
                        {service.description}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 12,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleEditService(service)}
                        className={StyleSheet.EditButton}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.serviceId)}
                        className={StyleSheet.DeleteButton}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Service Button at Bottom */}
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                style={{
                  width: "100%",
                  marginTop: "24px",
                  padding: "12px 20px",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                  fontSize: "0.95rem",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 6px 20px rgba(99, 102, 241, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(99, 102, 241, 0.3)";
                }}
              >
                ➕ Add New Service
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={StyleSheet.ModalFooter}>
          <button
            type="button"
            onClick={onClose}
            className={StyleSheet.CloseModalButton}
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={StyleSheet.ModalOverlay} style={{ zIndex: 1001 }}>
          <div
            className={StyleSheet.ModalContainer}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "400px",
              padding: "30px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⚠️</div>
              <h3
                style={{ marginTop: 0, color: "#1f2937", marginBottom: "10px" }}
              >
                Delete Service
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "30px" }}>
                Do you want to unassign all employees from this service and
                delete? This action cannot be undone.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  onClick={cancelDelete}
                  style={{
                    background: "#e5e7eb",
                    color: "#374151",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "0.95rem",
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
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  style={{
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "0.95rem",
                    opacity: isSubmitting ? 0.7 : 1,
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                  }}
                  onMouseOver={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 6px 20px rgba(239, 68, 68, 0.4)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(239, 68, 68, 0.3)";
                  }}
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
