import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import Header from "../../components/partnercomponent/Header";
import {
  addPropertyService,
  getPropertyServices,
  deletePropertyService,
  updatePropertyService,
} from "../../api/authService";
import StyleSheet from "./Employee.module.css";
import svcStyles from "../../components/partnercomponent/PropertyServicesModal.module.css";

/**
 * PropertyServices
 * -----------------
 * Full-page "Manage Services" screen, reached via its own route (instead of
 * the old in-place modal) so it behaves like Manage Employees: a real page
 * with its own URL, back button, and browser history entry.
 */
export default function PropertyServices() {
  const location = useLocation();
  const navigate = useNavigate();
  const { properties, userType } = useContext(PartnerAuthContext) || {};
  const isManager = userType === "manager";
  const basePath = isManager ? "/partner/manager" : "/partner";
  const dashboardPath = `${basePath}/dashboard`;

  // Resolve propertyId without exposing it in the URL.
  // Priority: nav state -> persisted fallback (refresh-safe).
  const propertyId = useMemo(() => {
    const fromState = location.state?.propertyId;
    if (fromState != null && fromState !== "") {
      try {
        sessionStorage.setItem("currentPropertyId", String(fromState));
      } catch {
        // ignore storage failures
      }
      return fromState;
    }
    try {
      return sessionStorage.getItem("currentPropertyId");
    } catch {
      return null;
    }
  }, [location.state]);

  const propertyFromContext = useMemo(() => {
    if (!propertyId || !Array.isArray(properties)) return null;
    return (
      properties.find((p) => {
        const pid = p.propertyId || p.id;
        return String(pid) === String(propertyId);
      }) || null
    );
  }, [properties, propertyId]);

  const propertyDetails =
    location.state?.propertyDetails || propertyFromContext || null;
  const propertyName =
    propertyDetails?.propertyName || propertyDetails?.name || "Property";
  const fullAddress = [
    [propertyDetails?.buildingNo, propertyDetails?.street]
      .filter(Boolean)
      .join(" "),
    [propertyDetails?.city, propertyDetails?.state, propertyDetails?.zipCode]
      .filter(Boolean)
      .join(", "),
    propertyDetails?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
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
    if (!propertyId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await getPropertyServices(propertyId);
      const list = response?.data?.data?.services || [];
      setServices(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleBackToProperty = () => {
    if (isManager) {
      navigate(dashboardPath);
      return;
    }
    navigate(`${basePath}/property`, {
      state: { propertyId, propertyDetails },
    });
  };

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
      let response;
      if (editingServiceId) {
        response = await updatePropertyService(
          propertyId,
          editingServiceId,
          newService,
        );
      } else {
        response = await addPropertyService(propertyId, newService);
      }

      const list = response?.data?.data?.services;
      if (Array.isArray(list)) {
        setServices(list);
      } else {
        await fetchServices();
      }

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
        err?.response?.data?.message ||
          (editingServiceId
            ? "Failed to update service"
            : "Failed to add service"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = (serviceId) => {
    if (!serviceId) {
      setError("Service ID is missing. Please try again.");
      return;
    }
    setServiceToDelete(serviceId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    try {
      setIsSubmitting(true);
      const response = await deletePropertyService(propertyId, serviceToDelete);
      const list = response?.data?.data?.services;
      if (Array.isArray(list)) {
        setServices(list);
      } else {
        setServices((prev) => prev.filter((s) => s.serviceId !== serviceToDelete));
      }
      setShowDeleteConfirm(false);
      setServiceToDelete(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete service");
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
      serviceName: service.serviceName || "",
      eachServiceTimeInMinus: String(service.eachServiceTimeInMinus ?? ""),
      serviceFee: String(service.serviceFee ?? ""),
      description: service.description || "",
    });
    setShowAddForm(true);
    setError(null);
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

  const hasServices = services && services.length > 0;

  if (!propertyId) {
    return (
      <div className={StyleSheet.MainContainer}>
        <div className={StyleSheet.HeaderContainer}>
          <Header />
        </div>
        <div className={StyleSheet.BodyContainer}>
          <div className={StyleSheet.EmptyState}>
            <div className={StyleSheet.EmptyIcon}>🏢</div>
            <h2>No property selected</h2>
            <p>Select a property from the dashboard to manage its services.</p>
            <button
              type="button"
              className={StyleSheet.PrimaryAction}
              onClick={() => navigate(dashboardPath)}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={StyleSheet.MainContainer}>
      <div className={StyleSheet.HeaderContainer}>
        <Header />
      </div>

      <div className={StyleSheet.BodyContainer}>
        <div className={StyleSheet.TopBar}>
          <button
            type="button"
            className={StyleSheet.BackLink}
            onClick={handleBackToProperty}
          >
            <span aria-hidden="true">←</span> Back to Property
          </button>
        </div>

        <section className={StyleSheet.HeroCard}>
          <div className={StyleSheet.HeroHeader}>
            <div className={StyleSheet.HeroHeading}>
              <h1 className={StyleSheet.PageTitle}>Services</h1>
              <p className={StyleSheet.SubLine}>
                <span className={StyleSheet.SubAccent}>{propertyName}</span>
                {fullAddress && (
                  <>
                    <span className={StyleSheet.SubDot} aria-hidden="true">
                      •
                    </span>
                    <span className={StyleSheet.SubText}>{fullAddress}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div
            style={{
              background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "20px",
              color: "#991b1b",
              fontSize: "0.95rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 2px 8px rgba(220, 38, 38, 0.1)",
            }}
            role="alert"
          >
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className={StyleSheet.EmptyState}>
            <p>Loading services…</p>
          </div>
        ) : (
          <>
            {!hasServices && !showAddForm && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
                  borderRadius: "14px",
                  marginBottom: "24px",
                  border: "1px dashed #d1d5db",
                }}
              >
                <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>📋</div>
                <h3 style={{ color: "#1f2937", marginTop: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                  No Services Yet
                </h3>
                <p style={{ color: "#6b7280", marginBottom: "24px", fontSize: "0.95rem" }}>
                  Add your first service to start managing your offerings
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  style={{
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "14px 28px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 25px rgba(99, 102, 241, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(99, 102, 241, 0.3)";
                  }}
                >
                  ➕ Add First Service
                </button>
              </div>
            )}

            {showAddForm && (
              <form
                onSubmit={handleAddService}
                className={svcStyles.AddServiceForm}
              >
                <h3 style={{ marginTop: 0, color: "#1f2937", fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.3px" }}>
                  {editingServiceId ? "✏️ Edit Service" : "➕ Add New Service"}
                </h3>

                <div className={svcStyles.FormGroup}>
                  <label className={svcStyles.FormLabel}>
                    Service Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newService.serviceName}
                    onChange={(e) =>
                      setNewService({ ...newService, serviceName: e.target.value })
                    }
                    placeholder="e.g., Cleaning, Maintenance"
                    className={svcStyles.FormInput}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className={svcStyles.FormGroup}>
                    <label className={svcStyles.FormLabel}>
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
                      className={svcStyles.FormInput}
                      min="1"
                    />
                  </div>

                  <div className={svcStyles.FormGroup}>
                    <label className={svcStyles.FormLabel}>
                      Fee <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={newService.serviceFee}
                      onChange={(e) =>
                        setNewService({ ...newService, serviceFee: e.target.value })
                      }
                      placeholder="e.g., 50"
                      className={svcStyles.FormInput}
                    />
                  </div>
                </div>

                <div className={svcStyles.FormGroup}>
                  <label className={svcStyles.FormLabel}>Description</label>
                  <textarea
                    value={newService.description}
                    onChange={(e) =>
                      setNewService({ ...newService, description: e.target.value })
                    }
                    placeholder="Service description (optional)"
                    className={svcStyles.FormInput}
                    rows="3"
                  />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={svcStyles.AddButton}
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
                    className={svcStyles.CancelButton}
                  >
                    Back
                  </button>
                </div>
              </form>
            )}

            {hasServices && !showAddForm && (
              <div className={svcStyles.ServicesList}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <h3 style={{ margin: 0, color: "#1f2937", fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.3px" }}>
                    📋 Services ({services.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px 20px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      boxShadow: "0 2px 8px rgba(99, 102, 241, 0.2)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 4px 15px rgba(99, 102, 241, 0.3)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 2px 8px rgba(99, 102, 241, 0.2)";
                    }}
                  >
                    ➕ Add Service
                  </button>
                </div>

                <div className={svcStyles.ServicesGrid}>
                  {services.map((service) => (
                    <div key={service.serviceId} className={svcStyles.ServiceCard}>
                      <div className={svcStyles.ServiceName}>
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
                        <div className={svcStyles.ServiceDescription}>
                          {service.description}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button
                          type="button"
                          onClick={() => handleEditService(service)}
                          className={svcStyles.EditButton}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(service.serviceId)}
                          className={svcStyles.DeleteButton}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <div className={svcStyles.ModalOverlay} style={{ zIndex: 1001 }}>
          <div
            className={svcStyles.ModalContainer}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px", padding: "32px" }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⚠️</div>
              <h3 style={{ marginTop: 0, color: "#1f2937", marginBottom: "12px", fontSize: "1.2rem", fontWeight: 800 }}>
                Delete Service?
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "28px", fontSize: "0.95rem", lineHeight: 1.5 }}>
                This will unassign all employees from this service. This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={cancelDelete}
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = "#e5e7eb";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "#f3f4f6";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                    color: "#991b1b",
                    border: "1px solid #fca5a5",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    fontWeight: 700,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontSize: "0.95rem",
                    transition: "all 0.2s ease",
                    opacity: isSubmitting ? 0.65 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!isSubmitting) {
                      e.target.style.background = "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)";
                      e.target.style.boxShadow = "0 4px 12px rgba(153, 27, 27, 0.2)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  {isSubmitting ? "Deleting..." : "🗑️ Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
