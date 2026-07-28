import ProfileDetails from "../../components/partnercomponent/ProfileDetails";
import Header from "../../components/partnercomponent/Header";
import styles from "./PartnerAccount.module.css";

export default function PartnerAccount() {
  return (
    <div className={styles.mainContainer}>
      <div className={styles.headerContainer}>
        <Header />
      </div>
      <div className={styles.bodyContainer}>
        <div className={styles.contentContainer}>
          <ProfileDetails />
        </div>
      </div>
    </div>
  );
}
