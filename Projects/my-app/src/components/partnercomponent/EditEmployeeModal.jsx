import { useState, useEffect } from "react";
import { updateEmployee } from "../../api/authService";
import StyleSheet from "./AddEmployeeModal.module.css";

export default function EditEmployeeModal({
  isOpen,
  onClose,
  employee,
  propertyId,
  onEmployeeUpdated,
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form with employee data when modal opens
  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        phoneNumber: employee.phoneNumber || "",
      });
    }
  }, [employee, isOpen]);

  // Validation patterns
  const patterns = {
    firstName: /^[A-Za-z ]{1,44}$/,
    lastName: /^[A-Za-z ]{1,44}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phoneNumber: /^[0-9]{10}$/,
  };

  const validateField = (name, value) => {
    const fieldErrors = {};

    switch (name) {
      case "firstName":
        if (!value.trim()) {
          fieldErrors[name] = "First name required";
        } else if (!patterns.firstName.test(value)) {
          fieldErrors[name] = "First name must contain only letters";
        }
        break;

      case "lastName":
        if (!value.trim()) {
          fieldErrors[name] = "Last name required";
        } else if (!patterns.lastName.test(value)) {
          fieldErrors[name] = "Last name must contain only letters";
        }
        break;

      case "email":
        // Email is optional - only validate if provided
        if (value.trim()) {
          if (value.length > 45) {
            fieldErrors[name] = "Email must be 45 characters or less";
          } else if (!patterns.email.test(value)) {
            fieldErrors[name] = "Email should be valid";
          }
        }
        break;

      case "phoneNumber":
        // Phone number is optional - only validate if provided
        if (value.trim()) {
          if (!patterns.phoneNumber.test(value)) {
            fieldErrors[name] = "Phone number must be 10 digits";
          }
        }
        break;

      case "appointmentsOpenTillInMonths":
        // Appointments duration is optional - only validate if provided
        if (value.trim()) {
          if (!patterns.appointmentsOpenTillInMonths.test(value)) {
            fieldErrors[name] = "Must be a single digit (0-9)";
          }
        }
        break;

      default:
        break;
    }

    return fieldErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldErrors = validateField(name, value);

    setErrors((prev) => ({
      ...prev,
      ...fieldErrors,
    }));
  };

  const validateForm = () => {
    const formErrors = {};

    Object.keys(formData).forEach((key) => {
      const fieldErrors = validateField(key, formData[key]);
      Object.assign(formErrors, fieldErrors);
    });

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get employeeId first
      const employeeId = employee.id || employee.employeeId;

      // Prepare data with null values for empty optional fields
      const requestData = {
        ...formData,
        email: formData.email.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
        appointmentsOpenTillInMonths:
          formData.appointmentsOpenTillInMonths.trim() || null,
      };

      const response = await updateEmployee(
        propertyId,
        employeeId,
        requestData
      );
      const data = response.data || response;

      // Call callback to update employee list
      if (onEmployeeUpdated) {
        onEmployeeUpdated(data);
      }

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        appointmentsOpenTillInMonths: "",
      });

      // Close modal
      onClose();
    } catch (err) {
      // Extract server error message from response
      let errorMessage = "Failed to update employee. Please try again.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setErrors({
        submit: errorMessage,
      });
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
      appointmentsOpenTillInMonths: "",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={StyleSheet.ModalOverlay}>
      <div className={StyleSheet.ModalContainer}>
        <div className={StyleSheet.ModalHeader}>
          <h2 className={StyleSheet.ModalTitle}>Edit Employee</h2>
          <button
            className={StyleSheet.CloseButton}
            onClick={handleClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={StyleSheet.ModalForm}>
          <div className={StyleSheet.FormGrid}>
            {/* First Name */}
            <div className={StyleSheet.FormGroup}>
              <label htmlFor="firstName" className={StyleSheet.FormLabel}>
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${StyleSheet.FormInput} ${
                  errors.firstName ? StyleSheet.InputError : ""
                }`}
                placeholder="Enter first name"
                maxLength={44}
              />
              {errors.firstName && (
                <span className={StyleSheet.ErrorMessage}>
                  {errors.firstName}
                </span>
              )}
            </div>

            {/* Last Name */}
            <div className={StyleSheet.FormGroup}>
              <label htmlFor="lastName" className={StyleSheet.FormLabel}>
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${StyleSheet.FormInput} ${
                  errors.lastName ? StyleSheet.InputError : ""
                }`}
                placeholder="Enter last name"
                maxLength={44}
              />
              {errors.lastName && (
                <span className={StyleSheet.ErrorMessage}>
                  {errors.lastName}
                </span>
              )}
            </div>

            {/* Email */}
            <div className={StyleSheet.FormGroup}>
              <label htmlFor="email" className={StyleSheet.FormLabel}>
                Email Address (Optional)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${StyleSheet.FormInput} ${
                  errors.email ? StyleSheet.InputError : ""
                }`}
                placeholder="Enter email address (optional)"
                maxLength={45}
              />
              {errors.email && (
                <span className={StyleSheet.ErrorMessage}>{errors.email}</span>
              )}
            </div>

            {/* Phone Number */}
            <div className={StyleSheet.FormGroup}>
              <label htmlFor="phoneNumber" className={StyleSheet.FormLabel}>
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${StyleSheet.FormInput} ${
                  errors.phoneNumber ? StyleSheet.InputError : ""
                }`}
                placeholder="Enter 10-digit phone number (optional)"
                maxLength={10}
              />
              {errors.phoneNumber && (
                <span className={StyleSheet.ErrorMessage}>
                  {errors.phoneNumber}
                </span>
              )}
            </div>

            {/* Removed Appointments Open Till field */}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className={StyleSheet.SubmitError}>{errors.submit}</div>
          )}

          {/* Form Actions */}
          <div className={StyleSheet.FormActions}>
            <button
              type="button"
              onClick={handleClose}
              className={StyleSheet.CancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={StyleSheet.SubmitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating Employee..." : "Update Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
