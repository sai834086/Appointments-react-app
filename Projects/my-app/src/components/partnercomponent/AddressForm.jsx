import styles from "./AddressForm.module.css";
import MapWithSearchBarMarker from "./MapWithSearchBarMarker";

export default function AddressForm({ form, onChange, errors }) {
  /** Utility: Extract components */
  const extractAddress = (addressComponents, types) => {
    for (const type of types) {
      const comp = addressComponents.find((c) => c.types.includes(type));
      if (comp) return comp.long_name;
    }
    return "";
  };

  /** Autofill form */
  const autoFill = (components) => {
    onChange({
      target: {
        name: "buildingNo",
        value: extractAddress(components, ["street_number", "premise"]),
      },
    });

    onChange({
      target: {
        name: "street",
        value: extractAddress(components, [
          "route",
          "street_address",
          "sublocality_level_2",
          "sublocality_level_1",
          "neighborhood",
        ]),
      },
    });

    onChange({
      target: {
        name: "city",
        value: extractAddress(components, ["locality"]),
      },
    });

    onChange({
      target: {
        name: "district",
        value: extractAddress(components, ["administrative_area_level_2"]),
      },
    });

    onChange({
      target: {
        name: "state",
        value: extractAddress(components, ["administrative_area_level_1"]),
      },
    });

    onChange({
      target: {
        name: "country",
        value: extractAddress(components, ["country"]),
      },
    });

    onChange({
      target: {
        name: "zipCode",
        value: extractAddress(components, ["postal_code"]),
      },
    });
  };

  return (
    <div className={styles.addressMapContainer}>
      {/* Left-side Form */}
      <div className={styles.addressContainer}>
        <div className={styles.address}>
          <label>Building No.</label>
          <input
            name="buildingNo"
            value={form.buildingNo || ""}
            onChange={onChange}
          />
          {errors.buildingNo && (
            <p className={styles.error}>{errors.buildingNo}</p>
          )}
        </div>

        <div className={styles.address}>
          <label>Street *</label>
          <input name="street" value={form.street || ""} onChange={onChange} />
          {errors.street && <p className={styles.error}>{errors.street}</p>}
        </div>

        <div className={styles.address}>
          <label>City *</label>
          <input name="city" value={form.city || ""} onChange={onChange} />
          {errors.city && <p className={styles.error}>{errors.city}</p>}
        </div>

        <div className={styles.address}>
          <label>District</label>
          <input
            name="district"
            value={form.district || ""}
            onChange={onChange}
          />
        </div>

        <div className={styles.address}>
          <label>State *</label>
          <input name="state" value={form.state || ""} onChange={onChange} />
          {errors.state && <p className={styles.error}>{errors.state}</p>}
        </div>

        <div className={styles.address}>
          <label>Country *</label>
          <input
            name="country"
            value={form.country || ""}
            onChange={onChange}
          />
          {errors.country && <p className={styles.error}>{errors.country}</p>}
        </div>

        <div className={styles.address}>
          <label>Zip Code *</label>
          <input
            name="zipCode"
            value={form.zipCode || ""}
            onChange={onChange}
          />
          {errors.zipCode && <p className={styles.error}>{errors.zipCode}</p>}
        </div>
      </div>
      <div>
        <MapWithSearchBarMarker autoFill={autoFill} />
      </div>
    </div>
  );
}
