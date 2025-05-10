import React from "react";
import HomePageNav from "../components/HomePageNav";
import Logo from "../components/Logo";
import Button from "../components/Button";
import styles from "./HomePage.module.css";
import { NavLink } from "react-router-dom";

export default function HomePage() {
  return (
    <div>
      <div className={styles.navmain}>
        <header className={styles.container}>
          <Logo />
          <HomePageNav />
        </header>

        <div id="/" className={styles.content}>
          <h1>WELCOME</h1>
          <h2>ALL APPOINTMENTS AT ONE PLACE...!</h2>
          <h2>Why Schedule an Appointment?</h2>
          <p>
            We offer flexible times, great service, and the ability to book from
            the comfort of your home. <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Scheduling your appointment
            online ensures you get the best time slot available.
          </p>
          <div className={styles.buttons}>
            <NavLink to="/dashboard">
              <Button name={"SCHEDULE APPOINTMENT"} />
            </NavLink>
            <NavLink to="/partnerSignup">
              <Button name={"LIST YOUR PROPERTY"} />
            </NavLink>
          </div>
        </div>
      </div>

      <section id="ourpartners" className={styles.ourpartners}>
        <h1>Our Partners</h1>
        <div className={styles.ourpartnerscontent}>
          <div className={styles.content1}>h</div>
          <div className={styles.content2}>h</div>
          <div className={styles.content3}>h</div>
          <div className={styles.content4}>h</div>
          <div className={styles.content5}>h</div>
          <div className={styles.content6}>h</div>
          <div className={styles.content6}>h</div>
        </div>
      </section>

      <section id="about" className={styles.about}>
        <h1>About</h1>
        <div className={styles.aboutcontent}>
          <div className={styles.content1}>h</div>
          <div className={styles.content2}>h</div>
          <div className={styles.content3}>h</div>
        </div>
      </section>
      <footer id="Contactus" className={styles.contactus}>
        <h1>Contact Us</h1>
        <p>Information about the company.</p>
      </footer>
    </div>
  );
}
