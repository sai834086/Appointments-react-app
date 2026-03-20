import { useState, useEffect } from "react";
import styles from "./PropertyEdit.module.css";

function PropertyEdit({ isOpen, onClose, property, onUpdate }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    propertyName: "",
    buildingNo: "",
    street: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Populate form when property changes
  useEffect(() => {
    if (property) {
      setFormData({
        firstName: property.firstName || "",
        lastName: property.lastName || "",
        email: property.email || "",
        phoneNumber: property.phoneNumber || "",
        password: "", // Always blank and non-editable
        propertyName: property.propertyName || property.name || "",
        buildingNo: property.buildingNo || "",
        street: property.street || "",
        city: property.city || "",
        state: property.state || "",
        country: property.country || "",
        zipCode: property.zipCode || "",
      });
    }
  }, [property]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!property || !onUpdate) return;

    setIsLoading(true);
    setError(null);

    try {
      await onUpdate(property.propertyId || property.id, formData);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update property");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setError(null);
    onClose();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>{isEditing ? "✏️" : "👁️"}</span>
            {isEditing ? "Edit Property Details" : "View Property Details"}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.form}>
            {/* Manager Details Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>👤</span>
                Manager Information
              </h3>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    tabIndex={isEditing ? "0" : "-1"}
                    className={`${styles.input} ${
                      isEditing ? "" : styles.readOnlyInput
                    }`}
                    style={{ pointerEvents: isEditing ? "auto" : "none" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    readOnly
                    disabled
                    tabIndex="-1"
                    className={`${styles.input} ${styles.readOnlyInput}`}
                    style={{ pointerEvents: "none" }}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    disabled
                    tabIndex="-1"
                    className={`${styles.input} ${styles.readOnlyInput}`}
                    style={{ pointerEvents: "none" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    readOnly
                    disabled
                    tabIndex="-1"
                    className={`${styles.input} ${styles.readOnlyInput}`}
                    maxLength="10"
                    style={{ pointerEvents: "none" }}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input
                  type="password"
                  name="password"
                  value=""
                  readOnly
                  disabled
                  className={`${styles.input} ${styles.disabledInput}`}
                  placeholder="Password is not displayed for security"
                />
                <small className={styles.helpText}>
                  Password information is not displayed for security reasons.
                </small>
              </div>
            </div>

            {/* Property Details Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>🏠</span>
                Property Information
              </h3>

              <div className={styles.formGroup}>
                <label className={styles.label}>Property Name</label>
                <input
                  type="text"
                  name="propertyName"
                  value={formData.propertyName}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                  disabled={!isEditing}
                  tabIndex={isEditing ? "0" : "-1"}
                  className={`${styles.input} ${
                    isEditing ? "" : styles.readOnlyInput
                  }`}
                  style={{ pointerEvents: isEditing ? "auto" : "none" }}
                />
              </div>

              <div className={styles.addressSection}>
                <h4 className={styles.subsectionTitle}>
                  <span className={styles.subsectionIcon}>📍</span>
                  Address Details
                </h4>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Building Number</label>
                    <input
                      type="text"
                      name="buildingNo"
                      value={formData.buildingNo}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      tabIndex={isEditing ? "0" : "-1"}
                      className={`${styles.input} ${
                        isEditing ? "" : styles.readOnlyInput
                      }`}
                      style={{ pointerEvents: isEditing ? "auto" : "none" }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Street</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      tabIndex={isEditing ? "0" : "-1"}
                      className={`${styles.input} ${
                        isEditing ? "" : styles.readOnlyInput
                      }`}
                      style={{ pointerEvents: isEditing ? "auto" : "none" }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      tabIndex={isEditing ? "0" : "-1"}
                      className={`${styles.input} ${
                        isEditing ? "" : styles.readOnlyInput
                      }`}
                      style={{ pointerEvents: isEditing ? "auto" : "none" }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      tabIndex={isEditing ? "0" : "-1"}
                      className={`${styles.input} ${
                        isEditing ? "" : styles.readOnlyInput
                      }`}
                      style={{ pointerEvents: isEditing ? "auto" : "none" }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      tabIndex={isEditing ? "0" : "-1"}
                      className={`${styles.input} ${
                        isEditing ? "" : styles.readOnlyInput
                      }`}
                      style={{ pointerEvents: isEditing ? "auto" : "none" }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      readOnly={!isEditing}
                      disabled={!isEditing}
                      tabIndex={isEditing ? "0" : "-1"}
                      className={`${styles.input} ${
                        isEditing ? "" : styles.readOnlyInput
                      }`}
                      style={{ pointerEvents: isEditing ? "auto" : "none" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.actions}>
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className={styles.editButton}
                  >
                    Edit Property
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className={styles.cancelButton}
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className={styles.saveButton}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className={styles.cancelButton}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyEdit;
