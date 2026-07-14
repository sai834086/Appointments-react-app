import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

const HomeIcon = ({ className, ariaHidden = true }) => {
  return (
    <span className={className} aria-hidden={ariaHidden}>
      <FontAwesomeIcon
        icon={faHome}
        style={{ color: "#374151", fontSize: "16px" }}
      />
    </span>
  );
};

export default HomeIcon;
