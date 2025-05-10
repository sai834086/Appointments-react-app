import styles from "./EmployeeDetails.module.css";
import Button from "../Button";
import { useState } from "react";
import EmployeeForm from "./EmployeeForm";


export default function EmployeeDetails({
  passBackPropertyDetails,
  backClicked,
}) {
  const [propertyNameClicked, setPropertyNameClicked] = useState(-1);
  const [buttonClicked, setButtonClicked] = useState(false);

  const handleAllEmployeeDetails = () => {};

  const handleBackStep = () => {
    backClicked(true);
  };

  const handlePropertyClicked = (index) => {
    if (index === propertyNameClicked) {
      setPropertyNameClicked(-1);
    } else {
      setPropertyNameClicked(index);
    }
  };
  return (
    <div>
      <div className={styles.heading}>
        <h1>Employee Details</h1>
      </div>
      <div className={styles.mainContainer}>
        <div className={styles.leftContainer}>
          <h2>Property's</h2>
          <div>
            {passBackPropertyDetails.map((property, index) => (
              <div
                className={
                  propertyNameClicked !== index
                    ? styles.propertyNames
                    : styles.propertyNameClicked
                }
                key={property.propertyName}
                onClick={() => handlePropertyClicked(index)}
              >
                <h3>{property.propertyName}</h3>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.middleContainer}>
          
          <h2>Employees</h2>
        </div>

        <div className={styles.rightContainer}>
          {propertyNameClicked < 0 ? (
            <div className={styles.propertySelectedBefore}>
              <div className={styles.selectPropertyText}>
                <h1>Select Property to add employee</h1>
              </div>
              <div className={styles.nextButton}>
                <Button name={"Go back"} onClick={() => handleBackStep()} />
                <Button
                  name={"Next step"}
                  onClick={() => handleAllEmployeeDetails()}
                />
              </div>
            </div>
          ) : (
            <div>
              {!buttonClicked ? (
                <div className={styles.addEmployee}>
                  <h1>Add Employee</h1>
                  <Button
                    name={"Add Employee"}
                    onClick={() => {
                      setButtonClicked(!buttonClicked);
                    }}
                  />
                  <Button
                    name={"close"}
                    onClick={() => {
                      
                      setPropertyNameClicked(-1);
                    }}
                  />
                </div>
              ) : (
                <EmployeeForm />
              )}
            </div>
          )}
        </div>

        {/** 
        
        */}
      </div>
    </div>
  );
}
