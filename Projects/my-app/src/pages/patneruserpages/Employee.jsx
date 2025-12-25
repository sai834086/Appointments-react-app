import {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PartnerAuthContext } from "./context/PartnerAuthContext";
import {
  getEmployees,
  getAllProperties,
  deleteEmployee,
  getEmployeeServices,
  removeServiceFromEmployee,
} from "../../api/authService";
import Header from "../../components/partnercomponent/Header";
import AddEmployeeModal from "../../components/partnercomponent/AddEmployeeModal";
import EditEmployeeModal from "../../components/partnercomponent/EditEmployeeModal";
import AddServiceToEmployeeModal from "../../components/partnercomponent/AddServiceToEmployeeModal";
import StyleSheet from "./Employee.module.css";

export default function Employee() {
  const location = useLocation();
  useEffect(() => {
    if (location.state?.employees) {
      console.log(
        "[Employee.jsx] Employees from navigation state:",
        location.state.employees
      );
    }
  }, [location.state?.employees]);

  const navigate = useNavigate();
  const { properties, partnerProfile } = useContext(PartnerAuthContext);

  const [employees, setEmployees] = useState(() => {
    const initialEmployees = location.state?.employees;
    const result = Array.isArray(initialEmployees) ? initialEmployees : [];
    return result;
  });
  const [loading, setLoading] = useState(
    !Array.isArray(location.state?.employees)
  );
  const [error, setError] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewServicesEmployee, setViewServicesEmployee] = useState(null);
  const [isAddServiceToEmployeeOpen, setIsAddServiceToEmployeeOpen] =
    useState(false);
  const [selectedEmployeeForService, setSelectedEmployeeForService] =
    useState(null);
  const fetchInProgressRef = useRef(false);

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const propertyId = useMemo(() => {
    const urlPropertyId = searchParams.get("propertyId");
    if (urlPropertyId) {
      localStorage.setItem("currentPropertyId", urlPropertyId);
      return urlPropertyId;
    }

    const statePropertyId = location.state?.propertyId;
    if (statePropertyId) {
      localStorage.setItem("currentPropertyId", statePropertyId);
      return statePropertyId;
    }

    const savedPropertyId = localStorage.getItem("currentPropertyId");
    if (savedPropertyId) {
      return savedPropertyId;
    }

    return null;
  }, [searchParams, location.state]);

  const findPropertyFromContext = useCallback(() => {
    if (!propertyId || !properties || !Array.isArray(properties)) {
      return null;
    }

    const property = properties.find((p) => {
      const pId = p.propertyId || p.id;
      const match1 = pId === propertyId;
      const match2 = pId === parseInt(propertyId);
      return match1 || match2;
    });

    return property;
  }, [propertyId, properties]);

  useEffect(() => {
    if (location.state?.propertyDetails) {
      setPropertyDetails(location.state.propertyDetails);
      return;
    }

    const contextProperty = findPropertyFromContext();
    if (contextProperty) {
      setPropertyDetails(contextProperty);
    }
  }, [propertyId, properties, location.state, findPropertyFromContext]);

  useEffect(() => {
    if (propertyId && !searchParams.get("propertyId")) {
      const newUrl = `/partner/employee?propertyId=${propertyId}`;
      window.history.replaceState(
        { ...location.state, propertyId },
        "",
        newUrl
      );
    }
  }, [propertyId, searchParams, location.state]);

  const fetchPropertyDetails = useCallback(async (propId) => {
    try {
      const response = await getAllProperties();
      const properties = response.data || response || [];
      const property = properties.find(
        (p) => (p.propertyId || p.id) === propId
      );
      if (property) {
        setPropertyDetails(property);
      }
    } catch {
      // Silently fail - property details are optional
    }
  }, []);

  const fetchEmployees = useCallback(
    async (forceRefresh = false) => {
      if (!propertyId) {
        setError("No property ID provided");
        setLoading(false);
        return;
      }

      const hasNavigationEmployees =
        Array.isArray(location.state?.employees) &&
        location.state.employees.length > 0;
      if (!forceRefresh && hasNavigationEmployees) {
        setLoading(false);
        return;
      }

      if (fetchInProgressRef.current) return;

      try {
        fetchInProgressRef.current = true;
        setLoading(true);
        setError(null);

        if (!propertyDetails && !location.state?.propertyDetails) {
          fetchPropertyDetails(propertyId);
        }

        const response = await getEmployees(propertyId);
        const employeeData = response.data?.data?.allEmployeeDetails || [];
        const finalEmployees = Array.isArray(employeeData) ? employeeData : [];
        setEmployees(finalEmployees);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [
      propertyId,
      fetchPropertyDetails,
      propertyDetails,
      location.state?.employees,
      location.state?.propertyDetails,
    ]
  );

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openMenuId]);

  const handleBackToDashboard = () => {
    localStorage.removeItem("currentPropertyId");
    navigate("/partner/dashboard");
  };

  const handleAddEmployee = () => {
    setIsAddEmployeeModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddEmployeeModalOpen(false);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsEditEmployeeModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditEmployeeModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleViewAvailability = (employee) => {
    navigate(`/partner/availability?propertyId=${propertyId}`, {
      state: {
        employee: employee,
        propertyId: propertyId,
        propertyDetails: propertyDetails,
      },
    });
  };

  const handleViewServices = async (employee) => {
    try {
      const employeeId = employee.id || employee.employeeId;
      const response = await getEmployeeServices(employeeId);

      if (
        response.data?.data?.["Employee Services"] &&
        Array.isArray(response.data.data["Employee Services"])
      ) {
        // Update employee with fetched services
        const updatedEmployee = {
          ...employee,
          servicesList: response.data.data["Employee Services"],
        };
        setViewServicesEmployee(updatedEmployee);
      } else {
        // If no services found, still show the modal with empty state
        const updatedEmployee = {
          ...employee,
          servicesList: [],
        };
        setViewServicesEmployee(updatedEmployee);
      }
    } catch (error) {
      console.error("Error fetching employee services:", error);
      // Still show the modal but with empty services
      const updatedEmployee = {
        ...employee,
        servicesList: [],
      };
      setViewServicesEmployee(updatedEmployee);
    }
  };

  const handleCloseServicesModal = () => {
    setViewServicesEmployee(null);
  };

  const handleOpenAddServiceToEmployee = (employee) => {
    setSelectedEmployeeForService(employee);
    setIsAddServiceToEmployeeOpen(true);
  };

  const handleCloseAddServiceToEmployee = () => {
    setIsAddServiceToEmployeeOpen(false);
    setSelectedEmployeeForService(null);
  };

  const handleServiceAddedToEmployee = async () => {
    // Refresh the view services modal with updated services
    if (selectedEmployeeForService) {
      try {
        const employeeId =
          selectedEmployeeForService.id ||
          selectedEmployeeForService.employeeId;
        const response = await getEmployeeServices(employeeId);

        if (
          response.data?.data?.["Employee Services"] &&
          Array.isArray(response.data.data["Employee Services"])
        ) {
          // Update the view services employee with fetched services
          const updatedEmployee = {
            ...viewServicesEmployee,
            servicesList: response.data.data["Employee Services"],
          };
          setViewServicesEmployee(updatedEmployee);
        }
      } catch (error) {
        console.error("Error refreshing employee services:", error);
      }
    }
  };

  const handleRemoveServiceFromEmployee = async (service) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${service.serviceName} from this employee?`
      )
    ) {
      return;
    }

    try {
      const employeeId =
        viewServicesEmployee.id || viewServicesEmployee.employeeId;
      const serviceId = service.id || service.serviceId;

      await removeServiceFromEmployee(propertyId, employeeId, serviceId);

      // Refresh the services list
      const response = await getEmployeeServices(employeeId);

      if (
        response.data?.data?.["Employee Services"] &&
        Array.isArray(response.data.data["Employee Services"])
      ) {
        const updatedEmployee = {
          ...viewServicesEmployee,
          servicesList: response.data.data["Employee Services"],
        };
        setViewServicesEmployee(updatedEmployee);
      }
    } catch (error) {
      console.error("Error removing service:", error);
      alert("Failed to remove service. Please try again.");
    }
  };

  const handleEmployeeUpdated = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getEmployees(propertyId);
      const employeeData = response.data?.data?.allEmployeeDetails || [];
      const finalEmployees = Array.isArray(employeeData) ? employeeData : [];
      setEmployees(finalEmployees);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeAdded = async (newEmployeeData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getEmployees(propertyId);
      const employeeData = response.data?.data?.allEmployeeDetails || [];
      const finalEmployees = Array.isArray(employeeData) ? employeeData : [];
      setEmployees(finalEmployees);
    } catch (err) {
      setError(err.message);
      if (Array.isArray(newEmployeeData)) {
        setEmployees(newEmployeeData);
      } else if (newEmployeeData && Array.isArray(newEmployeeData.employees)) {
        setEmployees(newEmployeeData.employees);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = (employee) => {
    setDeletingEmployee(employee);
  };

  const confirmDeleteEmployee = async () => {
    if (!deletingEmployee) {
      return;
    }

    const employeeId = deletingEmployee.id || deletingEmployee.employeeId;

    if (!employeeId) {
      setError("Unable to identify employee for deletion");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await deleteEmployee(employeeId);

      setEmployees((prevEmployees) =>
        prevEmployees.filter((emp) => (emp.id || emp.employeeId) !== employeeId)
      );

      setDeletingEmployee(null);
    } catch (error) {
      let errorMessage = "Failed to delete employee. Please try again.";

      if (
        error.response?.status === 500 &&
        error.response?.data?.message?.includes("No static resource")
      ) {
        errorMessage =
          "Delete functionality is not yet available on the server. Please contact support.";
      } else if (error.response?.status === 404) {
        errorMessage =
          "Delete endpoint not found. This feature may not be implemented yet.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteEmployee = () => {
    setDeletingEmployee(null);
  };

  const toggleMenu = (employeeId) => {
    setOpenMenuId(openMenuId === employeeId ? null : employeeId);
  };

  const closeMenu = () => {
    setOpenMenuId(null);
  };

  const getEmployeeId = (employee, index) => {
    return employee.id || employee.employeeId || `employee-${index}`;
  };

  if (!propertyId) {
    return (
      <div className={StyleSheet.MainContainer}>
        <div className={StyleSheet.HeaderContainer}>
          <Header />
        </div>
        <div className={StyleSheet.BodyContainer}>
          <div className={StyleSheet.ErrorContainer}>
            <div className={StyleSheet.ErrorIcon}></div>
            <h2>No Property Selected</h2>
            <p>
              Please select a property from the dashboard to view its employees.
            </p>
            <button
              className={StyleSheet.BackButton}
              onClick={handleBackToDashboard}
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
        <div className={StyleSheet.PageHeader}>
          <div className={StyleSheet.HeaderContent}>
            <div className={StyleSheet.TitleSection}>
              {propertyDetails ? (
                <>
                  <h1
                    className={StyleSheet.PageTitle}
                    style={{ fontSize: "2rem", marginBottom: "16px" }}
                  >
                    {propertyDetails.propertyName ||
                      propertyDetails.name ||
                      "Property"}
                  </h1>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#22c55e",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "0.875rem",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span></span>
                      Active:{" "}
                      {
                        employees.filter((emp) => emp.status === "ACTIVE")
                          .length
                      }
                    </div>
                    <div
                      style={{
                        backgroundColor: "#ef4444",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "0.875rem",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span></span>
                      Inactive:{" "}
                      {
                        employees.filter((emp) => emp.status !== "ACTIVE")
                          .length
                      }
                    </div>
                    <div
                      style={{
                        backgroundColor: "#3b82f6",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "0.875rem",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span></span>
                      Total: {employees.length}
                    </div>
                  </div>

                  {partnerProfile && (
                    <div
                      className={StyleSheet.BusinessInfo}
                      style={{ marginBottom: "12px" }}
                    >
                      <p
                        style={{
                          color: "#22c55e",
                          fontWeight: "bold",
                          fontStyle: "italic",
                          margin: "4px 0",
                          fontSize: "1.1rem",
                        }}
                      >
                        {partnerProfile.businessName}
                      </p>
                      <p
                        style={{
                          color: "#9333ea",
                          fontWeight: "bold",
                          fontStyle: "italic",
                          margin: "4px 0",
                          fontSize: "1rem",
                        }}
                      >
                        {partnerProfile.businessType}
                      </p>
                      <p
                        style={{
                          color: "#ef4444",
                          fontStyle: "italic",
                          margin: "4px 0",
                          fontSize: "0.95rem",
                        }}
                      >
                        {partnerProfile.street &&
                        partnerProfile.city &&
                        partnerProfile.state
                          ? `${partnerProfile.street}, ${
                              partnerProfile.city
                            }, ${partnerProfile.state} ${
                              partnerProfile.zipCode || ""
                            }`
                          : "Address not available"}
                      </p>
                      {partnerProfile.allowAppointmentsBookingTill && (
                        <p
                          style={{
                            color: "#0ea5e9",
                            fontWeight: "500",
                            margin: "4px 0",
                            fontSize: "0.9rem",
                          }}
                        >
                          Appointments booking till:{" "}
                          {partnerProfile.allowAppointmentsBookingTill}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h1 className={StyleSheet.PageTitle}>Property Employees</h1>
                  <p className={StyleSheet.PropertyInfo}>
                    Loading property details...
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            className={StyleSheet.AddEmployeeButton}
            onClick={handleAddEmployee}
          >
            <span className={StyleSheet.ButtonIcon}></span>
            Add Employee
          </button>
        </div>

        <div className={StyleSheet.ContentSection}>
          {loading ? (
            <div className={StyleSheet.LoadingContainer}>
              <div className={StyleSheet.LoadingSpinner}></div>
              <p>Loading employees...</p>
            </div>
          ) : error ? (
            <div className={StyleSheet.ErrorContainer}>
              <div className={StyleSheet.ErrorIcon}></div>
              <h3>Error Loading Employees</h3>
              <p>{error}</p>
              <button
                className={StyleSheet.RetryButton}
                onClick={fetchEmployees}
              >
                Try Again
              </button>
            </div>
          ) : !Array.isArray(employees) || employees.length === 0 ? (
            <div className={StyleSheet.NoEmployeesContainer}>
              <div className={StyleSheet.EmptyIcon}></div>
              <h3>No Employees Found</h3>
              <p>This property doesn't have any employees yet.</p>
              <p>Add your first employee to get started!</p>
              <button
                className={StyleSheet.AddFirstEmployeeButton}
                onClick={handleAddEmployee}
              >
                <span className={StyleSheet.ButtonIcon}></span>
                Add First Employee
              </button>
            </div>
          ) : (
            <div className={StyleSheet.EmployeesSection}>
              <div className={StyleSheet.SectionHeader}>
                <h2>
                  Employees ({Array.isArray(employees) ? employees.length : 0})
                </h2>
              </div>

              <div className={StyleSheet.EmployeesGrid}>
                {Array.isArray(employees) &&
                  employees.map((employee, index) => {
                    const employeeId = getEmployeeId(employee, index);
                    return (
                      <div key={employeeId} className={StyleSheet.EmployeeCard}>
                        <div className={StyleSheet.EmployeeHeader}>
                          <div className={StyleSheet.EmployeeAvatar}>
                            {employee.firstName
                              ? employee.firstName.charAt(0).toUpperCase()
                              : ""}
                          </div>
                          <div className={StyleSheet.EmployeeInfo}>
                            <h3 className={StyleSheet.EmployeeName}>
                              {`${employee.firstName || ""} ${
                                employee.lastName || ""
                              }`.trim() || "Unknown Employee"}
                            </h3>
                            <p className={StyleSheet.EmployeeRole}>
                              Employee ID: {employee.employeeId || "N/A"}
                            </p>
                          </div>
                          <div className={StyleSheet.EmployeeStatus}>
                            <span
                              className={`${StyleSheet.StatusBadge} ${
                                employee.status === "ACTIVE"
                                  ? StyleSheet.StatusActive
                                  : StyleSheet.StatusInactive
                              }`}
                            >
                              {employee.status === "ACTIVE"
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>
                          <div className={StyleSheet.EmployeeMenu}>
                            <button
                              className={StyleSheet.MenuToggle}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMenu(employeeId);
                              }}
                            >
                              ⋮
                            </button>
                            {openMenuId === employeeId && (
                              <div
                                className={StyleSheet.MenuDropdown}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className={StyleSheet.MenuOption}
                                  onClick={() => {
                                    handleEditEmployee(employee);
                                    closeMenu();
                                  }}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  className={`${StyleSheet.MenuOption} ${StyleSheet.MenuOptionDelete}`}
                                  onClick={() => {
                                    handleDeleteEmployee(employee);
                                    closeMenu();
                                  }}
                                  disabled={loading}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={StyleSheet.EmployeeDetails}>
                          <div className={StyleSheet.DetailRow}>
                            <span className={StyleSheet.DetailIcon}></span>
                            <span className={StyleSheet.DetailText}>
                              Email: {employee.email || "Not provided"}
                            </span>
                          </div>
                          <div className={StyleSheet.DetailRow}>
                            <span className={StyleSheet.DetailIcon}></span>
                            <span className={StyleSheet.DetailText}>
                              Phone: {employee.phoneNumber || "Not provided"}
                            </span>
                          </div>

                          {employee.roles && employee.roles.length > 0 && (
                            <div className={StyleSheet.DetailRow}>
                              <span className={StyleSheet.DetailIcon}></span>
                              <span className={StyleSheet.DetailText}>
                                Roles: {employee.roles.join(", ")}
                              </span>
                            </div>
                          )}
                        </div>

                        {employee.status !== "ACTIVE" && (
                          <div
                            className={StyleSheet.StatusNote}
                            style={{
                              backgroundColor: "#fef3c7",
                              border: "1px solid #f59e0b",
                              borderRadius: "6px",
                              padding: "8px 12px",
                              margin: "8px 0",
                              fontSize: "0.875rem",
                              color: "#92400e",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span></span>
                            <span>
                              Make your status active by adding availability
                            </span>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            gap: "12px",
                            marginTop: "12px",
                          }}
                        >
                          <button
                            style={{
                              flex: 1,
                              background:
                                "linear-gradient(90deg,#6366f1 0%,#7c3aed 100%)",
                              color: "#fff",
                              fontWeight: 600,
                              borderRadius: "12px",
                              fontSize: "1.08rem",
                              padding: "12px 0",
                              border: "none",
                              cursor: "pointer",
                            }}
                            onClick={() => handleViewAvailability(employee)}
                          >
                            View Availability
                          </button>
                          <button
                            style={{
                              flex: 1,
                              background:
                                "linear-gradient(90deg,#6366f1 0%,#6366f1 100%)",
                              color: "#fff",
                              fontWeight: 600,
                              borderRadius: "12px",
                              fontSize: "1.08rem",
                              padding: "12px 0",
                              border: "none",
                              cursor: "pointer",
                            }}
                            onClick={() => handleViewServices(employee)}
                          >
                            View Services
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {viewServicesEmployee && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(60,64,67,0.18)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              maxWidth: 520,
              width: "95%",
              borderRadius: 20,
              boxShadow: "0 12px 48px rgba(0,0,0,0.25)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              maxHeight: "85vh",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {viewServicesEmployee.firstName
                    ? viewServicesEmployee.firstName.charAt(0).toUpperCase()
                    : "?"}
                </span>
                <div style={{ color: "#fff" }}>
                  <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>
                    {viewServicesEmployee.firstName}{" "}
                    {viewServicesEmployee.lastName}
                  </div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                    Services
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseServicesModal}
                style={{
                  fontSize: 28,
                  color: "#fff",
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                aria-label="Close"
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.3)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.2)";
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                padding: 24,
                background: "#f8fafc",
                flex: 1,
                overflowY: "auto",
              }}
            >
              {Array.isArray(viewServicesEmployee.servicesList) &&
              viewServicesEmployee.servicesList.length > 0 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {viewServicesEmployee.servicesList.map((service, idx) => (
                    <div
                      key={service.id || idx}
                      style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: 16,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        transition: "all 0.2s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 4px 16px rgba(99,102,241,0.15)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0,0,0,0.05)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "start",
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "1.1rem",
                              color: "#1e293b",
                              marginBottom: 4,
                            }}
                          >
                            {service.serviceName}
                          </div>
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "#64748b",
                              display: "flex",
                              gap: 12,
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              ⏱️ {service.eachServiceTimeInMinus} min
                            </span>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              💰 ${service.serviceFee}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          color: "#475569",
                          lineHeight: "1.5",
                          marginBottom: 12,
                          paddingTop: 12,
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        {service.description}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() =>
                            handleRemoveServiceFromEmployee(service)
                          }
                          style={{
                            padding: "6px 12px",
                            background:
                              "linear-gradient(135deg,#ef4444 0%,#dc2626 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = "scale(1.02)";
                            e.target.style.boxShadow =
                              "0 4px 12px rgba(239,68,68,0.4)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = "scale(1)";
                            e.target.style.boxShadow = "none";
                          }}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    color: "#64748b",
                    fontStyle: "italic",
                    textAlign: "center",
                    padding: "48px 24px",
                    fontSize: "1.05rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: 48,
                      color: "#cbd5e1",
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    🛎️
                  </span>
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    No services found
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "0.9rem",
                      opacity: 0.7,
                    }}
                  >
                    Add a service to get started
                  </p>
                </div>
              )}
            </div>

            {/* Footer with Add Service Button */}
            <div
              style={{
                padding: 20,
                background: "#fff",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                gap: 12,
              }}
            >
              <button
                onClick={() =>
                  handleOpenAddServiceToEmployee(viewServicesEmployee)
                }
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  background: "linear-gradient(135deg,#10b981 0%,#059669 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(16,185,129,0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(16,185,129,0.3)";
                }}
              >
                ➕ Add Service
              </button>
            </div>
          </div>
        </div>
      )}

      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={handleCloseModal}
        propertyId={propertyId}
        onEmployeeAdded={handleEmployeeAdded}
      />

      <EditEmployeeModal
        isOpen={isEditEmployeeModalOpen}
        onClose={handleCloseEditModal}
        employee={selectedEmployee}
        propertyId={propertyId}
        onEmployeeUpdated={handleEmployeeUpdated}
      />

      {deletingEmployee && (
        <div className={StyleSheet.DeleteConfirmationOverlay}>
          <div className={StyleSheet.DeleteConfirmationDialog}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this employee?</p>
            <p>
              <strong>
                {deletingEmployee.firstName} {deletingEmployee.lastName}
              </strong>
            </p>
            <p className={StyleSheet.DeleteWarning}>
              This action cannot be undone and will remove all associated data.
            </p>
            <div className={StyleSheet.DeleteConfirmationButtons}>
              <button
                className={StyleSheet.ConfirmDeleteButton}
                onClick={confirmDeleteEmployee}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                className={StyleSheet.CancelDeleteButton}
                onClick={cancelDeleteEmployee}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AddServiceToEmployeeModal
        isOpen={isAddServiceToEmployeeOpen}
        onClose={handleCloseAddServiceToEmployee}
        employee={selectedEmployeeForService}
        property={propertyDetails}
        onServiceAdded={handleServiceAddedToEmployee}
      />
    </div>
  );
}
