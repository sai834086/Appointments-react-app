import styles from "./PropertyRegister.module.css";
import AddressForm from "./AddressForm";
import { useState } from "react";

function PropertyRegister({ isOpen, onClose, onSubmit }) {
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

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions matching backend @Pattern annotations
  const validators = {
    firstName: (value) => {
      if (!value || value.trim() === "") return null; // Optional field
      if (!/^[A-Za-z ]{1,44}$/.test(value))
        return "First name must contain only letters";
      return null;
    },
    lastName: (value) => {
      if (!value || value.trim() === "") return null; // Optional field
      if (!/^[A-Za-z ]{1,44}$/.test(value))
        return "Last name must contain only letters";
      return null;
    },
    email: (value) => {
      if (!value || value.trim() === "") return null; // Optional field
      if (value.length > 45) return "Email must be 45 characters or less";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Email should be valid";
      return null;
    },
    phoneNumber: (value) => {
      if (!value || value.trim() === "") return null; // Optional field
      if (!/^[0-9]{10}$/.test(value)) return "Phone number must be 10 digits";
      return null;
    },
    password: (value) => {
      if (!value || value.trim() === "") return null; // Optional field
      if (value.length < 8 || value.length > 20)
        return "Password must be at least 8 characters";
      if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).*$/.test(value)) {
        return "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character";
      }
      return null;
    },
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
    setFormData({
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
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Add New Property</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* General error */}
          {errors.general && (
            <div className={styles.generalError}>{errors.general}</div>
          )}

          <div className={styles.section}>
            <h3>Manager Information (Optional)</h3>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className={
                    errors.firstName ? styles.inputError : styles.input
                  }
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <div className={styles.fieldError}>{errors.firstName}</div>
                )}
              </div>

              <div className={styles.field}>
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className={errors.lastName ? styles.inputError : styles.input}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <div className={styles.fieldError}>{errors.lastName}</div>
                )}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? styles.inputError : styles.input}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <div className={styles.fieldError}>{errors.email}</div>
                )}
              </div>

              <div className={styles.field}>
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  className={
                    errors.phoneNumber ? styles.inputError : styles.input
                  }
                  placeholder="Enter 10-digit phone number"
                  maxLength="10"
                />
                {errors.phoneNumber && (
                  <div className={styles.fieldError}>{errors.phoneNumber}</div>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={errors.password ? styles.inputError : styles.input}
                placeholder="Enter password (8-20 chars, include A-Z, a-z, 0-9, special char)"
              />
              {errors.password && (
                <div className={styles.fieldError}>{errors.password}</div>
              )}
            </div>
          </div>

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
              {isSubmitting ? "Registering..." : "Register Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PropertyRegister;
