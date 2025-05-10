import styles from "./PartnerSignUp.module.css";
import React, { useState, useEffect } from "react";
import Logo from "../components/Logo";
import { NavLink } from "react-router-dom";
import Button from "../components/Button";
import BasicUserDetails from "../components/partnersignupcomponents/basicuserdetails";
import PropertyDetails from "../components/partnersignupcomponents/PropertyDetails";
import EmployeeDetails from "../components/partnersignupcomponents/EmployeeDetails";

export default function PartnerSignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [partnerUserDetails, setPartnerUserDetails] = useState({
    basicUserDetails: {},
    propertyDetails: [
      {
        Employee: [
          {
            EmployeeAvailability: [
              {
                breakTime: [{}],
              },
            ],
            EmployeeSpecificDateAvailability: [{}],
          },
        ],
      },
    ],
  });

  const handleUserDetails = (userDetails) => {
    setPartnerUserDetails((prev) => ({
      ...prev,
      basicUserDetails: userDetails,
    }));
    setCurrentStep(2);
  };

  const handleBackClicked = (backClicked) => {
    if (backClicked === true) {
      setCurrentStep(1);
    }
  };
  const handleAllPropertyDetails = (AllPropertyDetails) => {
    setPartnerUserDetails((prev) => ({
      ...prev,
      propertyDetails: AllPropertyDetails,
    }));
    setCurrentStep(3);
  };
  useEffect(() => {}, [partnerUserDetails]);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Logo />
          <p>JUST 4 SIMPLE STEPS TO JOIN US..!</p>
        </div>

        <nav className={styles.navbar}>
          <ul>
            <li>
              <NavLink to="/">Home</NavLink>
            </li>
            <li>
              <NavLink to="/login">
                <Button name={"Login"} />
              </NavLink>
            </li>
          </ul>
        </nav>
      </header>
      <div className={styles.pageContainer2}>
        <div className={styles.stepsDisplay}>
          {[1, 2, 3, 4].map((step) => (
            <button
              key={step}
              className={
                step <= currentStep ? `${styles.activeStep}` : styles.eachStep
              }
              onClick={() => setCurrentStep(step)}
            >
              {step}
            </button>
          ))}
        </div>
        <div>
          <div>
            {currentStep === 1 && (
              <BasicUserDetails
                userDetails={handleUserDetails}
                passUserDetails={partnerUserDetails.basicUserDetails}
              />
            )}
          </div>
          <div>
            {currentStep === 2 && (
              <PropertyDetails
                nextClicked={false}
                allPropertyDetails={handleAllPropertyDetails}
                backClicked={handleBackClicked}
                passBackPropertyDetails={partnerUserDetails.propertyDetails
                  .filter(
                    (prop) =>
                      Object.keys(prop).length > 1 ||
                      (Object.keys(prop).length === 1 && !prop.Employee)
                  )
                  .map(({ Employee, ...rest }) => rest)}
              />
            )}
          </div>
          <div>
            {currentStep === 3 && (
              <EmployeeDetails
                passBackPropertyDetails={partnerUserDetails.propertyDetails
                  .filter(
                    (prop) =>
                      Object.keys(prop).length > 1 ||
                      (Object.keys(prop).length === 1 && !prop.Employee)
                  )
                  .map(({ Employee, ...rest }) => rest)}
              />
            )}
          </div>
          {currentStep === 4 && <div>Step 4</div>}
        </div>
      </div>
    </div>
  );
}
