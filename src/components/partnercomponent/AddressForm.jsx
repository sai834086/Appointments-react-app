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
    <div className={styles.wrapper}>
      {/* Search-first UX: typing the business address (or using current
          location) auto-fills every field below, so most partners never
          have to type the fields by hand at all. */}
      <div className={styles.searchBlock}>
        <p className={styles.searchHint}>
          Search your business address, or enter it manually below.
        </p>
        <MapWithSearchBarMarker autoFill={autoFill} />
      </div>

      {/* Manually-editable fields, paired two-per-row — the card is wide
          enough now (640px) that pairing no longer clips long values like
          "United Kingdom", and stacking all 7 fields made this step much
          taller than the others. Zip code spans the full row alone. */}
      <div className={styles.fieldsCard}>
      <div className={styles.fieldsGrid}>
        <label className={styles.field}>
          <span>
            Building / Unit No. <span className={styles.required}>*</span>
          </span>
          <input
            name="buildingNo"
            value={form.buildingNo || ""}
            onChange={onChange}
            className={styles.input}
            placeholder="e.g. 221B"
          />
          {errors.buildingNo && (
            <span className={styles.error}>{errors.buildingNo}</span>
          )}
        </label>

        <label className={styles.field}>
          <span>
            Street <span className={styles.required}>*</span>
          </span>
          <input
            name="street"
            value={form.street || ""}
            onChange={onChange}
            className={styles.input}
            placeholder="e.g. Baker Street"
          />
          {errors.street && (
            <span className={styles.error}>{errors.street}</span>
          )}
        </label>

        <label className={styles.field}>
          <span>
            City <span className={styles.required}>*</span>
          </span>
          <input
            name="city"
            value={form.city || ""}
            onChange={onChange}
            className={styles.input}
            placeholder="e.g. London"
          />
          {errors.city && <span className={styles.error}>{errors.city}</span>}
        </label>

        <label className={styles.field}>
          <span>
            District <span className={styles.optional}>(optional)</span>
          </span>
          <input
            name="district"
            value={form.district || ""}
            onChange={onChange}
            className={styles.input}
            placeholder="e.g. Westminster"
          />
          {errors.district && (
            <span className={styles.error}>{errors.district}</span>
          )}
        </label>

        <label className={styles.field}>
          <span>
            State / Province <span className={styles.required}>*</span>
          </span>
          <input
            name="state"
            value={form.state || ""}
            onChange={onChange}
            className={styles.input}
            placeholder="e.g. Greater London"
          />
          {errors.state && (
            <span className={styles.error}>{errors.state}</span>
          )}
        </label>

        <label className={styles.field}>
          <span>
            Country <span className={styles.required}>*</span>
          </span>
          <input
            name="country"
            value={form.country || ""}
            onChange={onChange}
            className={styles.input}
            placeholder="e.g. United Kingdom"
          />
          {errors.country && (
            <span className={styles.error}>{errors.country}</span>
          )}
        </label>

        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span>
            Zip / Postal Code <span className={styles.required}>*</span>
          </span>
          <input
            name="zipCode"
            value={form.zipCode || ""}
            onChange={onChange}
            className={styles.input}
            placeholder="e.g. NW1 6XE"
          />
          {errors.zipCode && (
            <span className={styles.error}>{errors.zipCode}</span>
          )}
        </label>
      </div>
      </div>
    </div>
  );
}
