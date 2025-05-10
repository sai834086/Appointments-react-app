import { useState } from "react";
import Button from "../Button";
import styles from "./EmployeeForm.module.css";

export default function EmployeeForm({ passEmployeeDetails }) {
  const [employeeDetails, setEmployeeDetails] = useState({
    employeeFullName: "",
    specialization: "",
    position: "",
    employeeRoomNo: "",
    employeePhoto: "",
    employeeWorkingStatus: "ACTIVE",
    allowBookingTill: 2,
    eachAppointmentTime: 30,
    employeeAvailability: [
      {
        day: "Monday",
        availableStatus: "",
        startTime: "",
        endTime: "",
        breakTime: [{ startTime: "", endTime: "" }],
      },
      {
        day: "Tuesday",
        availableStatus: "",
        startTime: "",
        endTime: "",
        breakTime: [{ startTime: "", endTime: "" }],
      },
      // Add more days...
    ],
  });

  const handleAddBreak = (dayIndex) => {
    const updatedAvailability = [...employeeDetails.employeeAvailability];
    updatedAvailability[dayIndex].breakTime.push({ startTime: "", endTime: "" });
    setEmployeeDetails({ ...employeeDetails, employeeAvailability: updatedAvailability });
  };

  const handleRemoveBreak = (dayIndex, breakIndex) => {
    const updatedAvailability = [...employeeDetails.employeeAvailability];
    updatedAvailability[dayIndex].breakTime.splice(breakIndex, 1);
    setEmployeeDetails({ ...employeeDetails, employeeAvailability: updatedAvailability });
  };

  const handleChange = (e, dayIndex, field, breakIndex = null) => {
    const { name, value } = e.target;
    const updatedAvailability = [...employeeDetails.employeeAvailability];
    if (breakIndex !== null) {
      updatedAvailability[dayIndex].breakTime[breakIndex][name] = value;
    } else {
      updatedAvailability[dayIndex][name] = value;
    }
    setEmployeeDetails({ ...employeeDetails, employeeAvailability: updatedAvailability });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    passEmployeeDetails(employeeDetails);
  };

  return (
    <div className={styles.mainContainer}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formContainer}>
          {/* Employee Details Fields */}
          <div className={styles.eachField}>
            <label htmlFor="employeeFullName">Full Name*</label>
            <input
              type="text"
              id="employeeFullName"
              value={employeeDetails.employeeFullName}
              onChange={(e) =>
                setEmployeeDetails((prev) => ({
                  ...prev,
                  employeeFullName: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className={styles.eachField}>
            <label htmlFor="specialization">Specialization*</label>
            <input
              type="text"
              id="specialization"
              value={employeeDetails.specialization}
              onChange={(e) =>
                setEmployeeDetails((prev) => ({
                  ...prev,
                  specialization: e.target.value,
                }))
              }
              required
            />
          </div>

          {/* Availability Section */}
          <div className={styles.availabilityContainer}>
            {employeeDetails.employeeAvailability.map((availability, dayIndex) => (
              <div key={dayIndex} className={styles.availabilityField}>
                <h4>{availability.day}</h4>
                <div className={styles.availabilityInputs}>
                  <label>Available Status</label>
                  <input
                    type="text"
                    name="availableStatus"
                    value={availability.availableStatus}
                    onChange={(e) => handleChange(e, dayIndex, "availableStatus")}
                  />

                  <label>Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={availability.startTime}
                    onChange={(e) => handleChange(e, dayIndex, "startTime")}
                  />

                  <label>End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={availability.endTime}
                    onChange={(e) => handleChange(e, dayIndex, "endTime")}
                  />
                </div>

                {/* Break Times */}
                {availability.breakTime.map((breakItem, breakIndex) => (
                  <div key={breakIndex} className={styles.breakTimeContainer}>
                    <input
                      type="time"
                      name="startTime"
                      value={breakItem.startTime}
                      onChange={(e) => handleChange(e, dayIndex, "startTime", breakIndex)}
                    />
                    <input
                      type="time"
                      name="endTime"
                      value={breakItem.endTime}
                      onChange={(e) => handleChange(e, dayIndex, "endTime", breakIndex)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBreak(dayIndex, breakIndex)}
                    >
                      Remove Break
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.addBreakBtn}
                  onClick={() => handleAddBreak(dayIndex)}
                >
                  Add Break
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.button}>
          <Button name="Save & Close" />
        </div>
      </form>
    </div>
  );
}
