import styles from "./PropertyDetails.module.css";
import Button from "../Button";
import { useState } from "react";
import PropertyDetailsForm from "./PropertyDetailsForm";


export default function PropertyDetails({
  allPropertyDetails,
  backClicked,
  passBackPropertyDetails,
}) {
  const [buttonClicked, setButtonClicked] = useState(false);
  const [propertyNameClicked, setPropertyNameClicked] = useState(-1);
  const [passPropertyDetails, setPassPropertyDetails] = useState(
    passBackPropertyDetails
  );
  const [active, setActive] = useState(false);


  const handlePropertyDetails = (propertyDetails) => {
    const propertyExits = passPropertyDetails.some(
      (property) => property.propertyName === propertyDetails.propertyName
    );
    !propertyExits
      ? setPassPropertyDetails((properties) => [...properties, propertyDetails])
      : setPassPropertyDetails((properties) =>
          properties.map((property) =>
            property.propertyName === propertyDetails.propertyName
              ? { ...property, ...propertyDetails }
              : property
          )
        );
    setButtonClicked(false);
    setPropertyNameClicked(-1);
  };
  const handleDeleteProperty = (propertyName) => {
    const confirmed = window.confirm("Click ok to delete...!");
    if (confirmed) {
      setPassPropertyDetails((properties) =>
        properties.filter((property) => property.propertyName !== propertyName)
      );
      propertyName.stopPropagation();
      setButtonClicked(false);
      setPropertyNameClicked(-1);
    } else {
      return;
    }
  };
  const handleBackStep = () => {
    backClicked(true);
  };
  const handlePassAllPropertyDetails = () => {
    allPropertyDetails(passPropertyDetails);
  };

  return (
    <div className={styles.mainContainer}>
      <div>
        <h1>Property Details</h1>
      </div>

      <div className={styles.container}>
        <div className={styles.leftContainer}>
          {passPropertyDetails.length ? (
            passPropertyDetails.map((property, index) => (
              <div
                className={styles.leftPropertyNameButton}
                key={property.propertyName}
              >
                <div
                  className={styles.propertyName}
                  onClick={() => setPropertyNameClicked(index)}
                >
                  <label>{property.propertyName}</label>
                </div>

                <div className={styles.deleteButton}>
                  <Button
                    name={"Remove"}
                    onClick={() => handleDeleteProperty(property.propertyName)}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className={styles.leftListYourProperty}>
              <h2>Property List</h2>
            </div>
          )}
        </div>

        <div className={styles.rightContainer}>
          {buttonClicked || propertyNameClicked >= 0 ? (
            <PropertyDetailsForm
              key={propertyNameClicked}
              propertyDetails={handlePropertyDetails}
              passPropertyDetails={passPropertyDetails[propertyNameClicked]}
            />
          ) : (
            <div className={styles.addPropertyNext}>
              <div className={styles.addProperty}>
                <h1>Add more Properties</h1>
                <Button
                  name={"Add Property"}
                  onClick={() => {
                    setButtonClicked(!buttonClicked);
                    setPropertyNameClicked(-1);
                  }}
                />
              </div>
              <div className={styles.nextButton}>
                <Button name={"Go back"} onClick={() => handleBackStep()} />
                <Button
                  name={"Next step"}
                  onClick={() => handlePassAllPropertyDetails()}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}