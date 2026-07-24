import { useEffect, useState } from "react";
import StyleSheet from "./ReceptionistModal.module.css";
import {
  addPropertyReceptionist,
  updatePropertyReceptionist,
} from "../../api/authService";

// Shared validation patterns — mirror the backend @Pattern rules
const patterns = {
  firstName: /^[A-Za-z ]{1,44}$/,
  lastName: /^[A-Za-z ]{1,44}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneNumber: /^[0-9]{10}$/,
  password: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,20}$/,
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
};

/**
 * ReceptionistModal
 * -------------------
 * A property can have any number of receptionists.
 * - mode = "add" (assign a new receptionist) OR "edit" (edit one of the
 *   property's existing receptionists)
 * - receptionist: the specific receptionist object being edited (required
 *   for edit mode — its userId identifies which one to update)
 * - onSaved: callback(savedReceptionist) after successful save
 *
 * Mirrors ManagerModal's form — receptionists are strictly read-only within
 * the app itself (view appointments only).
 */
export default function ReceptionistModal({
  isOpen,
  onClose,
  mode = "add",
  propertyId,
  propertyName,
  receptionist = null,
  onSaved,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill on open / when receptionist changes
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (mode === "edit" && receptionist) {
        setFormData({
          firstName: receptionist.firstName || "",
          lastName: receptionist.lastName || "",
          email: receptionist.email || "",
          phoneNumber: receptionist.phoneNumber || "",
          password: "",
        });
      } else {
        setFormData(emptyForm);
      }
    }
  }, [isOpen, mode, receptionist]);

  const validateField = (name, value) => {
    const fieldErrors = {};
    const trimmed = (value || "").trim();

    switch (name) {
      case "firstName":
        if (!trimmed) fieldErrors[name] = "First name is required";
        else if (!patterns.firstName.test(trimmed))
          fieldErrors[name] = "Only letters allowed (1-44 chars)";
        break;
      case "lastName":
        if (!trimmed) fieldErrors[name] = "Last name is required";
        else if (!patterns.lastName.test(trimmed))
          fieldErrors[name] = "Only letters allowed (1-44 chars)";
        break;
      case "email":
        if (!trimmed) fieldErrors[name] = "Email is required";
        else if (trimmed.length > 45)
          fieldErrors[name] = "Email must be 45 characters or less";
        else if (!patterns.email.test(trimmed))
          fieldErrors[name] = "Email is not valid";
        break;
      case "phoneNumber":
        if (!trimmed) fieldErrors[name] = "Phone number is required";
        else if (!patterns.phoneNumber.test(trimmed))
          fieldErrors[name] = "Phone must be exactly 10 digits";
        break;
      case "password":
        // Required only for "add" mode. For edit mode, empty means "unchanged".
        if (mode === "add") {
          if (!trimmed) fieldErrors[name] = "Password is required";
          else if (!patterns.password.test(trimmed))
            fieldErrors[name] =
              "8-20 chars with upper, lower, digit and special char";
        } else if (trimmed) {
          if (!patterns.password.test(trimmed))
            fieldErrors[name] =
              "8-20 chars with upper, lower, digit and special char";
        }
        break;
      default:
        break;
    }
    return fieldErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldErrors = validateField(name, value);
    setErrors((prev) => ({ ...prev, ...fieldErrors }));
  };

  const validateForm = () => {
    const formErrors = {};
    Object.keys(formData).forEach((key) => {
      Object.assign(formErrors, validateField(key, formData[key]));
    });
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleClose = () => {
    setFormData(emptyForm);
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password.trim() || "",
      };

      const response =
        mode === "edit"
          ? await updatePropertyReceptionist(
              propertyId,
              receptionist?.userId,
              payload,
            )
          : await addPropertyReceptionist(propertyId, payload);

      const savedReceptionist =
        response.data?.data?.receptionist ||
        response.data?.receptionist ||
        response.data ||
        null;

      if (onSaved) onSaved(savedReceptionist);
      handleClose();
    } catch (err) {
      let errorMessage =
        mode === "edit"
          ? "Failed to update receptionist. Please try again."
          : "Failed to add receptionist. Please try again.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const title = mode === "edit" ? "Edit Receptionist" : "Add Receptionist";
  const subtitle =
    mode === "edit"
      ? `Update receptionist details for ${propertyName || "this property"}.`
      : `Assign a receptionist to ${propertyName || "this property"}. They'll only be able to view this property's appointments.`;

  return (
    <div className={StyleSheet.ModalOverlay} role="dialog" aria-modal="true">
      <div className={StyleSheet.ModalContainer}>
        <div className={StyleSheet.ModalHeader}>
          <div className={StyleSheet.HeaderLeft}>
            <div className={StyleSheet.HeaderIcon} aria-hidden="true">
              {mode === "edit" ? "✏️" : "📋"}
            </div>
            <div>
              <h2 className={StyleSheet.ModalTitle}>{title}</h2>
              <p className={StyleSheet.ModalSubtitle}>{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className={StyleSheet.CloseButton}
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={StyleSheet.ModalForm}>
          <div className={StyleSheet.FormRow}>
            <div className={StyleSheet.FormGroup}>
              <label htmlFor="rcp-firstName" className={StyleSheet.FormLabel}>
                First Name <span className={StyleSheet.RequiredMark}>*</span>
              </label>
              <input
                type="text"
                id="rcp-firstName"
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

            <div className={StyleSheet.FormGroup}>
              <label htmlFor="rcp-lastName" className={StyleSheet.FormLabel}>
                Last Name <span className={StyleSheet.RequiredMark}>*</span>
              </label>
              <input
                type="text"
                id="rcp-lastName"
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
          </div>

          <div className={StyleSheet.FormGroup}>
            <label htmlFor="rcp-email" className={StyleSheet.FormLabel}>
              Email <span className={StyleSheet.RequiredMark}>*</span>
            </label>
            <input
              type="email"
              id="rcp-email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`${StyleSheet.FormInput} ${
                errors.email ? StyleSheet.InputError : ""
              }`}
              placeholder="receptionist@example.com"
              maxLength={45}
            />
            {errors.email && (
              <span className={StyleSheet.ErrorMessage}>{errors.email}</span>
            )}
          </div>

          <div className={StyleSheet.FormRow}>
            <div className={StyleSheet.FormGroup}>
              <label htmlFor="rcp-phoneNumber" className={StyleSheet.FormLabel}>
                Phone Number <span className={StyleSheet.RequiredMark}>*</span>
              </label>
              <input
                type="tel"
                id="rcp-phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${StyleSheet.FormInput} ${
                  errors.phoneNumber ? StyleSheet.InputError : ""
                }`}
                placeholder="1234567890"
                maxLength={10}
              />
              {errors.phoneNumber && (
                <span className={StyleSheet.ErrorMessage}>
                  {errors.phoneNumber}
                </span>
              )}
            </div>

            <div className={StyleSheet.FormGroup}>
              <label htmlFor="rcp-password" className={StyleSheet.FormLabel}>
                Password
                {mode === "add" && (
                  <span className={StyleSheet.RequiredMark}> *</span>
                )}
              </label>
              <input
                type="password"
                id="rcp-password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`${StyleSheet.FormInput} ${
                  errors.password ? StyleSheet.InputError : ""
                }`}
                placeholder={
                  mode === "edit"
                    ? "Leave blank to keep current"
                    : "Set account password"
                }
                maxLength={20}
                autoComplete="new-password"
              />
              {errors.password ? (
                <span className={StyleSheet.ErrorMessage}>
                  {errors.password}
                </span>
              ) : (
                <span className={StyleSheet.HelperText}>
                  8-20 chars · upper, lower, digit, and special character
                </span>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className={StyleSheet.SubmitError}>{errors.submit}</div>
          )}

          <div className={StyleSheet.FormActions}>
            <button
              type="button"
              className={StyleSheet.CancelButton}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={StyleSheet.SubmitButton}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? mode === "edit"
                  ? "Saving…"
                  : "Adding…"
                : mode === "edit"
                  ? "Save Changes"
                  : "Add Receptionist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
