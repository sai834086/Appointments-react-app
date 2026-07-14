import propertyImg from "../../assets/property-placeholder.png";

/**
 * PropertyPlaceholderIcon
 * Shows the property placeholder image when no real photo is available.
 */
export default function PropertyPlaceholderIcon({ size = "100%", className }) {
  return (
    <img
      src={propertyImg}
      alt="Property placeholder"
      className={className}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}
