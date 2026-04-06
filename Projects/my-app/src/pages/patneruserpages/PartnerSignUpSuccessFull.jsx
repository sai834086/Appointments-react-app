import styles from "./PartnerSignUp.module.css";

export default function PartnerSignUpSuccessFull() {
  return (
    <div className={styles.container}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
        <h2 className={styles.heading}>Registration successful</h2>
        <p>
          We received your request. Once Verified, you will be notified via
          email and phone.
        </p>
      </div>
    </div>
  );
}
