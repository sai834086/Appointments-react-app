import React from "react";
import styles from "./PartnersList.module.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

const PartnersList = ({ partners }) => {
  const navigate = useNavigate();
  const handlePartnerClicked = (partner) => {
    navigate("/services", { state: { partnerId: partner.id } });
  };

  if (!partners || partners.length === 0) {
    return (
      <div className={styles.partnersContainer}>
        <div className={styles.noPartnersMsg}>No partners found.</div>
      </div>
    );
  }

  return (
    <div className={styles.partnersContainer}>
      <div className={styles.partnersGrid}>
        {partners.map((partner, idx) => (
          <button
            className={styles.partnerCard}
            key={partner.id || idx}
            onClick={() => handlePartnerClicked(partner)}
          >
            <div className={styles.partnerHeader}>
              <div className={styles.partnerAvatar}>
                {partner.name ? partner.name.charAt(0).toUpperCase() : "P"}
              </div>
              <div>
                <div className={styles.partnerName}>{partner.name}</div>
                {partner.type && (
                  <div className={styles.partnerType}>{partner.type}</div>
                )}
              </div>
            </div>
            <div className={styles.partnerDetails}>
              {partner.address && (
                <div>
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    style={{ fontSize: "0.8rem" }}
                  />{" "}
                  {partner.address}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PartnersList;
