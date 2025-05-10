import styles from "./BasicUserDetails.module.css";
import Button from "../Button";
import React, { useState } from "react";



export default function BasicUserDetails({ userDetails, passUserDetails }) {
  const [error, setError] = useState("");
  const [passwordActive, setPasswordActive] = useState(false);
  const [isConfirmPasswordMatch, setIsConfirmPasswordMatch] = useState(false);
  const [holdBasicUserDetails, setHoldBasicUserDetails] = useState({
    firstName: passUserDetails.firstName,
    lastName: passUserDetails.lastName,
    email: passUserDetails.email,
    phoneNumber: passUserDetails.phoneNumber,
    organizationName: passUserDetails.organizationName,
    organizationType: passUserDetails.organizationType,
    password: passUserDetails.password,
    confirmPassword: passUserDetails.confirmPassword,
  });

  const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  const handlePasswordStructure = (e) => {
    if (holdBasicUserDetails.password.match(regex)) {
      setPasswordActive(false);
    }
  };

  const handleUserDetails = (e) => {
    e.preventDefault();
    setError("");
    if (holdBasicUserDetails.password !== holdBasicUserDetails.confirmPassword) {
      setError("Both passwords must match");
      return;
    }
    userDetails({
        firstName : holdBasicUserDetails.firstName,
        lastName : holdBasicUserDetails.lastName,   
        email : holdBasicUserDetails.email,
        phoneNumber : holdBasicUserDetails.phoneNumber,
        organizationName : holdBasicUserDetails.organizationName,
        organizationType : holdBasicUserDetails.organizationType,
        password : holdBasicUserDetails.password,
        confirmPassword : holdBasicUserDetails.confirmPassword,
    });
  };

  return (
    <div>
      <div className={styles.signUpHead}>Basic User Details</div>
      <form
        className={styles.signUpDetails}
      >
        <div className={styles.eachField}>
          <label htmlFor="fn">First Name</label>
          <input
            type="text"
            id="fn"
            placeholder="First Name"
            required
            value={holdBasicUserDetails.firstName}
            onChange={(e) =>
              setHoldBasicUserDetails((prev) => ({
                ...prev,
                firstName: e.target.value,
              }))
            }
          />
        </div>
        <div className={styles.eachField}>
          <label htmlFor="ln">Last Name</label>
          <input
            type="text"
            id="ln"
            placeholder="Last Name"
            required
            value={holdBasicUserDetails.lastName}
            onChange={(e) =>
              setHoldBasicUserDetails((prev) => ({
                ...prev,
                lastName: e.target.value,
              }))
            }
          />
        </div>
        <div className={styles.eachField}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Email"
            required
            value={holdBasicUserDetails.email}
            onChange={(e) =>
              setHoldBasicUserDetails((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
          />
        </div>
        <div className={styles.eachField}>
          <label htmlFor="pn">Phone Number</label>
          <input
            type="text"
            id="pn"
            placeholder="Phone Number"
            required
            value={holdBasicUserDetails.phoneNumber}
            onChange={(e) =>
              setHoldBasicUserDetails((prev) => ({
                ...prev,
                phoneNumber: e.target.value,
              }))
            }
          />
        </div>
        <div className={styles.eachField}>
          <label htmlFor="on">Organization Name</label>
          <input
            type="text"
            id="on"
            placeholder="Organization Name"
            required
            value={holdBasicUserDetails.organizationName}
            onChange={(e) =>
              setHoldBasicUserDetails((prev) => ({
                ...prev,
                organizationName: e.target.value,
              }))
            }
          />
        </div>
        <div className={styles.eachField}>
          <label htmlFor="ot">Organization Type</label>
          <input
            type="text"
            id="ot"
            placeholder="Organization Type"
            required
            value={holdBasicUserDetails.organizationType}
            onChange={(e) =>
              setHoldBasicUserDetails((prev) => ({
                ...prev,
                organizationType: e.target.value,
              }))
            }
          />
        </div>
        <div className={styles.eachField}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Password"
            required
            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            value={holdBasicUserDetails.password}
            onChange={(e) =>
              setHoldBasicUserDetails((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
            onFocus={(e) => setPasswordActive(true)}
            onClick={(e) => handlePasswordStructure(e)}
            onBlur={(e) => handlePasswordStructure(e)}
          />
        </div>
        {passwordActive && (
          <div className={styles.passwordHint}>
            <p>Password must contain:</p>
            <ul>
              <li>At least one number</li>
              <li>At least one uppercase and one lowercase letter</li>
              <li>Minimum 8 characters</li>
              <li>This special characters are allowed(@#$%^&+=!)</li>
              <li>Must not contain spaces</li>
            </ul>
          </div>
        )}
        <div>
          <label className={styles.eachField}>
            <label htmlFor="cpassword">Confirm Password</label>
            <input
              type="password"
              id="cpassword"
              placeholder="Confirm Password"
              required
              value={holdBasicUserDetails.confirmPassword}
              onChange={(e) => {
                setHoldBasicUserDetails((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }));

                if (e.target.value !== holdBasicUserDetails.password) {
                  setIsConfirmPasswordMatch(true);
                  setError("Both passwords must match");
                } else {
                  setIsConfirmPasswordMatch(false);
                  setError("");
                }
              }}
            />
          </label>
        </div>
        {isConfirmPasswordMatch && <div className={styles.error}>{error}</div>}
        <div className={styles.nextButton}>
          <Button name={"Next step"} onClick={handleUserDetails}/>
        </div>
      </form>
    </div>
  );
}
