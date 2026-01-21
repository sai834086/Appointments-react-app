import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashBoardHeader from "../../components/usercomponent/DashBoardHeader";
import styles from "./ProfilePage.module.css";
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  User,
  Edit,
  X,
  Check,
} from "lucide-react";
import { getUserDetails, updateUserProfile } from "../../api/userService";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await getUserDetails();
        console.log("User details response:", response);
        setUserDetails(response?.data?.data?.Profile);
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError(err.response?.data?.message || "Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handleEditField = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setEditValues({ ...editValues, [fieldName]: currentValue });
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValues({});
    setFieldErrors({});
  };

  const validateField = (fieldName, value) => {
    // Validate firstName
    if (fieldName === "firstName") {
      if (!value || value.trim() === "") {
        return "First name is required";
      }
      if (value.length < 2) {
        return "First name must be at least 2 characters";
      }
      return null;
    }

    // Validate lastName
    if (fieldName === "lastName") {
      if (!value || value.trim() === "") {
        return "Last name is required";
      }
      if (value.length < 2) {
        return "Last name must be at least 2 characters";
      }
      return null;
    }

    // Validate email
    if (fieldName === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value || !emailRegex.test(value)) {
        return "Please enter a valid email address";
      }
      return null;
    }

    // Validate phoneNumber - must be exactly 10 digits
    if (fieldName === "phoneNumber") {
      const phoneRegex = /^\d{10}$/;
      if (!value || !phoneRegex.test(value)) {
        return "Phone number must contain exactly 10 digits";
      }
      return null;
    }

    // Validate address
    if (fieldName === "address") {
      if (!value || value.trim() === "") {
        return "Address is required";
      }
      if (value.length < 5) {
        return "Address must be at least 5 characters";
      }
      return null;
    }

    return null;
  };

  const handleSaveEdit = async (fieldName) => {
    try {
      const newValue = editValues[fieldName];

      // Validate the field before updating
      const validationError = validateField(fieldName, newValue);
      if (validationError) {
        setFieldErrors({ ...fieldErrors, [fieldName]: validationError });
        return;
      }

      // Clear field errors if validation passes
      setFieldErrors({ ...fieldErrors, [fieldName]: null });

      // Call API to update the field
      await updateUserProfile(fieldName, newValue);

      // Fetch updated user details
      const response = await getUserDetails();
      setUserDetails(response?.data?.data?.Profile);

      // Show success message
      setSuccess("Profile updated successfully!");
      setError(null);

      // Clear messages after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

      setEditingField(null);
      setEditValues({});
    } catch (err) {
      console.error("Error updating profile:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to update profile";
      setFieldErrors({ ...fieldErrors, [fieldName]: errorMsg });
      setSuccess(null);
      // Keep editingField set so error message remains visible
    }
  };

  if (loading) {
    return (
      <div className={styles.mainContainer}>
        <DashBoardHeader />
        <div className={styles.headerSection}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/account")}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.headerTitle}>Profile</h1>
        </div>
        <div className={styles.pageWrapper}>
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.mainContainer}>
        <DashBoardHeader />
        <div className={styles.headerSection}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/account")}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.headerTitle}>Profile</h1>
        </div>
        <div className={styles.pageWrapper}>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <DashBoardHeader />
      <div className={styles.headerSection}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/account")}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.headerTitle}>Profile</h1>
      </div>
      <div className={styles.pageWrapper}>
        {success && (
          <div className={styles.successMessage}>
            <p>{success}</p>
          </div>
        )}
        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}
        <div className={styles.content}>
          {/* Details Card */}
          <div className={styles.detailsCard}>
            {/* First Name */}
            {userDetails?.firstName && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <User size={18} />
                </div>
                <div className={styles.detailContent}>
                  <p className={styles.detailLabel}>First Name</p>
                  {editingField === "firstName" ? (
                    <div className={styles.editContainer}>
                      <input
                        type="text"
                        className={styles.editInput}
                        value={editValues.firstName || ""}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            firstName: e.target.value,
                          })
                        }
                        autoFocus
                      />
                      {fieldErrors.firstName && (
                        <p className={styles.fieldError}>
                          {fieldErrors.firstName}
                        </p>
                      )}
                      <div className={styles.editButtons}>
                        <button
                          className={styles.cancelBtn}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleSaveEdit("firstName")}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.detailValue}>
                      <p>{userDetails.firstName}</p>
                      <button
                        className={styles.editBtn}
                        onClick={() =>
                          handleEditField("firstName", userDetails.firstName)
                        }
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Last Name */}
            {userDetails?.lastName && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <User size={18} />
                </div>
                <div className={styles.detailContent}>
                  <p className={styles.detailLabel}>Last Name</p>
                  {editingField === "lastName" ? (
                    <div className={styles.editContainer}>
                      <input
                        type="text"
                        className={styles.editInput}
                        value={editValues.lastName || ""}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            lastName: e.target.value,
                          })
                        }
                        autoFocus
                      />
                      {fieldErrors.lastName && (
                        <p className={styles.fieldError}>
                          {fieldErrors.lastName}
                        </p>
                      )}
                      <div className={styles.editButtons}>
                        <button
                          className={styles.cancelBtn}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleSaveEdit("lastName")}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.detailValue}>
                      <p>{userDetails.lastName}</p>
                      <button
                        className={styles.editBtn}
                        onClick={() =>
                          handleEditField("lastName", userDetails.lastName)
                        }
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            {userDetails?.email && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <Mail size={18} />
                </div>
                <div className={styles.detailContent}>
                  <p className={styles.detailLabel}>Email</p>
                  {editingField === "email" ? (
                    <div className={styles.editContainer}>
                      <input
                        type="email"
                        className={styles.editInput}
                        value={editValues.email || ""}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            email: e.target.value,
                          })
                        }
                        autoFocus
                      />
                      {fieldErrors.email && (
                        <p className={styles.fieldError}>{fieldErrors.email}</p>
                      )}
                      <div className={styles.editButtons}>
                        <button
                          className={styles.cancelBtn}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleSaveEdit("email")}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.detailValue}>
                      <p>{userDetails.email}</p>
                      <button
                        className={styles.editBtn}
                        onClick={() =>
                          handleEditField("email", userDetails.email)
                        }
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Phone */}
            {userDetails?.phoneNumber && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <Phone size={18} />
                </div>
                <div className={styles.detailContent}>
                  <p className={styles.detailLabel}>Phone Number</p>
                  {editingField === "phoneNumber" ? (
                    <div className={styles.editContainer}>
                      <input
                        type="tel"
                        className={styles.editInput}
                        value={editValues.phoneNumber || ""}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            phoneNumber: e.target.value,
                          })
                        }
                        autoFocus
                      />
                      {fieldErrors.phoneNumber && (
                        <p className={styles.fieldError}>
                          {fieldErrors.phoneNumber}
                        </p>
                      )}
                      <div className={styles.editButtons}>
                        <button
                          className={styles.cancelBtn}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleSaveEdit("phoneNumber")}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.detailValue}>
                      <p>{userDetails.phoneNumber}</p>
                      <button
                        className={styles.editBtn}
                        onClick={() =>
                          handleEditField(
                            "phoneNumber",
                            userDetails.phoneNumber
                          )
                        }
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address */}
            {userDetails?.address && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <MapPin size={18} />
                </div>
                <div className={styles.detailContent}>
                  <p className={styles.detailLabel}>Address</p>
                  {editingField === "address" ? (
                    <div className={styles.editContainer}>
                      <input
                        type="text"
                        className={styles.editInput}
                        value={editValues.address || ""}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            address: e.target.value,
                          })
                        }
                        autoFocus
                      />
                      {fieldErrors.address && (
                        <p className={styles.fieldError}>
                          {fieldErrors.address}
                        </p>
                      )}
                      <div className={styles.editButtons}>
                        <button
                          className={styles.cancelBtn}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleSaveEdit("address")}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.detailValue}>
                      <p>{userDetails.address}</p>
                      <button
                        className={styles.editBtn}
                        onClick={() =>
                          handleEditField("address", userDetails.address)
                        }
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
