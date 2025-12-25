import { useEffect, useRef, useCallback } from "react";
import { initializePlacesAutocompleteReact } from "../../api/authService";
import styles from "./PartnerSignUpAddressForm.module.css";
export default function PartnerSignUpAddressForm({ form, onChange, errors }) {
  const cityRef = useRef(null);
  const autocompleteRef = useRef(null);

  const initializeAutocomplete = useCallback(() => {
    if (!cityRef.current) return;

    initializePlacesAutocompleteReact(cityRef.current)
      .then((autocomplete) => {
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          console.log("Selected place:", place);

          if (place && place.address_components) {
            const addressComponents = place.address_components;

            const getComponent = (type) =>
              addressComponents.find((c) => c.types.includes(type))
                ?.long_name || "";

            // Extract city with multiple fallbacks
            const city =
              getComponent("locality") ||
              getComponent("administrative_area_level_2") ||
              getComponent("sublocality") ||
              getComponent("administrative_area_level_3") ||
              getComponent("administrative_area_level_1") ||
              "";

            // Extract state
            const state =
              getComponent("administrative_area_level_1") ||
              getComponent("administrative_area_level_2") ||
              "";

            // Extract country
            const country = getComponent("country");

            // Extract zip code
            const zipCode =
              getComponent("postal_code") ||
              getComponent("postal_code_prefix") ||
              "";

            console.log("Extracted address components:", {
              city,
              state,
              country,
              zipCode,
            });

            // Update form values using onChange prop
            onChange({ target: { name: "city", value: city } });
            onChange({ target: { name: "state", value: state } });
            onChange({ target: { name: "country", value: country } });
            onChange({ target: { name: "zipCode", value: zipCode } });
          } else {
            console.warn("No address components found in selected place");
          }
        });

        autocompleteRef.current = autocomplete;
      })
      .catch((error) => {
        console.error(
          "Failed to initialize Google Places Autocomplete:",
          error
        );
      });
  }, [onChange]);

  useEffect(() => {
    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current && window.google && window.google.maps) {
        try {
          window.google.maps.event.clearInstanceListeners(
            autocompleteRef.current
          );
        } catch (error) {
          console.warn("Error cleaning up autocomplete listeners:", error);
        }
      }
    };
  }, [initializeAutocomplete]);

  return (
    <div>
      <div className={styles.fieldset}>
        <legend>Address</legend>

        <div>
          <label>Building No</label>
          <input
            name="buildingNo"
            value={form.buildingNo}
            onChange={onChange}
            className={styles.input}
          />
          {errors.buildingNo && (
            <div className={styles.error}>{errors.buildingNo}</div>
          )}
        </div>

        <div>
          <label>Street</label>
          <input
            name="street"
            value={form.street}
            onChange={onChange}
            className={styles.input}
          />
          {errors.street && <div className={styles.error}>{errors.street}</div>}
        </div>

        <div>
          <label>City</label>
          <input
            ref={cityRef}
            name="city"
            value={form.city}
            onChange={onChange}
            className={styles.input}
          />
          {errors.city && <div className={styles.error}>{errors.city}</div>}
        </div>

        <div>
          <label>State</label>
          <input
            name="state"
            value={form.state}
            onChange={onChange}
            className={styles.input}
          />
          {errors.state && <div className={styles.error}>{errors.state}</div>}
        </div>

        <div>
          <label>Country</label>
          <input
            name="country"
            value={form.country}
            onChange={onChange}
            className={styles.input}
            placeholder="Enter country"
          />
          {errors.country && (
            <div className={styles.error}>{errors.country}</div>
          )}
        </div>

        <div>
          <label>Zip code</label>
          <input
            name="zipCode"
            value={form.zipCode}
            onChange={onChange}
            className={styles.input}
          />
          {errors.zipCode && (
            <div className={styles.error}>{errors.zipCode}</div>
          )}
        </div>
      </div>
    </div>
  );
}
