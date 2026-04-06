import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAvailabilityWithOffTime } from "../../api/authService";
import Header from "../../components/partnercomponent/Header";
import WeeklyAvailabilitySchedule from "../../components/partnercomponent/WeeklyAvailabilitySchedule";
import StyleSheet from "./Availability.module.css";

export default function Availability() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get employee data from navigation state
  const employee = location.state?.employee;
  const propertyDetails = location.state?.propertyDetails;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [allOffTimes, setAllOffTimes] = useState({});
  const [updatedEmployee, setUpdatedEmployee] = useState(null);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    // Redirect if no employee data
    if (!employee) {
      navigate("/partner/dashboard");
      return;
    }

    // Fetch availability details when component mounts
    const fetchData = async () => {
      if (!employee || !location.state?.propertyId) return;

      // Prevent duplicate requests (especially in StrictMode)
      if (fetchInProgressRef.current) return;

      try {
        fetchInProgressRef.current = true;
        setLoading(true);
        setError(null);

        const employeeId = employee.id || employee.employeeId;

        // Try the combined endpoint first
        const response = await getAvailabilityWithOffTime(employeeId);

        // Process the combined response
        const responseData = response.data?.data || response.data;
        const availabilityDetails = responseData["Availability with Off Time"];

        // Process the combined response data
        if (availabilityDetails && Array.isArray(availabilityDetails)) {
          setAvailabilityData(availabilityDetails);

          // Extract off times from each availability object
          let processedOffTimes = {};
          availabilityDetails.forEach((availability) => {
            const availabilityId = availability.availabilityId;
            if (
              availabilityId &&
              availability.offTimes &&
              Array.isArray(availability.offTimes)
            ) {
              processedOffTimes[availabilityId] = availability.offTimes;
            }
          });

          setAllOffTimes(processedOffTimes);
        } else {
          // If no availability data, set empty arrays
          setAvailabilityData([]);
          setAllOffTimes({});
        }
      } catch (err) {
        // Extract detailed error message from server response
        let errorMessage = "Failed to load availability details";

        if (err.response?.data) {
          // If server returns structured error response
          if (err.response.data.message) {
            errorMessage = err.response.data.message;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (typeof err.response.data === "string") {
            errorMessage = err.response.data;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setAvailabilityData(null);
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    };

    fetchData();
  }, [employee, navigate, location.state?.propertyId]);

  const handleAvailabilityUpdated = async () => {
    // Refetch availability details and off times after successful addition
    if (!employee || !location.state?.propertyId) return;

    try {
      setLoading(true);
      setError(null);

      const employeeId = employee.id || employee.employeeId;

      // Try the combined endpoint first
      const response = await getAvailabilityWithOffTime(employeeId);
      const responseData = response.data?.data || response.data;
      const availabilityDetails = responseData["Availability with Off Time"];

      // Check if we got data from the combined endpoint
      if (
        availabilityDetails &&
        Array.isArray(availabilityDetails) &&
        availabilityDetails.length > 0
      ) {
        setAvailabilityData(availabilityDetails);

        // Extract off times from each availability object
        let processedOffTimes = {};
        availabilityDetails.forEach((availability) => {
          const availabilityId = availability.availabilityId;
          if (
            availabilityId &&
            availability.offTimes &&
            Array.isArray(availability.offTimes)
          ) {
            processedOffTimes[availabilityId] = availability.offTimes;
          }
        });

        setAllOffTimes(processedOffTimes);
      } else {
        setAvailabilityData(null);
        setAllOffTimes({});
      }
    } catch (err) {
      setError(err.message || "Failed to refresh availability details");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeUpdated = (employeesData) => {
    // Find the current employee in the updated data and store it
    if (
      employeesData?.data?.allEmployeeDetails &&
      Array.isArray(employeesData.data.allEmployeeDetails)
    ) {
      const currentEmployeeId = employee?.id || employee?.employeeId;
      const updatedEmployeeData = employeesData.data.allEmployeeDetails.find(
        (emp) => (emp.id || emp.employeeId) === currentEmployeeId
      );
      if (updatedEmployeeData) {
        setUpdatedEmployee(updatedEmployeeData);
      }
    }
  };

  const handleBackToEmployees = () => {
    if (location.state?.propertyId) {
      navigate(`/partner/employee?propertyId=${location.state.propertyId}`, {
        state: {
          propertyId: location.state.propertyId,
          propertyDetails: propertyDetails || location.state.propertyDetails,
        },
      });
    } else {
      navigate("/partner/dashboard");
    }
  };

  if (!employee) {
    return (
      <div className={StyleSheet.MainContainer}>
        <div className={StyleSheet.HeaderContainer}>
          <Header />
        </div>
        <div className={StyleSheet.BodyContainer}>
          <div className={StyleSheet.ErrorContainer}>
            <div className={StyleSheet.ErrorIcon}>⚠️</div>
            <h2>No Employee Selected</h2>
            <p>Please select an employee to view their availability.</p>
            <button
              className={StyleSheet.BackButton}
              onClick={() => navigate("/partner/dashboard")}
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
        {/* Header Section */}
        <div className={StyleSheet.PageHeader}>
          <div className={StyleSheet.HeaderContent}>
            <button
              className={StyleSheet.BackButton}
              onClick={handleBackToEmployees}
            >
              ← Back to Employees
            </button>
            <div className={StyleSheet.TitleSection}>
              <h1 className={StyleSheet.PageTitle}>Employee Availability</h1>
              <div className={StyleSheet.EmployeeInfo}>
                <h2 className={StyleSheet.EmployeeName}>
                  {`${(updatedEmployee || employee).firstName || ""} ${
                    (updatedEmployee || employee).lastName || ""
                  }`.trim() || "Unknown Employee"}
                </h2>
                <div className={StyleSheet.EmployeeDetails}>
                  <span className={StyleSheet.EmployeeId}>
                    ID:{" "}
                    {(updatedEmployee || employee).employeeId ||
                      (updatedEmployee || employee).id ||
                      "N/A"}
                  </span>
                  <span
                    className={`${StyleSheet.EmployeeStatus} ${
                      (updatedEmployee || employee).status === "ACTIVE"
                        ? StyleSheet.StatusActive
                        : StyleSheet.StatusInactive
                    }`}
                  >
                    {(updatedEmployee || employee).status === "ACTIVE"
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
              </div>
              {propertyDetails && (
                <p className={StyleSheet.PropertyInfo}>
                  {propertyDetails.propertyName || propertyDetails.name} •{" "}
                  {propertyDetails.city}, {propertyDetails.state}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className={StyleSheet.ContentSection}>
          {loading ? (
            <div className={StyleSheet.LoadingContainer}>
              <div className={StyleSheet.LoadingSpinner}></div>
              <p>Loading availability...</p>
            </div>
          ) : error ? (
            <div className={StyleSheet.ErrorContainer}>
              <div className={StyleSheet.ErrorIcon}>❌</div>
              <h3>Error Loading Availability</h3>
              <p>{error}</p>
              <button
                className={StyleSheet.RetryButton}
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className={StyleSheet.AvailabilitySection}>
              <WeeklyAvailabilitySchedule
                availabilityData={availabilityData}
                propertyId={location.state?.propertyId}
                employeeId={employee?.id || employee?.employeeId}
                allOffTimes={allOffTimes}
                onAvailabilityUpdated={handleAvailabilityUpdated}
                onEmployeeUpdated={handleEmployeeUpdated}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
