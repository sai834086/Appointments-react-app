import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashBoardHeader from "../../components/usercomponent/DashBoardHeader";
import styles from "./EmployeesPage.module.css";

const EmployeesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const service = location.state?.service;
  const employees = location.state?.employees || [];

  const handleSelectEmployee = (employee) => {
    navigate("/availability-booking", {
      state: { service, employee },
    });
  };

  if (!service) {
    return (
      <div className={styles.mainContainer}>
        <DashBoardHeader />
        <div className={styles.pageWrapper}>
          <div className={styles.errorMsg}>No service selected.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <DashBoardHeader />
      <div className={styles.pageWrapper}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <button
            className={styles.backButton}
            onClick={() => navigate(-1)}
            title="Go back"
          >
            &lt;
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Available Employees</h1>
            <div className={styles.serviceDetails}>
              <h2 className={styles.serviceName}>{service.serviceName}</h2>
              <p className={styles.serviceInfo}>
                {service.propertyName} •{" "}
                {service.eachServiceTimeInMinus || service.duration} mins
              </p>
              <p className={styles.servicePrice}>
                Consulting Fee:{" "}
                <span>
                  ${parseFloat(service.serviceFee || service.price).toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Employees List */}
        <div className={styles.employeesContainer}>
          {employees.length > 0 ? (
            <div className={styles.employeesList}>
              {employees.map((employee) => (
                <div key={employee.employeeId} className={styles.employeeCard}>
                  <div className={styles.employeeHeader}>
                    <div className={styles.employeeInfo}>
                      <h3 className={styles.employeeName}>
                        {employee.firstName} {employee.lastName}
                      </h3>
                      {employee.email && (
                        <p className={styles.employeeEmail}>{employee.email}</p>
                      )}
                      {employee.phone && (
                        <p className={styles.employeePhone}>{employee.phone}</p>
                      )}
                    </div>
                  </div>
                  <button
                    className={styles.bookBtn}
                    onClick={() => handleSelectEmployee(employee)}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noEmployees}>
              <p>No employees available for this service</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
