import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

const HomeIcon = ({ className, ariaHidden = true }) => {
  return (
    <span className={className} aria-hidden={ariaHidden}>
      <FontAwesomeIcon
        icon={faHome}
        style={{ color: "white", fontSize: "26px" }}
      />
    </span>
  );
};

export default HomeIcon;
