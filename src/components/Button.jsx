import styles from "./Button.module.css";

export default function Button({ type, name, onClick }) {
  return <button type={type} onClick={onClick} className={styles.button}>{name}</button>;
}
