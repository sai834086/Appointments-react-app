import styles from "./ProfileDetails.module.css";
import { useState, useContext } from "react";
import { PartnerAuthContext } from "../../pages/patneruserpages/context/PartnerAuthContext";
import { updatePartner } from "../../api/authService";

function ProfileDetails() {
  const { partnerProfile, setPartnerProfile, updateProfile } =
    useContext(PartnerAuthContext) || {};
  const [firstName, setFirstName] = useState(partnerProfile?.firstName ?? "");
  const [lastName, setLastName] = useState(partnerProfile?.lastName ?? "");
  const [email, setEmail] = useState(partnerProfile?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(
    partnerProfile?.phoneNumber ?? ""
  );
  const [update, setUpdate] = useState(-1);
  const [firstNameError, setFirstNameError] = useState(null);
  const [lastNameError, setLastNameError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);

  // --- Simple client-side validators ---
  const validateFirstName = (v) => {
    if (!v || v.trim() === "") return "First name is required";
    if (v.trim().length < 2) return "First name must be at least 2 characters";
    return null;
  };
  const validateLastName = (v) => {
    if (!v || v.trim() === "") return "Last name is required";
    if (v.trim().length < 2) return "Last name must be at least 2 characters";
    return null;
  };
  const validateEmail = (v) => {
    if (!v || v.trim() === "") return "Email is required";
    // simple email regex
    const re = /^\S+@\S+\.\S+$/;
    if (!re.test(v)) return "Please enter a valid email address";
    return null;
  };
  const validatePhone = (v) => {
    if (!v || v.trim() === "") return "Phone number is required";
    const digits = v.replace(/[^0-9]/g, "");
    if (digits.length < 7) return "Phone number is too short";
    if (digits.length > 15) return "Phone number is too long";
    return null;
  };

  // helper to extract and set backend validation errors
  const applyBackendErrors = (data, setters) => {
    if (!data) return;
    // prefer structured errors object
    if (data.errors && typeof data.errors === "object") {
      Object.entries(data.errors).forEach(([field, val]) => {
        const msg = Array.isArray(val) ? val.join(" ") : String(val);
        if (setters[field]) setters[field](msg);
      });
      return;
    }
    // Common validation array shape
    if (Array.isArray(data.validationErrors)) {
      data.validationErrors.forEach((err) => {
        const field = err.param || err.field;
        const msg = err.msg || err.message || JSON.stringify(err);
        if (field && setters[field]) setters[field](msg);
      });
      return;
    }
    // Fallback: top-level message
    if (data.message && setters._general)
      setters._general(String(data.message));
  };

  const handleSaveFirstName = async () => {
    if (!partnerProfile?.partnerId) {
      setFirstNameError("Missing partner id");
      return;
    }
    const clientErr = validateFirstName(firstName);
    if (clientErr) {
      setFirstNameError(clientErr);
      return;
    }

    try {
      const response = await updatePartner(partnerProfile.partnerId, {
        firstName,
      });
      const resp = response?.data || {};
      if (resp.success) {
        const updatedProfile = {
          ...(partnerProfile || {}),
          ...(resp.data || {}),
          firstName,
        };
        try {
          if (typeof updateProfile === "function")
            updateProfile(updatedProfile);
        } catch {
          // Handle updateProfile error silently
        }
        try {
          setPartnerProfile && setPartnerProfile(updatedProfile);
        } catch {
          // Handle setPartnerProfile error silently
        }
        setFirstNameError(null);
        setUpdate(-1);
      } else {
        // Handle backend validation errors
        applyBackendErrors(resp, {
          firstName: setFirstNameError,
          _general: setFirstNameError,
        });
      }
    } catch (error) {
      const data = error?.response?.data;
      if (data) {
        applyBackendErrors(data, {
          firstName: setFirstNameError,
          _general: setFirstNameError,
        });
      } else {
        setFirstNameError("Failed to save first name. Please try again.");
      }
      setUpdate(-1);
    }
  };

  const handleSaveLastName = async () => {
    if (!partnerProfile?.partnerId) {
      setLastNameError("Missing partner id");
      return;
    }
    const clientErr = validateLastName(lastName);
    if (clientErr) {
      setLastNameError(clientErr);
      return;
    }

    try {
      const response = await updatePartner(partnerProfile.partnerId, {
        lastName,
      });
      const resp = response?.data || {};
      if (resp.success) {
        const updatedProfile = {
          ...(partnerProfile || {}),
          ...(resp.data || {}),
          lastName,
        };
        try {
          if (typeof updateProfile === "function")
            updateProfile(updatedProfile);
        } catch {
          // Handle updateProfile error silently
        }
        try {
          setPartnerProfile && setPartnerProfile(updatedProfile);
        } catch {
          // Handle setPartnerProfile error silently
        }
        setLastNameError(null);
        setUpdate(-1);
      } else {
        applyBackendErrors(resp, {
          lastName: setLastNameError,
          _general: setLastNameError,
        });
      }
    } catch (error) {
      const data = error?.response?.data;
      if (data) {
        applyBackendErrors(data, {
          lastName: setLastNameError,
          _general: setLastNameError,
        });
      } else {
        setLastNameError("Failed to save last name. Please try again.");
      }
      setUpdate(-1);
    }
  };

  const handleSaveEmail = async () => {
    if (!partnerProfile?.partnerId) {
      setEmailError("Missing partner id");
      return;
    }
    const clientErr = validateEmail(email);
    if (clientErr) {
      setEmailError(clientErr);
      return;
    }

    try {
      const response = await updatePartner(partnerProfile.partnerId, { email });
      const resp = response?.data || {};
      if (resp.success) {
        const updatedProfile = {
          ...(partnerProfile || {}),
          ...(resp.data || {}),
          email,
        };
        try {
          if (typeof updateProfile === "function")
            updateProfile(updatedProfile);
        } catch {
          // Handle updateProfile error silently
        }
        try {
          setPartnerProfile && setPartnerProfile(updatedProfile);
        } catch {
          // Handle setPartnerProfile error silently
        }
        setEmailError(null);
        setUpdate(-1);
      } else {
        applyBackendErrors(resp, {
          email: setEmailError,
          _general: setEmailError,
        });
      }
    } catch (error) {
      const data = error?.response?.data;
      if (data) {
        applyBackendErrors(data, {
          email: setEmailError,
          _general: setEmailError,
        });
      } else {
        setEmailError("Failed to save email. Please try again.");
      }
      setUpdate(-1);
    }
  };

  const handleSavePhoneNumber = async () => {
    if (!partnerProfile?.partnerId) {
      setPhoneError("Missing partner id");
      return;
    }
    const clientErr = validatePhone(phoneNumber);
    if (clientErr) {
      setPhoneError(clientErr);
      return;
    }

    try {
      const response = await updatePartner(partnerProfile.partnerId, {
        phoneNumber,
      });
      const resp = response?.data || {};
      if (resp.success) {
        const updatedProfile = {
          ...(partnerProfile || {}),
          ...(resp.data || {}),
          phoneNumber,
        };
        try {
          if (typeof updateProfile === "function")
            updateProfile(updatedProfile);
        } catch {
          // Handle updateProfile error silently
        }
        try {
          setPartnerProfile && setPartnerProfile(updatedProfile);
        } catch {
          // Handle setPartnerProfile error silently
        }
        setPhoneError(null);
        setUpdate(-1);
      } else {
        applyBackendErrors(resp, {
          phoneNumber: setPhoneError,
          _general: setPhoneError,
        });
      }
    } catch (error) {
      const data = error?.response?.data;
      if (data) {
        applyBackendErrors(data, {
          phoneNumber: setPhoneError,
          _general: setPhoneError,
        });
      } else {
        setPhoneError("Failed to save phone number. Please try again.");
      }
      setUpdate(-1);
    }
  };

  return (
    <div className={styles.profileCard}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Profile Information</h2>
        <p className={styles.cardSubtitle}>
          Update your personal details and contact information
        </p>
      </div>

      <div className={styles.profileInfo}>
        {/* Personal Information Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>👤</span>
              Personal Information
            </h3>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.profileItem}>
              <label className={styles.fieldLabel}>First Name</label>
              <div className={styles.fieldContent}>
                {update === 0 ? (
                  <div className={styles.editMode}>
                    <input
                      className={styles.inputBox}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.saveButton}
                        onClick={() => handleSaveFirstName()}
                      >
                        Save Changes
                      </button>
                      <button
                        className={styles.cancelButton}
                        onClick={() => setUpdate(-1)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.viewMode}>
                    <span className={styles.fieldValue}>
                      {partnerProfile?.firstName || "Not set"}
                    </span>
                    <button
                      className={styles.editButton}
                      onClick={() => setUpdate(0)}
                    >
                      <span className={styles.editIcon}>✏️</span>
                      Edit
                    </button>
                  </div>
                )}
                {firstNameError && (
                  <div className={styles.fieldError}>{firstNameError}</div>
                )}
              </div>
            </div>

            <div className={styles.profileItem}>
              <label className={styles.fieldLabel}>Last Name</label>
              <div className={styles.fieldContent}>
                {update === 1 ? (
                  <div className={styles.editMode}>
                    <input
                      className={styles.inputBox}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.saveButton}
                        onClick={() => handleSaveLastName()}
                      >
                        Save Changes
                      </button>
                      <button
                        className={styles.cancelButton}
                        onClick={() => setUpdate(-1)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.viewMode}>
                    <span className={styles.fieldValue}>
                      {partnerProfile?.lastName || "Not set"}
                    </span>
                    <button
                      className={styles.editButton}
                      onClick={() => setUpdate(1)}
                    >
                      <span className={styles.editIcon}>✏️</span>
                      Edit
                    </button>
                  </div>
                )}
                {lastNameError && (
                  <div className={styles.fieldError}>{lastNameError}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📱</span>
              Contact Information
            </h3>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.profileItem}>
              <label className={styles.fieldLabel}>Email Address</label>
              <div className={styles.fieldContent}>
                {update === 2 ? (
                  <div className={styles.editMode}>
                    <input
                      className={styles.inputBox}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.saveButton}
                        onClick={() => handleSaveEmail()}
                      >
                        Save Changes
                      </button>
                      <button
                        className={styles.cancelButton}
                        onClick={() => setUpdate(-1)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.viewMode}>
                    <span className={styles.fieldValue}>
                      {partnerProfile?.email || "Not set"}
                    </span>
                    <button
                      className={styles.editButton}
                      onClick={() => setUpdate(2)}
                    >
                      <span className={styles.editIcon}>✏️</span>
                      Edit
                    </button>
                  </div>
                )}
                {emailError && (
                  <div className={styles.fieldError}>{emailError}</div>
                )}
              </div>
            </div>

            <div className={styles.profileItem}>
              <label className={styles.fieldLabel}>Phone Number</label>
              <div className={styles.fieldContent}>
                {update === 3 ? (
                  <div className={styles.editMode}>
                    <input
                      className={styles.inputBox}
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                    />
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.saveButton}
                        onClick={() => handleSavePhoneNumber()}
                      >
                        Save Changes
                      </button>
                      <button
                        className={styles.cancelButton}
                        onClick={() => setUpdate(-1)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.viewMode}>
                    <span className={styles.fieldValue}>
                      {phoneNumber || partnerProfile?.phoneNumber || "Not set"}
                    </span>
                    <button
                      className={styles.editButton}
                      onClick={() => setUpdate(3)}
                    >
                      <span className={styles.editIcon}>✏️</span>
                      Edit
                    </button>
                  </div>
                )}
                {phoneError && (
                  <div className={styles.fieldError}>{phoneError}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Information Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🏢</span>
              Business Information
            </h3>
            <span className={styles.readOnlyBadge}>Read Only</span>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.readOnlyGrid}>
              <div className={styles.readOnlyItem}>
                <label className={styles.readOnlyLabel}>Business Type</label>
                <span className={styles.readOnlyValue}>
                  {partnerProfile?.businessType || "Not specified"}
                </span>
              </div>
              <div className={styles.readOnlyItem}>
                <label className={styles.readOnlyLabel}>Business Name</label>
                <span className={styles.readOnlyValue}>
                  {partnerProfile?.businessName || "Not specified"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📍</span>
              Address Information
            </h3>
            <span className={styles.readOnlyBadge}>Read Only</span>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.readOnlyGrid}>
              <div className={styles.readOnlyItem}>
                <label className={styles.readOnlyLabel}>Building No</label>
                <span className={styles.readOnlyValue}>
                  {partnerProfile?.buildingNo || "Not specified"}
                </span>
              </div>
              <div className={styles.readOnlyItem}>
                <label className={styles.readOnlyLabel}>Street</label>
                <span className={styles.readOnlyValue}>
                  {partnerProfile?.street || "Not specified"}
                </span>
              </div>
              <div className={styles.readOnlyItem}>
                <label className={styles.readOnlyLabel}>City</label>
                <span className={styles.readOnlyValue}>
                  {partnerProfile?.city || "Not specified"}
                </span>
              </div>
              <div className={styles.readOnlyItem}>
                <label className={styles.readOnlyLabel}>State</label>
                <span className={styles.readOnlyValue}>
                  {partnerProfile?.state || "Not specified"}
                </span>
              </div>
              <div className={styles.readOnlyItem}>
                <label className={styles.readOnlyLabel}>Country</label>
                <span className={styles.readOnlyValue}>
                  {partnerProfile?.country || "Not specified"}
                </span>
              </div>
              <div className={styles.readOnlyItem}>
                <label className={styles.readOnlyLabel}>Zip Code</label>
                <span className={styles.readOnlyValue}>
                  {partnerProfile?.zipCode || "Not specified"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Status Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⚙️</span>
              Account Status
            </h3>
            <span className={styles.readOnlyBadge}>Read Only</span>
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.readOnlyGrid}>
              <div className={styles.readOnlyItem}>
                <label className={styles.readOnlyLabel}>Account Status</label>
                <span
                  className={`${styles.readOnlyValue} ${styles.statusValue}`}
                >
                  <span className={styles.statusIcon}>
                    {partnerProfile?.status === "ACTIVE"
                      ? "✅"
                      : partnerProfile?.status === "INACTIVE"
                      ? "❌"
                      : partnerProfile?.status === "PENDING"
                      ? "⏳"
                      : "❓"}
                  </span>
                  {partnerProfile?.status || "Unknown"}
                </span>
              </div>
              <div className={styles.readOnlyItem}>
                <label className={styles.readOnlyLabel}>
                  Verification Status
                </label>
                <span
                  className={`${styles.readOnlyValue} ${styles.verificationValue}`}
                >
                  <span className={styles.statusIcon}>
                    {partnerProfile?.isVerified ? "✅" : "❌"}
                  </span>
                  {partnerProfile?.isVerified ? "Verified" : "Not Verified"}
                </span>
              </div>
            </div>

            {/* Account Status Info Note */}
            {partnerProfile?.status === "INACTIVE" && (
              <div className={styles.infoNote}>
                <div className={styles.infoIcon}>💡</div>
                <div className={styles.infoContent}>
                  <h4 className={styles.infoTitle}>Activate Your Account</h4>
                  <p className={styles.infoText}>
                    To make your account status active, please add at least one
                    property or ensure you have an active property in your
                    portfolio.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileDetails;
