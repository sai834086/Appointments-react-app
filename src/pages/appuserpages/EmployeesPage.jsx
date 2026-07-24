import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./EmployeesPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClock,
  faDollarSign,
  faMapMarkerAlt,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";

function formatFee(fee) {
  if (fee == null) return null;
  return `$${parseFloat(fee).toFixed(2)}`;
}

function getInitials(firstName, lastName) {
  const f = (firstName || "").charAt(0).toUpperCase();
  const l = (lastName  || "").charAt(0).toUpperCase();
  return f + l || "?";
}

const AVATAR_COLORS = [
  ["#dbeafe", "#1d4ed8"],
  ["#dcfce7", "#15803d"],
  ["#fce7f3", "#be185d"],
  ["#fef9c3", "#a16207"],
  ["#ede9fe", "#6d28d9"],
  ["#ffedd5", "#c2410c"],
];

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

const EmployeesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const service   = location.state?.service;
  const employees = location.state?.employees || [];

  const handleSelectEmployee = (employee) => {
    navigate("/availability-booking", { state: { service, employee } });
  };

  if (!service) {
    return (
        <div className={styles.pageWrapper}>
          <div className={styles.errorMsg}>No service selected.</div>
        </div>
          );
  }

  const svcName = service.name || service.serviceName || "";
  const duration = service.eachServiceTimeInMinus || service.duration;
  const fee = service.serviceFee ?? service.price;

  return (
    <div className={styles.pageWrapper}>

        {/* â”€â”€ Top bar â”€â”€ */}
        <div className={styles.topBar}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className={styles.pageTitle}>Choose Staff</h1>
        </div>

        {/* â”€â”€ Service summary â”€â”€ */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryIconWrap}>
            <FontAwesomeIcon icon={faUserTie} className={styles.summaryIcon} />
          </div>
          <div className={styles.summaryBody}>
            <p className={styles.summaryServiceName}>{svcName}</p>
            {service.propertyName && (
              <p className={styles.summaryProp}>
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                {service.propertyName}
              </p>
            )}
            <div className={styles.summaryMeta}>
              {duration > 0 && (
                <span className={styles.metaChip}>
                  <FontAwesomeIcon icon={faClock} />
                  {duration} mins
                </span>
              )}
              {fee != null && (
                <span className={`${styles.metaChip} ${styles.metaChipFee}`}>
                  <FontAwesomeIcon icon={faDollarSign} />
                  {formatFee(fee)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* â”€â”€ Count label â”€â”€ */}
        <p className={styles.countLabel}>
          {employees.length}{" "}
          {employees.length === 1 ? "staff member available" : "staff members available"}
        </p>

        {/* â”€â”€ Employee cards â”€â”€ */}
        {employees.length > 0 ? (
          <div className={styles.grid}>
            {employees.map((emp) => {
              const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
              const [bg, fg] = avatarColor(fullName);
              return (
          <div key={emp.employeeId} className={styles.card}>
                  <div className={styles.cardBody}>
                    <div
                      className={styles.avatar}
                      style={{ background: bg, color: fg }}
                    >
                      {getInitials(emp.firstName, emp.lastName)}
                    </div>
                    <div className={styles.empInfo}>
                      <h3 className={styles.empName}>{fullName || "â€”"}</h3>
                      {emp.email && (
                        <p className={styles.empDetail}>{emp.email}</p>
                      )}
                      {emp.phone && (
                        <p className={styles.empDetail}>{emp.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    <button
                      className={styles.selectBtn}
                      onClick={() => handleSelectEmployee(emp)}
                    >
                      Select
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>No staff available for this service.</div>
        )}

      </div>
  );
};

export default EmployeesPage;



