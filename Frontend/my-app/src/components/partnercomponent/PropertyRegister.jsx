import styles from "./PropertyRegister.module.css";
import AddressForm from "./AddressForm";
import { useState, useEffect } from "react";

function PropertyRegister({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    propertyName: "",
    buildingNo: "",
    street: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions matching backend @Pattern annotations
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
      if (!/^[A-Za-z.' ]{1,44}$/.test(value)) return "In valid city name";
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateField = (field, value) => {
    const validator = validators[field];
    return validator ? validator(value) : null;
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on successful submission
      setFormData({
        propertyName: "",
        buildingNo: "",
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      });
      setErrors({});
      onClose();
    } catch (error) {
      // Handle backend validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({
          general: "Failed to register property. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData({
      propertyName: "",
      buildingNo: "",
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    });
    setErrors({});
    onClose();
  };

  // Escape closes the modal, matching the delete-confirm dialog elsewhere
  // on the dashboard. Disabled while a submit is in flight so an accidental
  // key press can't drop an in-progress request.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-property-heading"
      >
        <div className={styles.header}>
          <h2 id="add-property-heading">Add New Property</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* General error */}
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
              {isSubmitting ? "Registering..." : "Register Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PropertyRegister;
