import styles from "./ProfileDetails.module.css";
import { useState, useContext } from "react";
import { PartnerAuthContext } from "../../pages/patneruserpages/context/PartnerAuthContext";
import { updatePartner } from "../../api/authService";
import {
  Pencil,
  Check,
  X,
  BadgeCheck,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";

/** One editable field: shows the value with an edit affordance, or an input. */
function EditableField({
  label,
  value,
  draft,
  onDraftChange,
  editing,
  onEdit,
  onCancel,
  onSave,
  error,
  type = "text",
  placeholder,
}) {
  return (
    <div className={`${styles.field} ${editing ? styles.fieldEditing : ""}`}>
      <span className={styles.fieldLabel}>{label}</span>

      {editing ? (
        <>
          <input
            className={styles.input}
            type={type}
            value={draft}
            placeholder={placeholder}
            onChange={(e) => onDraftChange(e.target.value)}
            autoFocus
          />
          <div className={styles.fieldActions}>
            <button
              type="button"
              className={styles.saveButton}
              onClick={onSave}
              aria-label={`Save ${label}`}
            >
              <Check size={15} strokeWidth={2.5} aria-hidden="true" />
              Save
            </button>
            <button
              type="button"
              className={styles.iconButton}
              onClick={onCancel}
              aria-label={`Cancel editing ${label}`}
            >
              <X size={15} strokeWidth={2.25} aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        <div className={styles.fieldValueRow}>
          <span className={styles.fieldValue}>{value || "Not set"}</span>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onEdit}
            aria-label={`Edit ${label}`}
            title={`Edit ${label}`}
          >
            <Pencil size={14} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>
      )}

      {error && <p className={styles.fieldError}>{error}</p>}
    </div>
  );
}

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

  const displayName =
    `${partnerProfile?.firstName ?? ""} ${partnerProfile?.lastName ?? ""}`.trim() ||
    "Your profile";
  const initials =
    `${(partnerProfile?.firstName || " ")[0]}${(partnerProfile?.lastName || " ")[0]}`
      .trim()
      .toUpperCase() || "P";
  const addressLine =
    [
      `${partnerProfile?.buildingNo || ""} ${partnerProfile?.street || ""}`.trim(),
      [partnerProfile?.city, partnerProfile?.state, partnerProfile?.zipCode]
        .filter(Boolean)
        .join(", "),
      partnerProfile?.country,
    ]
      .filter(Boolean)
      .join(" · ") || "Not specified";
  const status = partnerProfile?.status || "Unknown";
  const verified = Boolean(partnerProfile?.isVerified);

  return (
    <div className={styles.profileCard}>
      {/* ---------- Hero header ---------- */}
      <header className={styles.hero}>
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <div className={styles.heroText}>
          <h2 className={styles.heroName}>{displayName}</h2>
          <p className={styles.heroMeta}>
            {[partnerProfile?.businessName, partnerProfile?.email]
              .filter(Boolean)
              .join(" · ") || "Complete your profile below"}
          </p>
        </div>
        <div className={styles.heroBadges}>
          <span
            className={`${styles.badge} ${
              status === "ACTIVE" ? styles.badgeSuccess : styles.badgeWarning
            }`}
          >
            <span className={styles.badgeDot} aria-hidden="true" />
            {status}
          </span>
          <span
            className={`${styles.badge} ${
              verified ? styles.badgeAccent : styles.badgeMuted
            }`}
          >
            {verified ? (
              <BadgeCheck size={13} strokeWidth={2.25} aria-hidden="true" />
            ) : (
              <ShieldAlert size={13} strokeWidth={2.25} aria-hidden="true" />
            )}
            {verified ? "Verified" : "Not verified"}
          </span>
        </div>
      </header>


      {/* ---------- Editable details ---------- */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Personal details</h3>
        <div className={styles.fieldGrid}>
          <EditableField
            label="First name"
            value={partnerProfile?.firstName}
            draft={firstName}
            onDraftChange={setFirstName}
            editing={update === 0}
            onEdit={() => {
              setFirstName(partnerProfile?.firstName ?? "");
              setFirstNameError(null);
              setUpdate(0);
            }}
            onCancel={() => setUpdate(-1)}
            onSave={handleSaveFirstName}
            error={firstNameError}
            placeholder="Enter first name"
          />
          <EditableField
            label="Last name"
            value={partnerProfile?.lastName}
            draft={lastName}
            onDraftChange={setLastName}
            editing={update === 1}
            onEdit={() => {
              setLastName(partnerProfile?.lastName ?? "");
              setLastNameError(null);
              setUpdate(1);
            }}
            onCancel={() => setUpdate(-1)}
            onSave={handleSaveLastName}
            error={lastNameError}
            placeholder="Enter last name"
          />
          <EditableField
            label="Email address"
            value={partnerProfile?.email}
            draft={email}
            onDraftChange={setEmail}
            editing={update === 2}
            onEdit={() => {
              setEmail(partnerProfile?.email ?? "");
              setEmailError(null);
              setUpdate(2);
            }}
            onCancel={() => setUpdate(-1)}
            onSave={handleSaveEmail}
            error={emailError}
            type="email"
            placeholder="Enter email address"
          />
          <EditableField
            label="Phone number"
            value={phoneNumber || partnerProfile?.phoneNumber}
            draft={phoneNumber}
            onDraftChange={setPhoneNumber}
            editing={update === 3}
            onEdit={() => {
              setPhoneNumber(partnerProfile?.phoneNumber ?? "");
              setPhoneError(null);
              setUpdate(3);
            }}
            onCancel={() => setUpdate(-1)}
            onSave={handleSavePhoneNumber}
            error={phoneError}
            type="tel"
            placeholder="Enter phone number"
          />
        </div>
      </section>

      {/* ---------- Business (read only) ---------- */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Business
          <span className={styles.readOnlyTag}>Read only</span>
        </h3>
        <div className={styles.readOnlyList}>
          <div className={styles.readOnlyRow}>
            <span className={styles.readOnlyLabel}>Business name</span>
            <span className={styles.readOnlyValue}>
              {partnerProfile?.businessName || "Not specified"}
            </span>
          </div>
          <div className={styles.readOnlyRow}>
            <span className={styles.readOnlyLabel}>Business type</span>
            <span className={styles.readOnlyValue}>
              {partnerProfile?.businessType || "Not specified"}
            </span>
          </div>
          <div className={styles.readOnlyRow}>
            <span className={styles.readOnlyLabel}>Address</span>
            <span className={styles.readOnlyValue}>{addressLine}</span>
          </div>
        </div>
      </section>

      {/* ---------- Account (read only) ---------- */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Account
          <span className={styles.readOnlyTag}>Read only</span>
        </h3>
        <div className={styles.readOnlyList}>
          <div className={styles.readOnlyRow}>
            <span className={styles.readOnlyLabel}>Account status</span>
            <span className={styles.readOnlyValue}>{status}</span>
          </div>
          <div className={styles.readOnlyRow}>
            <span className={styles.readOnlyLabel}>Verification</span>
            <span className={styles.readOnlyValue}>
              {verified ? "Verified" : "Not verified"}
            </span>
          </div>
        </div>

        {partnerProfile?.status === "INACTIVE" && (
          <div className={styles.infoNote}>
            <Lightbulb size={17} strokeWidth={2} aria-hidden="true" />
            <div>
              <p className={styles.infoTitle}>Activate your account</p>
              <p className={styles.infoText}>
                Add at least one property, or make sure one of your properties is
                active, to switch your account to active.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default ProfileDetails;
