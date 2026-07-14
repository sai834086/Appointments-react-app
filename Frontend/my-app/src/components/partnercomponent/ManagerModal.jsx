import { useEffect, useState } from "react";
import StyleSheet from "./ManagerModal.module.css";
import {
  addPropertyManager,
  updatePropertyManager,
  removePropertyManager,
} from "../../api/authService";

// Shared validation patterns — mirror the backend @Pattern rules.
// No password here: manager accounts get an auto-generated password on the
// backend, and the manager sets their own via the emailed invite link.
const patterns = {
  firstName: /^[A-Za-z ]{1,44}$/,
  lastName: /^[A-Za-z ]{1,44}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phoneNumber: /^[0-9]{10}$/,
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
};

/**
 * ManagerModal
 * -------------
 * - mode = "add" (no dedicated manager yet) OR "edit" (manager exists)
 * - manager: the existing manager object for edit mode (optional)
 * - onSaved: callback(newManager) after successful save
 */
export default function ManagerModal({
  isOpen,
  onClose,
  mode = "add",
  propertyId,
  propertyName,
  manager = null,
  onSaved,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Two-step delete: first click arms the confirmation, second click deletes.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Prefill on open / when manager changes
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (mode === "edit" && manager) {
        setFormData({
          firstName: manager.firstName || "",
          lastName: manager.lastName || "",
          email: manager.email || "",
          phoneNumber: manager.phoneNumber || "",
        });
      } else {
        setFormData(emptyForm);
      }
    }
  }, [isOpen, mode, manager]);

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
    setConfirmingDelete(false);
    setIsDeleting(false);
    onClose();
  };

  // Delete the manager: unassigns them from the property AND removes their
  // user account on the backend (when it's a pure manager account).
  const handleDeleteManager = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setIsDeleting(true);
    setErrors({});
    try {
      await removePropertyManager(propertyId);
      if (onSaved) onSaved(null);
      handleClose();
    } catch (err) {
      setErrors({
        submit:
          err.response?.data?.message ||
          "Failed to remove manager. Please try again.",
      });
      setConfirmingDelete(false);
    } finally {
      setIsDeleting(false);
    }
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
      };

      const response =
        mode === "edit"
          ? await updatePropertyManager(propertyId, payload)
          : await addPropertyManager(propertyId, payload);

      const savedManager =
        response.data?.data?.manager ||
        response.data?.manager ||
        response.data ||
        null;

      if (onSaved) onSaved(savedManager);
      handleClose();
    } catch (err) {
      let errorMessage =
        mode === "edit"
          ? "Failed to update manager. Please try again."
          : "Failed to add manager. Please try again.";
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

  const title = mode === "edit" ? "Edit Manager" : "Add Manager";
  const subtitle =
    mode === "edit"
      ? `Update manager details for ${propertyName || "this property"}.`
      : `Assign a dedicated manager to ${propertyName || "this property"}.`;

  return (
    <div className={StyleSheet.ModalOverlay} role="dialog" aria-modal="true">
      <div className={StyleSheet.ModalContainer}>
        <div className={StyleSheet.ModalHeader}>
          <div className={StyleSheet.HeaderLeft}>
            <div className={StyleSheet.HeaderIcon} aria-hidden="true">
              {mode === "edit" ? "✏️" : "👔"}
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
              <label htmlFor="mgr-firstName" className={StyleSheet.FormLabel}>
                First Name <span className={StyleSheet.RequiredMark}>*</span>
              </label>
              <input
                type="text"
                id="mgr-firstName"
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
              <label htmlFor="mgr-lastName" className={StyleSheet.FormLabel}>
                Last Name <span className={StyleSheet.RequiredMark}>*</span>
              </label>
              <input
                type="text"
                id="mgr-lastName"
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
            <label htmlFor="mgr-email" className={StyleSheet.FormLabel}>
              Email <span className={StyleSheet.RequiredMark}>*</span>
            </label>
            <input
              type="email"
              id="mgr-email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              disabled={mode === "edit"}
              className={`${StyleSheet.FormInput} ${
                errors.email ? StyleSheet.InputError : ""
              }`}
              placeholder="manager@example.com"
              maxLength={45}
            />
            {errors.email && (
              <span className={StyleSheet.ErrorMessage}>{errors.email}</span>
            )}
          </div>

          <div className={StyleSheet.FormGroup}>
            <label htmlFor="mgr-phoneNumber" className={StyleSheet.FormLabel}>
              Phone Number <span className={StyleSheet.RequiredMark}>*</span>
            </label>
            <input
              type="tel"
              id="mgr-phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              onBlur={handleBlur}
              disabled={mode === "edit"}
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

          {mode === "add" && (
            <div className={StyleSheet.InviteNote}>
              We&apos;ll email an invitation to this address. Their password is
              auto-generated — the email includes a secure link to set their
              own password before their first sign-in.
            </div>
          )}

          {errors.submit && (
            <div className={StyleSheet.SubmitError}>{errors.submit}</div>
          )}

          <div className={StyleSheet.FormActions}>
            {mode === "edit" && (
              <button
                type="button"
                className={StyleSheet.DeleteButton}
                onClick={handleDeleteManager}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting
                  ? "Removing…"
                  : confirmingDelete
                    ? "Confirm delete?"
                    : "Delete Manager"}
              </button>
            )}
            <button
              type="button"
              className={StyleSheet.CancelButton}
              onClick={handleClose}
              disabled={isSubmitting || isDeleting}
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
                  : "Add Manager"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
