import { useState } from "react";
import styles from "./PartnerSignUp.module.css";
import { registerPartner } from "../../api/authService";
import { useNavigate } from "react-router-dom";
import AddressForm from "../../components/partnercomponent/AddressForm";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  businessType: "",
  businessName: "",
  buildingNo: "",
  street: "",
  city: "",
  district: "",
  state: "",
  country: "",
  zipCode: "",
};

function validate(form) {
  const errors = {};
  if (!form.firstName) errors.firstName = "First name required";
  if (!form.lastName) errors.lastName = "Last name required";
  if (!form.email) errors.email = "Email required";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
    errors.email = "Invalid email";
  if (!form.phoneNumber) errors.phoneNumber = "Phone number required";
  else if (!/^\d{10}$/.test(form.phoneNumber))
    errors.phoneNumber = "Phone number must be 10 digits";
  if (!form.password) errors.password = "Password required";
  else if (form.password.length < 8)
    errors.password = "Password must be at least 8 characters";
  if (!form.businessType) errors.businessType = "Business type required";
  if (!form.businessName) errors.businessName = "Business name required";
  if (!form.buildingNo) errors.buildingNo = "Building number required";
  if (!form.street) errors.street = "Street required";
  if (!form.city) errors.city = "City required";
  if (!form.state) errors.state = "State required";
  if (!form.country) errors.country = "Country required";
  if (!form.zipCode) errors.zipCode = "Zip code required";
  return errors;
}

export default function PartnerSignUp() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setErrors((s) => ({ ...s, [name]: undefined }));
    setMessage(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSubmitting(true);
    try {
      const res = await registerPartner(form);
      if (res?.data?.success) {
        navigate("/partner/signup/success");
      } else {
        const text = res?.data?.message || "Registration failed";
        setMessage({ type: "error", text });
      }
    } catch (err) {
      const responseData = err?.response?.data;

      // Handle validation errors from backend
      if (responseData && responseData.data) {
        const fieldErrors = {};
        const errorData = responseData.data;

        // Handle different error response formats
        if (typeof errorData === "object") {
          // Map backend field names to frontend field names
          const fieldMapping = {
            firstName: "firstName",
            lastName: "lastName",
            email: "email",
            phoneNumber: "phoneNumber",
            password: "password",
            businessType: "businessType",
            businessName: "businessName",
            buildingNo: "buildingNo",
            street: "street",
            city: "city",
            district: "district",
            state: "state",
            country: "country",
            zipCode: "zipCode",
          };

          // Extract field-specific errors
          Object.keys(errorData).forEach((key) => {
            const frontendField = fieldMapping[key];
            if (frontendField) {
              fieldErrors[frontendField] = errorData[key];
            }
          });
        }

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          setMessage(null); // Clear general message when showing field errors
        } else {
          const text =
            responseData?.message || err.message || "Registration failed";
          setMessage({ type: "error", text });
        }
      } else {
        const text =
          err?.response?.data?.message || err.message || "Registration failed";
        setMessage({ type: "error", text });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.mainContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Join Our Partner Network</h1>
        <p className={styles.subtitle}>
          Create your account to start managing your business
        </p>
        <p className={styles.loginLink}>
          Already have an account? <a href="/partner/login">Sign in here</a>
        </p>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        {/* Personal Information Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          <div className={styles.sectionContent}>
            <div className={styles.row}>
              <label className={styles.label}>
                First Name
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={onChange}
                  className={styles.input}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <div className={styles.error}>{errors.firstName}</div>
                )}
              </label>
              <label className={styles.label}>
                Last Name
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={onChange}
                  className={styles.input}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <div className={styles.error}>{errors.lastName}</div>
                )}
              </label>
            </div>

            <label className={styles.label}>
              Email Address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className={styles.input}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <div className={styles.error}>{errors.email}</div>
              )}
            </label>

            <label className={styles.label}>
              Phone Number
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={onChange}
                className={styles.input}
                placeholder="Enter your phone number"
              />
              {errors.phoneNumber && (
                <div className={styles.error}>{errors.phoneNumber}</div>
              )}
            </label>

            <label className={styles.label}>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                className={styles.input}
                placeholder="Create a secure password"
              />
              {errors.password && (
                <div className={styles.error}>{errors.password}</div>
              )}
            </label>
          </div>
        </div>

        {/* Business Information Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Business Information</h3>
          <div className={styles.sectionContent}>
            <label className={styles.label}>
              Business Type
              <select
                name="businessType"
                value={form.businessType}
                onChange={onChange}
                className={styles.input}
              >
                <option value="">Select your business type</option>
                <option value="Salon">Salon</option>
                <option value="Hospital">Hospital</option>
                <option value="Restaurant">Restaurant</option>
                <option value="University">University</option>
              </select>
              {errors.businessType && (
                <div className={styles.error}>{errors.businessType}</div>
              )}
            </label>

            <label className={styles.label}>
              Business Name
              <input
                name="businessName"
                value={form.businessName}
                onChange={onChange}
                className={styles.input}
                placeholder="Enter your business name"
              />
              {errors.businessName && (
                <div className={styles.error}>{errors.businessName}</div>
              )}
            </label>
          </div>
        </div>

        {/* Address Information Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Business Address</h3>
          <div className={styles.sectionContent}>
            <AddressForm form={form} onChange={onChange} errors={errors} />
          </div>
        </div>

        {message && (
          <div
            className={`${styles.message} ${
              message.type === "error"
                ? styles.errorMessage
                : styles.successMessage
            }`}
          >
            {message.text}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.button} type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <span className={styles.spinner}></span>
                Creating Account...
              </>
            ) : (
              "Create Partner Account"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
