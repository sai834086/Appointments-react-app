import { useState, useEffect, useMemo } from "react";
import {
  updateAvailabilityAndRefreshEmployee,
  addOffTimeRequest,
} from "../../api/authService";
import StyleSheet from "./WeeklyAvailabilitySchedule.module.css";

export default function WeeklyAvailabilitySchedule({
  availabilityData,
  propertyId,
  employeeId,
  allOffTimes = {},
  onAvailabilityUpdated,
  onEmployeeUpdated,
}) {
  const [editingDay, setEditingDay] = useState(null);
  const [dayForm, setDayForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Off time related state - initialize with passed allOffTimes data
  const [offTimes, setOffTimes] = useState(allOffTimes);
  const [addingOffTime, setAddingOffTime] = useState(null);
  const [offTimeForm, setOffTimeForm] = useState({
    offTimeFrom: "",
    offTimeTo: "",
  });

  // Day configuration with emojis
  const dayConfig = {
    MONDAY: { name: "Monday", emoji: "💼", color: "#3b82f6" },
    TUESDAY: { name: "Tuesday", emoji: "💻", color: "#8b5cf6" },
    WEDNESDAY: { name: "Wednesday", emoji: "📊", color: "#10b981" },
    THURSDAY: { name: "Thursday", emoji: "📈", color: "#f59e0b" },
    FRIDAY: { name: "Friday", emoji: "🎯", color: "#ef4444" },
    SATURDAY: { name: "Saturday", emoji: "🌟", color: "#06b6d4" },
    SUNDAY: { name: "Sunday", emoji: "🌅", color: "#84cc16" },
  };

  const allDays = Object.keys(dayConfig);

  // Create a map of existing availability data by day
  const availabilityMap = useMemo(() => {
    const map = {};

    if (availabilityData && Array.isArray(availabilityData)) {
      availabilityData.forEach((item) => {
        map[item.day] = item;
      });
    }

    return map;
  }, [availabilityData]);

  // Convert hours and minutes to total minutes
  const convertToMinutes = (hours, minutes) => {
    return parseInt(hours) * 60 + parseInt(minutes);
  };

  // Format 24-hour time to 12-hour format with AM/PM
  const formatTimeToAMPM = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
  };

  // Format duration from minutes to "Xhr:Ymin" format
  const formatDuration = (totalMinutes) => {
    if (!totalMinutes) return "0hr:0min";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}hr:${minutes.toString().padStart(2, "0")}min`;
  };

  // Update off times when allOffTimes prop changes
  useEffect(() => {
    setOffTimes(allOffTimes);
  }, [allOffTimes]);

  // Handle adding off time
  const handleAddOffTime = (day) => {
    const existingData = availabilityMap[day];
    const availabilityId = existingData?.availabilityId || existingData?.id;

    if (!availabilityId) {
      setErrors({
        general: "Please save availability first before adding off time",
      });
      return;
    }

    setAddingOffTime(day);
    setOffTimeForm({
      availabilityId: availabilityId,
      offTimeFrom: "",
      offTimeTo: "",
    });
  };

  // Handle off time form changes
  const handleOffTimeFormChange = (field, value) => {
    setOffTimeForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save off time
  const handleSaveOffTime = async () => {
    if (!offTimeForm.offTimeFrom || !offTimeForm.offTimeTo) {
      setErrors({ offTime: "Both from and to times are required" });
      return;
    }

    if (offTimeForm.offTimeFrom >= offTimeForm.offTimeTo) {
      setErrors({ offTime: "From time must be before to time" });
      return;
    }

    try {
      setLoading(true);
      const offTimeData = {
        offTimeFrom: offTimeForm.offTimeFrom,
        offTimeTo: offTimeForm.offTimeTo,
      };

      await addOffTimeRequest(offTimeForm.availabilityId, offTimeData);

      // After successful off time addition, refresh all data from parent
      if (onAvailabilityUpdated) {
        await onAvailabilityUpdated();
      }

      // Reset form
      setAddingOffTime(null);
      setOffTimeForm({ offTimeFrom: "", offTimeTo: "" });
      setErrors({});
    } catch (error) {
      // Extract detailed error message from server response
      let errorMessage = "Failed to save off time. Please try again.";

      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({ offTime: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Cancel off time form
  const handleCancelOffTime = () => {
    setAddingOffTime(null);
    setOffTimeForm({ offTimeFrom: "", offTimeTo: "" });
    setErrors({});
  };

  const handleEditDay = (day) => {
    const existingData = availabilityMap[day];

    if (existingData) {
      const availabilityId = existingData.availabilityId || existingData.id;

      setDayForm({
        availabilityId: availabilityId, // Store the availability ID
        isAvailable: existingData.isAvailable,
        openTime: existingData.openTime || "09:00",
        closeTime: existingData.closeTime || "17:00",
        hours: 1,
        minutes: 0,
      });
    } else {
      setDayForm({
        availabilityId: null, // No ID for new records
        isAvailable: "UNAVAILABILE",
        openTime: "09:00",
        closeTime: "17:00",
        hours: 1,
        minutes: 0,
      });
    }
    setEditingDay(day);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditingDay(null);
    setDayForm({});
    setErrors({});
  };

  const handleFormChange = (field, value) => {
    setDayForm((prev) => {
      const newForm = { ...prev, [field]: value };

      // When switching to AVAILABILE, ensure we have default times if they're missing
      if (field === "isAvailable" && value === "AVAILABILE") {
        if (!newForm.openTime) newForm.openTime = "09:00";
        if (!newForm.closeTime) newForm.closeTime = "17:00";
        if (!newForm.hours) newForm.hours = 1;
        if (!newForm.minutes) newForm.minutes = 0;
      }

      return newForm;
    });

    // Clear errors when user makes changes
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const formErrors = {};

    if (dayForm.isAvailable === "AVAILABILE") {
      if (!dayForm.openTime) {
        formErrors.openTime = "Opening time is required";
      }
      if (!dayForm.closeTime) {
        formErrors.closeTime = "Closing time is required";
      }
      if (
        dayForm.openTime &&
        dayForm.closeTime &&
        dayForm.openTime >= dayForm.closeTime
      ) {
        formErrors.closeTime = "Closing time must be after opening time";
      }
      if (dayForm.hours < 0 || dayForm.hours > 23) {
        formErrors.hours = "Hours must be between 0 and 23";
      }
      if (dayForm.minutes < 0 || dayForm.minutes > 59) {
        formErrors.minutes = "Minutes must be between 0 and 59";
      }
    }

    return formErrors;
  };

  const handleSaveDay = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    if (!propertyId || !employeeId || !editingDay) return;

    setLoading(true);
    setErrors({});

    try {
      // Always send data for both available and unavailable days
      let availabilityData;

      if (dayForm.isAvailable === "AVAILABILE") {
        availabilityData = {
          day: editingDay,
          isAvailable: dayForm.isAvailable,
          openTime: dayForm.openTime || "09:00",
          closeTime: dayForm.closeTime || "17:00",
        };
      } else {
        // Default values for unavailable days
        availabilityData = {
          day: editingDay,
          isAvailable: "UNAVAILABILE",
          openTime: "00:00",
          closeTime: "00:00",
          eachAppointmentTimeInMinus: 60, // 1 hour default
        };
      }

      // Get availability ID from dayForm or fallback to current availabilityMap
      let availabilityId = dayForm.availabilityId;

      // If no ID in form, try to get it from current availabilityMap
      if (!availabilityId) {
        const currentDayData = availabilityMap[editingDay];
        if (currentDayData) {
          availabilityId = currentDayData.availabilityId || currentDayData.id;
        }
      }

      if (
        availabilityId &&
        availabilityId !== null &&
        availabilityId !== "null" &&
        availabilityId !== undefined
      ) {
        // Update availability and fetch fresh employee data
        const refreshData = await updateAvailabilityAndRefreshEmployee(
          availabilityId,
          availabilityData,
          propertyId,
          employeeId
        );

        // Call the employee update callback with fresh data
        if (onEmployeeUpdated && refreshData.employees) {
          onEmployeeUpdated(refreshData.employees);
        }
      } else {
        setErrors({
          general: `Cannot update availability for ${editingDay}: Invalid availability ID (${availabilityId}). Please refresh the page and try again.`,
        });
        return;
      }

      setEditingDay(null);
      setDayForm({});

      if (onAvailabilityUpdated) {
        onAvailabilityUpdated();
      }
    } catch (error) {
      // Extract detailed error message from server response
      let errorMessage = "Failed to save availability. Please try again.";

      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({
        general: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={StyleSheet.WeeklyScheduleContainer}>
      <div className={StyleSheet.ScheduleHeader}>
        <h2 className={StyleSheet.ScheduleTitle}>
          📅 Weekly Availability Schedule
        </h2>
        <p className={StyleSheet.ScheduleSubtitle}>
          Manage availability for each day of the week
        </p>
      </div>

      {errors.general && (
        <div className={StyleSheet.ErrorMessage}>{errors.general}</div>
      )}

      <div className={StyleSheet.WeeklyGrid}>
        {allDays.map((day) => {
          const dayData = availabilityMap[day];
          const isEditing = editingDay === day;
          const config = dayConfig[day];

          return (
            <div
              key={day}
              className={`${StyleSheet.DayCard} ${
                isEditing ? StyleSheet.EditingCard : ""
              }`}
              style={{ "--day-color": config.color }}
            >
              <div className={StyleSheet.DayCardHeader}>
                <div className={StyleSheet.DayInfo}>
                  <span className={StyleSheet.DayEmoji}>{config.emoji}</span>
                  <div>
                    <h3 className={StyleSheet.DayName}>{config.name}</h3>
                    <span className={StyleSheet.DayLabel}>Availability</span>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    className={StyleSheet.EditButton}
                    onClick={() => handleEditDay(day)}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                // Edit Mode
                <div className={StyleSheet.EditForm}>
                  <div className={StyleSheet.FormRow}>
                    <div className={StyleSheet.FormField}>
                      <label className={StyleSheet.FieldLabel}>Status</label>
                      <select
                        value={dayForm.isAvailable}
                        onChange={(e) =>
                          handleFormChange("isAvailable", e.target.value)
                        }
                        className={StyleSheet.StatusSelect}
                      >
                        <option value="AVAILABILE">Available</option>
                        <option value="UNAVAILABILE">Unavailable</option>
                      </select>
                    </div>
                  </div>

                  {dayForm.isAvailable === "AVAILABILE" && (
                    <>
                      <div className={StyleSheet.FormRow}>
                        <div className={StyleSheet.FormField}>
                          <label className={StyleSheet.FieldLabel}>
                            🕐 Open Time
                          </label>
                          <input
                            type="time"
                            value={dayForm.openTime}
                            onChange={(e) =>
                              handleFormChange("openTime", e.target.value)
                            }
                            className={`${StyleSheet.TimeInput} ${
                              errors.openTime ? StyleSheet.InputError : ""
                            }`}
                          />
                          {errors.openTime && (
                            <span className={StyleSheet.FieldError}>
                              {errors.openTime}
                            </span>
                          )}
                        </div>

                        <div className={StyleSheet.FormField}>
                          <label className={StyleSheet.FieldLabel}>
                            🕔 Close Time
                          </label>
                          <input
                            type="time"
                            value={dayForm.closeTime}
                            onChange={(e) =>
                              handleFormChange("closeTime", e.target.value)
                            }
                            className={`${StyleSheet.TimeInput} ${
                              errors.closeTime ? StyleSheet.InputError : ""
                            }`}
                          />
                          {errors.closeTime && (
                            <span className={StyleSheet.FieldError}>
                              {errors.closeTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={StyleSheet.FormRow}>
                        <div className={StyleSheet.FormField}>
                          <label className={StyleSheet.FieldLabel}>
                            ⏱️ Appointment Duration
                          </label>
                          <div className={StyleSheet.DurationInputs}>
                            <div className={StyleSheet.DurationField}>
                              <input
                                type="number"
                                min="0"
                                max="23"
                                value={dayForm.hours}
                                onChange={(e) =>
                                  handleFormChange(
                                    "hours",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className={`${StyleSheet.DurationInput} ${
                                  errors.hours ? StyleSheet.InputError : ""
                                }`}
                              />
                              <span className={StyleSheet.DurationUnit}>
                                Hours
                              </span>
                            </div>
                            <div className={StyleSheet.DurationField}>
                              <input
                                type="number"
                                min="0"
                                max="59"
                                value={dayForm.minutes}
                                onChange={(e) =>
                                  handleFormChange(
                                    "minutes",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className={`${StyleSheet.DurationInput} ${
                                  errors.minutes ? StyleSheet.InputError : ""
                                }`}
                              />
                              <span className={StyleSheet.DurationUnit}>
                                Minutes
                              </span>
                            </div>
                          </div>
                          {(errors.hours || errors.minutes) && (
                            <span className={StyleSheet.FieldError}>
                              {errors.hours || errors.minutes}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className={StyleSheet.FormActions}>
                    <button
                      type="button"
                      className={StyleSheet.CancelButton}
                      onClick={handleCancelEdit}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={StyleSheet.SaveButton}
                      onClick={handleSaveDay}
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className={StyleSheet.DayContent}>
                  {dayData ? (
                    <>
                      <div className={StyleSheet.StatusBadge}>
                        <span
                          className={`${StyleSheet.StatusIndicator} ${
                            dayData.isAvailable === "AVAILABILE"
                              ? StyleSheet.StatusAvailable
                              : StyleSheet.StatusUnavailable
                          }`}
                        >
                          {dayData.isAvailable === "AVAILABILE"
                            ? "✅ Available"
                            : "❌ Unavailable"}
                        </span>
                      </div>

                      {dayData.isAvailable === "AVAILABILE" && (
                        <div className={StyleSheet.ScheduleDetails}>
                          <div className={StyleSheet.TimeInfo}>
                            <span className={StyleSheet.TimeLabel}>
                              ⏰ Working Hours:
                            </span>
                            <span className={StyleSheet.TimeValue}>
                              {formatTimeToAMPM(dayData.openTime)} -{" "}
                              {formatTimeToAMPM(dayData.closeTime)}
                            </span>
                          </div>
                          {/* Removed Each Appointment Duration display */}

                          {/* Off Times Section */}
                          <div className={StyleSheet.OffTimesSection}>
                            <div className={StyleSheet.OffTimesHeader}>
                              <span className={StyleSheet.TimeLabel}>
                                🚫 Off Times:
                              </span>
                              <button
                                className={StyleSheet.AddOffTimeButton}
                                onClick={() => handleAddOffTime(day)}
                                disabled={loading}
                              >
                                + Add Off Time
                              </button>
                            </div>

                            {/* Display existing off times */}
                            <div className={StyleSheet.OffTimesList}>
                              {(() => {
                                const availabilityId =
                                  dayData.availabilityId || dayData.id;
                                const dayOffTimes = offTimes[availabilityId];

                                if (
                                  dayOffTimes &&
                                  Array.isArray(dayOffTimes) &&
                                  dayOffTimes.length > 0
                                ) {
                                  return dayOffTimes.map((offTime, index) => (
                                    <div
                                      key={index}
                                      className={StyleSheet.OffTimeItem}
                                    >
                                      <span className={StyleSheet.OffTimeRange}>
                                        {formatTimeToAMPM(offTime.offTimeFrom)}{" "}
                                        - {formatTimeToAMPM(offTime.offTimeTo)}
                                      </span>
                                    </div>
                                  ));
                                } else {
                                  return (
                                    <span className={StyleSheet.NoOffTimes}>
                                      No off times set
                                    </span>
                                  );
                                }
                              })()}
                            </div>

                            {/* Add Off Time Form */}
                            {addingOffTime === day && (
                              <div className={StyleSheet.OffTimeForm}>
                                <div className={StyleSheet.OffTimeFields}>
                                  <div className={StyleSheet.OffTimeField}>
                                    <label className={StyleSheet.FieldLabel}>
                                      From:
                                    </label>
                                    <input
                                      type="time"
                                      value={offTimeForm.offTimeFrom}
                                      onChange={(e) =>
                                        handleOffTimeFormChange(
                                          "offTimeFrom",
                                          e.target.value
                                        )
                                      }
                                      className={StyleSheet.TimeInput}
                                    />
                                  </div>
                                  <div className={StyleSheet.OffTimeField}>
                                    <label className={StyleSheet.FieldLabel}>
                                      To:
                                    </label>
                                    <input
                                      type="time"
                                      value={offTimeForm.offTimeTo}
                                      onChange={(e) =>
                                        handleOffTimeFormChange(
                                          "offTimeTo",
                                          e.target.value
                                        )
                                      }
                                      className={StyleSheet.TimeInput}
                                    />
                                  </div>
                                </div>

                                {errors.offTime && (
                                  <span className={StyleSheet.FieldError}>
                                    {errors.offTime}
                                  </span>
                                )}

                                <div className={StyleSheet.OffTimeActions}>
                                  <button
                                    type="button"
                                    className={StyleSheet.SaveOffTimeButton}
                                    onClick={handleSaveOffTime}
                                    disabled={loading}
                                  >
                                    {loading ? "Saving..." : "Save Off Time"}
                                  </button>
                                  <button
                                    type="button"
                                    className={StyleSheet.CancelOffTimeButton}
                                    onClick={handleCancelOffTime}
                                    disabled={loading}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={StyleSheet.NoSchedule}>
                      <span className={StyleSheet.NoScheduleIcon}>📭</span>
                      <p className={StyleSheet.NoScheduleText}>
                        No schedule set
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
