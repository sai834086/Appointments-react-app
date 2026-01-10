import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashBoardHeader from "../../components/usercomponent/DashBoardHeader";
import styles from "./ProfilePage.module.css";
import { ChevronLeft, Mail, Phone, MapPin, User } from "lucide-react";
import { getUserDetails } from "../../api/userService";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await getUserDetails();
        console.log("User details response:", response);
        setUserDetails(response?.data?.data?.Profile);
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError(err.response?.data?.message || "Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  if (loading) {
    return (
      <div className={styles.mainContainer}>
        <DashBoardHeader />
        <div className={styles.headerSection}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/account")}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.headerTitle}>Profile</h1>
        </div>
        <div className={styles.pageWrapper}>
          <div className={styles.loadingContainer}>
            <p className={styles.loadingText}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.mainContainer}>
        <DashBoardHeader />
        <div className={styles.headerSection}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/account")}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.headerTitle}>Profile</h1>
        </div>
        <div className={styles.pageWrapper}>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <DashBoardHeader />
      <div className={styles.headerSection}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/account")}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.headerTitle}>Profile</h1>
      </div>
      <div className={styles.pageWrapper}>
        <div className={styles.content}>
          {/* Profile Header */}
          <div className={styles.profileHeader}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatar}>
                {userDetails?.firstName?.charAt(0)?.toUpperCase()}
              </div>
            </div>
            <div className={styles.profileName}>
              <h2 className={styles.fullName}>
                {userDetails?.firstName} {userDetails?.lastName}
              </h2>
              <p className={styles.email}>{userDetails?.email}</p>
            </div>
          </div>

          {/* Details Card */}
          <div className={styles.detailsCard}>
            {/* First Name */}
            {userDetails?.firstName && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <User size={18} />
                </div>
                <div className={styles.detailContent}>
                  <p className={styles.detailLabel}>First Name</p>
                  <p className={styles.detailValue}>{userDetails.firstName}</p>
                </div>
              </div>
            )}

            {/* Last Name */}
            {userDetails?.lastName && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <User size={18} />
                </div>
                <div className={styles.detailContent}>
                  <p className={styles.detailLabel}>Last Name</p>
                  <p className={styles.detailValue}>{userDetails.lastName}</p>
                </div>
              </div>
            )}

            {/* Email */}
            {userDetails?.email && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <Mail size={18} />
                </div>
                <div className={styles.detailContent}>
                  <p className={styles.detailLabel}>Email</p>
                  <p className={styles.detailValue}>{userDetails.email}</p>
                </div>
              </div>
            )}

            {/* Phone */}
            {userDetails?.phoneNumber && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <Phone size={18} />
                </div>
                <div className={styles.detailContent}>
                  <p className={styles.detailLabel}>Phone Number</p>
                  <p className={styles.detailValue}>
                    {userDetails.phoneNumber}
                  </p>
                </div>
              </div>
            )}

            {/* Address */}
            {userDetails?.address && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <MapPin size={18} />
                </div>
                <div className={styles.detailContent}>
                  <p className={styles.detailLabel}>Address</p>
                  <p className={styles.detailValue}>{userDetails.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
