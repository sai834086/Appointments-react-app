import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const ProfileIcon = ({ className, ariaHidden = true }) => {
  return (
    <span className={className} aria-hidden={ariaHidden}>
      <FontAwesomeIcon
        icon={faUser}
        style={{ color: "white", fontSize: "26px" }}
      />
    </span>
  );
};

export default ProfileIcon;
