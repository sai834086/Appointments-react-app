import { NavLink } from "react-router-dom";
import { Link } from "react-scroll";
import styles from "./HomePageNav.module.css";
import Button from "./Button";

export default function HomePageNav() {
  return (
    <nav className={styles.navbar}>
      <ul>
        <li>
          <Link to="/" smooth={true} duration={700}>
            Home
          </Link>
        </li>
        <li>
          <Link to="ourpartners" smooth={true} duration={700}>
            Our Partners
          </Link>
        </li>

        <li>
          <Link to="about" smooth={true} duration={700}>
            About
          </Link>
        </li>
        <li>
          <Link to="Contactus" smooth={true} duration={700}>
            Contact us
          </Link>
        </li>
        <li>
          <NavLink to="login">
            <Button name={"Login"} />
          </NavLink>
        </li>
        <li>
          <NavLink to="userSignup">
            <Button name={"Create Account"} />
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
