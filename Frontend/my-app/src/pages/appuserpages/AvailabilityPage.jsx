import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAvailabilityToAppUser } from "../../api/userService";
import styles from "./AvailabilityPage.module.css";
import Availability from "../../components/usercomponent/Availability";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const AvailabilityPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const employee = location.state?.employee;
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const employeeId = employee?.employeeId;
    if (!employee) {
      setError(
        "No employee selected. Please select an employee from the employees page.",
  );
      setLoading(false);
      return;
    }
    async function fetchAvailability() {
      setLoading(true);
      setError(null);
      try {
        const response = await getAvailabilityToAppUser(employeeId);
        setAvailability(response.data || []);
      } catch (err) {
        console.error("Error fetching availability:", err);
        setError("Failed to load availability.");
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, [employee]);

  if (!employee) {
    return <div>No employee selected.</div>;
  }

  return (
    <div className={styles.availabilityContainer}>
        <div className={styles.pageHeader}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h2 className={styles.availabilityTitle}>Employee Availability</h2>
        </div>
        {employee && (
          <div className={styles.employeeDetails}>
            <h3 className={styles.employeeName}>
              {employee.firstName} {employee.lastName}
            </h3>
            <div className={styles.employeeInfo}>
              {employee.email && (
                <p>
                  <strong>Email:</strong> {employee.email}
                </p>
              )}
              {employee.phoneNumber && (
                <p>
                  <strong>Phone:</strong> {employee.phoneNumber}
                </p>
              )}
              {employee.status && (
                <p>
                  <strong>Status:</strong> {employee.status}
                </p>
              )}
            </div>
          </div>
        )}
        {loading && (
          <div className={styles.loadingMsg}>Loading availability...</div>
        )}
        {error && <div className={styles.errorMsg}>{error}</div>}
        {!loading && !error && (
          <div className={styles.availabilityContent}>
            <h3 className={styles.availabilitySubtitle}>
              Availability Schedule
            </h3>
            {Array.isArray(availability) && availability.length === 0 ? (
              <p className={styles.noAvailability}>
                No availability data available.
              </p>
            ) : (
              <div className={styles.availabilityItem}>
                <Availability
                  availability={availability.data.availabilityWithOffTime}
                  appointmentsOpenTillInMonths={
                    employee.appointmentsOpenTillInMonths
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>
  );
};

export default AvailabilityPage;



