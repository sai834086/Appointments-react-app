import styles from "./DashBoardLocation.module.css";
import {
  faArrowAltCircleRight,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function DashBoardLocation({ userAddress, onLocationClicked }) {
  return (
    <div>
      {/* Location Section */}

      <section className={styles.locationSection}>
        <div className={styles.locationContainer} onClick={onLocationClicked}>
          <div className={styles.locationIcon} title="Detect location">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </div>
          <p className={styles.locationText}>
            {userAddress
              ? `${userAddress.city}, ${userAddress.state}, ${
                  userAddress.country
                }${userAddress.zip ? ` ${userAddress.zip}` : ""}`
              : "Add location for better results"}
          </p>
          <div className={styles.arrowIcon}>
            <FontAwesomeIcon icon={faArrowAltCircleRight} />
          </div>
        </div>
      </section>
    </div>
  );
}
