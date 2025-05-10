import styles from "./PropertyDetailsForm.module.css";
import Button from "../Button";
import { useState } from "react";
export default function PropertyDetailsForm({
  propertyDetails,
  passPropertyDetails,
}) {
  const [holdPropertyDetails, setHoldPropertyDetails] = useState({
    propertyName: passPropertyDetails?.propertyName ?? "",
    propertyEmail: passPropertyDetails?.propertyEmail ?? "",
    propertyPhoneNumber: passPropertyDetails?.propertyPhoneNumber ?? "",
    propertyPhotoUrl: passPropertyDetails?.propertyPhotoUrl ?? "",
    apartmentNo: passPropertyDetails?.apartmentNo ?? "",
    buildingNo: passPropertyDetails?.buildingNo ?? "",
    floorNo: passPropertyDetails?.floorNo ?? "",
    street: passPropertyDetails?.street ?? "",
    city: passPropertyDetails?.city ?? "",
    state: passPropertyDetails?.state ?? "",
    country: passPropertyDetails?.country ?? "",
    zipCode: passPropertyDetails?.zipCode ?? "",
  });

  const handleAddProperty = (e) => {
    e.preventDefault();
    propertyDetails(holdPropertyDetails);
  };
  return (
    <div className={styles.mainContainer}>
      <form className={styles.form} onSubmit={handleAddProperty}>
        <div className={styles.formContainer}>
          <div className={styles.eachField}>
            <label htmlFor="propertyName">Property Name*</label>
            <input
              type="text"
              id="propertyName"
              name="propertyName"
              value={holdPropertyDetails.propertyName}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  propertyName: e.target.value,
                }))
              }
              required
            />
          </div>
          <div className={styles.eachField}>
            <label htmlFor="propertyEmail">Email*</label>
            <input
              type="email"
              id="propertyEmail"
              name="propertyEmail"
              value={holdPropertyDetails.propertyEmail}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  propertyEmail: e.target.value,
                }))
              }
              required
            />
          </div>
          <div className={styles.eachField}>
            <label htmlFor="propertyPhoneNumber">Phone Number*</label>
            <input
              type="text"
              id="propertyPhoneNumber"
              name="propertyPhoneNumber"
              value={holdPropertyDetails.propertyPhoneNumber}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  propertyPhoneNumber: e.target.value,
                }))
              }
              required
            />
          </div>
          <div className={styles.eachField}>
            <label htmlFor="propertyphoto">Property Photo</label>
            <input
              type="file"
              id="propertyphoto"
              name="propertyphoto"
              value={holdPropertyDetails.propertyPhotoUrl}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  propertyphotoUrl: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <h3 className={styles.addressStart}>Address:</h3>
        <div className={styles.formContainer}>
          <div className={styles.eachField}>
            <label htmlFor="aptNo">Appartment No</label>
            <input
              type="text"
              id="aptNo"
              value={holdPropertyDetails.apartmentNo}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  apartmentNo: e.target.value,
                }))
              }
            />
          </div>
          <div className={styles.eachField}>
            <label htmlFor="floorNo">Floor No</label>
            <input
              type="text"
              id="floorNo"
              value={holdPropertyDetails.buildingNo}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  floorNo: e.target.value,
                }))
              }
            />
          </div>
          <div className={styles.eachField}>
            <label htmlFor="bNo">Building No*</label>
            <input
              type="text"
              id="bNo"
              value={holdPropertyDetails.buildingNo}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  buildingNo: e.target.value,
                }))
              }
              required
            />
          </div>
          <div className={styles.eachField}>
            <label htmlFor="street">Street*</label>
            <input
              type="text"
              id="street"
              value={holdPropertyDetails.street}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  street: e.target.value,
                }))
              }
            />
          </div>
          <div className={styles.eachField}>
            <label htmlFor="city">City*</label>
            <input
              type="city"
              id="city"
              value={holdPropertyDetails.city}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  city: e.target.value,
                }))
              }
            />
          </div>
          <div className={styles.eachField}>
            <label htmlFor="state">State*</label>
            <input
              type="state"
              id="state"
              value={holdPropertyDetails.state}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  state: e.target.value,
                }))
              }
            />
          </div>
          <div className={styles.eachField}>
            <label htmlFor="country">Country*</label>
            <input
              type="country"
              id="country"
              value={holdPropertyDetails.country}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  country: e.target.value,
                }))
              }
            />
          </div>

          <div className={styles.eachField}>
            <label htmlFor="zipCode">ZipCode*</label>
            <input
              type="zipcode"
              id="zipcode"
              value={holdPropertyDetails.zipCode}
              onChange={(e) =>
                setHoldPropertyDetails((prev) => ({
                  ...prev,
                  zipCode: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className={styles.button}>
          <Button name={"Confirm & Close"} />
        </div>
      </form>
    </div>
  );
}
