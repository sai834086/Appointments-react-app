import React from "react";
import styles from "./Loading.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function Loading({ isLoading, position = "popup" }) {
  if (!isLoading) return null;

  if (position === "center") {
    return (
      <div className={styles.centerOverlay}>
        <div className={styles.centerContent}>
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      </div>
    );
  }
}
