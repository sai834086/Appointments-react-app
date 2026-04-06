import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

const LogoutIcon = ({ className, ariaHidden = true }) => {
  return (
    <span className={className} aria-hidden={ariaHidden}>
      <FontAwesomeIcon
        icon={faSignOutAlt}
        style={{ color: "white", fontSize: "26px" }}
      />
    </span>
  );
};

export default LogoutIcon;
