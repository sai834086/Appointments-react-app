import ProfileDetails from "../../components/partnercomponent/ProfileDetails";
import Header from "../../components/partnercomponent/Header";
import styles from "./PartnerAccount.module.css";
import { useContext } from "react";
import { PartnerAuthContext } from "./context/PartnerAuthContext";

export default function PartnerAccount() {
  const { partnerProfile } = useContext(PartnerAuthContext);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.headerContainer}>
        <Header />
      </div>
      <div className={styles.bodyContainer}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.profileAvatar}>
              <span className={styles.avatarInitials}>
                {partnerProfile?.firstName?.[0]}
                {partnerProfile?.lastName?.[0]}
              </span>
            </div>
            <div className={styles.headerInfo}>
              <h1 className={styles.pageTitle}>Account Settings</h1>
              <p className={styles.pageSubtitle}>
                Manage your profile information and account preferences
              </p>
            </div>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>✅</span>
              <span className={styles.statText}>Verified</span>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className={styles.contentContainer}>
          <ProfileDetails />
        </div>
      </div>
    </div>
  );
}
