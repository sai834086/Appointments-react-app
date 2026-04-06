import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getEmployeesToAppUser } from "../../api/userService";
import { Mail, Phone, UserCheck } from "lucide-react";
import DashBoardHeader from "../../components/usercomponent/DashBoardHeader";
import styles from "./EmployeePage.module.css";

const EmployeePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const propertyId = location.state?.propertyId;
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      setError(null);
      try {
        const response = await getEmployeesToAppUser({ propertyId });
        setEmployees(response.data.data?.allEmployees || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employees.");
      } finally {
        setLoading(false);
      }
    }
    if (propertyId) fetchEmployees();
  }, [propertyId]);

  if (!propertyId) {
    return <div>No property selected.</div>;
  }

  return (
    <div>
      <DashBoardHeader />
      <div className={styles.employeesContainer}>
        <h2 className={styles.employeesTitle}>Employees</h2>
        {!loading && (
          <p className={styles.employeeCount}>
            Total Employees: {employees.length}
          </p>
        )}
        {loading && (
          <div className={styles.loadingMsg}>Loading employees...</div>
        )}
        {error && <div className={styles.errorMsg}>{error}</div>}
        {!loading && !error && (
          <div className={styles.employeesGrid}>
            {employees.length === 0 ? (
              <div className={styles.noEmployeesMsg}>
                No employees found for this property.
              </div>
            ) : (
              employees.map((employee, idx) => (
                <div
                  key={employee.id || employee.employeeId || idx}
                  className={styles.employeeCard}
                  onClick={() =>
                    navigate("/availability", { state: { employee } })
                  }
                >
                  <div className={styles.employeeName}>
                    {employee.firstName} {employee.lastName}
                  </div>
                  <div className={styles.employeeDetails}>
                    {employee.email && (
                      <div className={styles.employeeDetail}>
                        <Mail size={16} className={styles.icon} />{" "}
                        <strong>Email:</strong> {employee.email}
                      </div>
                    )}
                    {employee.phoneNumber && (
                      <div className={styles.employeeDetail}>
                        <Phone size={16} className={styles.icon} />{" "}
                        <strong>Phone:</strong> {employee.phoneNumber}
                      </div>
                    )}
                    {employee.status && (
                      <div className={styles.employeeDetail}>
                        <UserCheck size={16} className={styles.icon} />{" "}
                        <strong>Status:</strong> {employee.status}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePage;
