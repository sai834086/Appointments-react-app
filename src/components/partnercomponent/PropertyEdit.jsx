import styles from "./PropertyRegister.module.css";
import AddressForm from "./AddressForm";
import { useState, useEffect, useContext, useCallback } from "react";
import { PartnerAuthContext } from "../../pages/patneruserpages/context/PartnerAuthContext";

function PropertyEdit({ isOpen, onClose, property, onUpdate, onDelete }) {
  // PropertyUpdateRequest on the backend requires firstName/lastName/email/
  // phoneNumber alongside the property fields. Those belong to the partner
  // owner, not the property, so we read them from PartnerAuthContext and
  // pass them through silently — the user doesn't see them in the form.
  const { partnerProfile } = useContext(PartnerAuthContext) || {};
  const [formData, setFormData] = useState({
    propertyName: "",
    buildingNo: "",
    street: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    // Sent silently — required by backend but not shown in UI
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form whenever the property (or the partner profile, since
  // it backs the silent owner-contact fields) changes.
  useEffect(() => {
    if (property) {
      setFormData({
        propertyName: property.propertyName || property.name || "",
        buildingNo: property.buildingNo || "",
        street: property.street || "",
        city: property.city || "",
        state: property.state || "",
        country: property.country || "",
        zipCode: property.zipCode || "",
        // Partner-owner contact fields, sourced from the auth context so
        // they always have a value and pass backend @NotBlank/@Pattern
        // validation.
        firstName:
          property.firstName || partnerProfile?.firstName || "",
        lastName: property.lastName || partnerProfile?.lastName || "",
        email: property.email || partnerProfile?.email || "",
        phoneNumber:
          property.phoneNumber || partnerProfile?.phoneNumber || "",
      });
      setErrors({});
    }
  }, [property, partnerProfile]);

  // Validation matching backend @Pattern annotations
  const validators = {
    propertyName: (value) => {
      if (!value || value.trim() === "") return "Business name is required";
      if (!/^[A-Za-z' ]{1,44}$/.test(value))
        return "Business name must contain only letters";
      return null;
    },
    buildingNo: (value) => {
      if (!value || value.trim() === "") return "Building number is required";
      if (!/^[A-Za-z0-9\-_()/]{1,45}$/.test(value))
        return "Building number can contain letters and digits";
      return null;
    },
    street: (value) => {
      if (!value || value.trim() === "") return "Street is required";
      if (!/^[A-Za-z0-9' ]{1,45}$/.test(value))
        return "Street can contain letters, digits, and spaces";
      return null;
    },
    city: (value) => {
      if (!value || value.trim() === "") return "City is required";
      if (!/^[A-Za-z.' ]{1,44}$/.test(value)) return "Invalid city name";
      return null;
    },
    state: (value) => {
      if (!value || value.trim() === "") return "State is required";
      if (!/^[A-Za-z ]{1,44}$/.test(value))
        return "State must contain only letters";
      return null;
    },
    country: (value) => {
      if (!value || value.trim() === "") return "Country is required";
      if (!/^[A-Za-z ]{1,44}$/.test(value))
        return "Country must contain only letters";
      return null;
    },
    zipCode: (value) => {
      if (!value || value.trim() === "") return "Zip code is required";
      if (!/^[A-Za-z0-9]{1,45}$/.test(value))
        return "Zip code can contain letters and digits";
      return null;
    },
  };

  const validateForm = () => {
    const newErrors = {};
    ["propertyName", "buildingNo", "street", "city", "state", "country", "zipCode"].forEach(
      (field) => {
        const error = validators[field]?.(formData[field]);
        if (error) newErrors[field] = error;
      }
    );
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onUpdate(property.propertyId || property.id, formData);
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Failed to update property. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setErrors({});
    onClose();
  }, [isSubmitting, onClose]);

  // Escape closes the modal, matching the delete-confirm dialog elsewhere
  // on the dashboard. Disabled while a submit is in flight.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-property-heading"
      >
        <div className={styles.header}>
          <h2 id="edit-property-heading">Edit Property</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {errors.general && (
            <div className={styles.generalError}>{errors.general}</div>
          )}

          {/* Property Information Section */}
          <div className={styles.section}>
            <h3>Property Information</h3>

            <div className={styles.field}>
              <label>Property Name *</label>
              <input
                type="text"
                value={formData.propertyName}
                onChange={(e) =>
                  handleInputChange("propertyName", e.target.value)
                }
                className={
                  errors.propertyName ? styles.inputError : styles.input
                }
                placeholder="Enter property/business name"
              />
              {errors.propertyName && (
                <div className={styles.fieldError}>{errors.propertyName}</div>
              )}
            </div>
          </div>

          {/* Address Information Section */}
          <div className={styles.section}>
            <h3>Address Information</h3>
            <AddressForm
              form={formData}
              onChange={(e) => handleInputChange(e.target.name, e.target.value)}
              errors={errors}
            />
          </div>

          {/* Form Actions */}
          <div className={styles.actions}>
            {onDelete && (
              <button
                type="button"
                className={styles.deleteDangerButton}
                onClick={() => {
                  if (isSubmitting) return;
                  onDelete(property);
                }}
                disabled={isSubmitting}
              >
                Delete Property
              </button>
            )}
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting && <span className={styles.buttonSpinner} />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PropertyEdit;
