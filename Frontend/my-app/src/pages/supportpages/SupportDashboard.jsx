import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SupportAuthContext } from "./context/SupportAuthContext";
import {
  getAllUsers,
  getUserDetail,
  getAllPartners,
  verifyPartner,
} from "../../api/supportService";
import styles from "./SupportDashboard.module.css";

export default function SupportDashboard() {
  const { agent, logout } = useContext(SupportAuthContext);
  const navigate = useNavigate();

  // "users" | "partners"
  const [tab, setTab] = useState("users");

  // ── Users ─────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  // ── Partners ──────────────────────────────────────────
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [partnersError, setPartnersError] = useState(null);

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [verifySuccess, setVerifySuccess] = useState(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchPartners();
  }, []);

  const fetchUsers = () => {
    setLoadingUsers(true);
    setUsersError(null);
    getAllUsers()
      .then((res) => setUsers(res.data?.data?.users || []))
      .catch(() => setUsersError("Failed to load users."))
      .finally(() => setLoadingUsers(false));
  };

  const fetchPartners = () => {
    setLoadingPartners(true);
    setPartnersError(null);
    getAllPartners()
      .then((res) => setPartners(res.data?.data?.partners || []))
      .catch(() => setPartnersError("Failed to load partners."))
      .finally(() => setLoadingPartners(false));
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setUserDetail(null);
    setLoadingUserDetail(true);
    try {
      const res = await getUserDetail(user.appUserId);
      setUserDetail(res.data?.data || null);
    } catch {
      setUserDetail({ error: "Failed to load user details." });
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleSelectPartner = (partner) => {
    setSelectedPartner(partner);
    setVerifyError(null);
    setVerifySuccess(null);
  };

  const handleVerifyPartner = async (partner) => {
    setVerifyingId(partner.partnerId);
    setVerifyError(null);
    setVerifySuccess(null);
    try {
      const res = await verifyPartner(partner.partnerId);
      const updated = res.data?.data?.partner;

      // Update list in place
      setPartners((prev) =>
        prev.map((p) =>
          p.partnerId === partner.partnerId
            ? { ...p, isVerified: "VERIFIED", ...(updated || {}) }
            : p,
        ),
      );

      // Keep the detail panel in sync
      if (selectedPartner?.partnerId === partner.partnerId) {
        setSelectedPartner((prev) => ({
          ...prev,
          isVerified: "VERIFIED",
          ...(updated || {}),
        }));
      }

      setVerifySuccess(
        `${partner.businessName || "Partner"} is now verified.`,
      );
    } catch (err) {
      setVerifyError(
        err.response?.data?.message || "Failed to verify partner.",
      );
    } finally {
      setVerifyingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/support/login");
  };

  const q = search.trim().toLowerCase();

  const filteredUsers = users.filter((u) => {
    if (!q) return true;
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phoneNumber?.includes(q)
    );
  });

  const filteredPartners = partners.filter((p) => {
    if (!q) return true;
    return (
      p.businessName?.toLowerCase().includes(q) ||
      p.firstName?.toLowerCase().includes(q) ||
      p.lastName?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phoneNumber?.includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const switchTab = (next) => {
    setTab(next);
    setSearch("");
    // Reset selections when switching contexts
    if (next === "users") {
      setSelectedPartner(null);
    } else {
      setSelectedUser(null);
      setUserDetail(null);
    }
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>Support Portal</div>
          <div className={styles.agentName}>
            {agent?.firstName} {agent?.lastName}
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${tab === "users" ? styles.tabActive : ""}`}
            onClick={() => switchTab("users")}
          >
            Users
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === "partners" ? styles.tabActive : ""}`}
            onClick={() => switchTab("partners")}
          >
            Partners
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder={
              tab === "users" ? "Search users…" : "Search partners…"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {tab === "users" ? (
          <>
            <div className={styles.userCount}>
              {filteredUsers.length} user
              {filteredUsers.length !== 1 ? "s" : ""}
            </div>

            {loadingUsers && <p className={styles.info}>Loading…</p>}
            {usersError && <p className={styles.errorText}>{usersError}</p>}

            <ul className={styles.userList}>
              {filteredUsers.map((u) => (
                <li
                  key={u.appUserId}
                  className={`${styles.userItem} ${
                    selectedUser?.appUserId === u.appUserId
                      ? styles.userItemActive
                      : ""
                  }`}
                  onClick={() => handleSelectUser(u)}
                >
                  <div className={styles.userAvatar}>
                    {u.firstName?.[0]}
                    {u.lastName?.[0]}
                  </div>
                  <div className={styles.userMeta}>
                    <span className={styles.userName}>
                      {u.firstName} {u.lastName}
                    </span>
                    <span className={styles.userEmail}>{u.email}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className={styles.userCount}>
              {filteredPartners.length} partner
              {filteredPartners.length !== 1 ? "s" : ""}
            </div>

            {loadingPartners && <p className={styles.info}>Loading…</p>}
            {partnersError && (
              <p className={styles.errorText}>{partnersError}</p>
            )}

            <ul className={styles.userList}>
              {filteredPartners.map((p) => {
                const unverified = p.isVerified !== "VERIFIED";
                return (
                  <li
                    key={p.partnerId}
                    className={`${styles.userItem} ${
                      selectedPartner?.partnerId === p.partnerId
                        ? styles.userItemActive
                        : ""
                    }`}
                    onClick={() => handleSelectPartner(p)}
                  >
                    <div className={styles.userAvatar}>
                      {p.businessName?.[0] || p.firstName?.[0] || "P"}
                    </div>
                    <div className={styles.userMeta}>
                      <span className={styles.userName}>
                        {p.businessName || `${p.firstName} ${p.lastName}`}
                      </span>
                      <span className={styles.userEmail}>{p.email}</span>
                    </div>
                    {unverified && (
                      <span
                        className={`${styles.pill} ${styles.pillUnverified}`}
                      >
                        Unverified
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Sign Out
        </button>
      </aside>

      {/* Main panel */}
      <main className={styles.main}>
        {tab === "users"
          ? renderUserMain()
          : renderPartnerMain()}
      </main>
    </div>
  );

  // ── Render helpers ──────────────────────────────────
  function renderUserMain() {
    if (!selectedUser) {
      return (
        <div className={styles.empty}>
          <p>Select a user from the list to view their details.</p>
        </div>
      );
    }
    if (loadingUserDetail) {
      return (
        <div className={styles.empty}>
          <p>Loading…</p>
        </div>
      );
    }
    if (userDetail?.error) {
      return (
        <div className={styles.empty}>
          <p className={styles.errorText}>{userDetail.error}</p>
        </div>
      );
    }
    if (!userDetail) return null;

    return (
      <div className={styles.detailPanel}>
        <section className={styles.profileCard}>
          <div className={styles.profileAvatar}>
            {userDetail.user?.firstName?.[0]}
            {userDetail.user?.lastName?.[0]}
          </div>
          <div className={styles.profileInfo}>
            <h2 className={styles.profileName}>
              {userDetail.user?.firstName} {userDetail.user?.lastName}
            </h2>
            <div className={styles.profileMeta}>
              <span>{userDetail.user?.email}</span>
              <span>{userDetail.user?.phoneNumber}</span>
            </div>
          </div>
        </section>

        <section className={styles.bookingsSection}>
          <h3 className={styles.sectionTitle}>
            Bookings ({userDetail.bookings?.length || 0})
          </h3>

          {!userDetail.bookings?.length ? (
            <p className={styles.info}>No bookings found.</p>
          ) : (
            <div className={styles.bookingsList}>
              {userDetail.bookings.map((b) => (
                <div key={b.appointmentId} className={styles.bookingCard}>
                  <div className={styles.bookingTop}>
                    <span className={styles.serviceName}>{b.serviceName}</span>
                    <span
                      className={`${styles.statusBadge} ${styles[`status_${b.status}`]}`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className={styles.bookingDetails}>
                    <span>{b.propertyName}</span>
                    <span>with {b.employeeName}</span>
                    <span>
                      {formatDate(b.appointmentDate)} at{" "}
                      {formatTime(b.startTime)}
                    </span>
                  </div>
                  <div className={styles.bookingId}>
                    #{b.confirmationNumber}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderPartnerMain() {
    if (!selectedPartner) {
      return (
        <div className={styles.empty}>
          <p>Select a partner from the list to view their details.</p>
        </div>
      );
    }

    const isVerified = selectedPartner.isVerified === "VERIFIED";

    return (
      <div className={styles.detailPanel}>
        <section className={styles.profileCard}>
          <div className={styles.profileAvatar}>
            {selectedPartner.businessName?.[0] ||
              selectedPartner.firstName?.[0] ||
              "P"}
          </div>
          <div className={styles.profileInfo}>
            <h2 className={styles.profileName}>
              {selectedPartner.businessName ||
                `${selectedPartner.firstName} ${selectedPartner.lastName}`}
            </h2>
            <div className={styles.profileMeta}>
              <span>
                {selectedPartner.firstName} {selectedPartner.lastName}
              </span>
              <span>{selectedPartner.email}</span>
              <span>{selectedPartner.phoneNumber}</span>
            </div>
            <div className={styles.badgeRow}>
              <span
                className={`${styles.pill} ${
                  isVerified ? styles.pillVerified : styles.pillUnverified
                }`}
              >
                {isVerified ? "Verified" : "Unverified"}
              </span>
              {selectedPartner.status && (
                <span className={`${styles.pill} ${styles.pillNeutral}`}>
                  {selectedPartner.status}
                </span>
              )}
            </div>
          </div>

          {!isVerified && (
            <button
              type="button"
              className={styles.verifyBtn}
              disabled={verifyingId === selectedPartner.partnerId}
              onClick={() => handleVerifyPartner(selectedPartner)}
            >
              {verifyingId === selectedPartner.partnerId
                ? "Verifying…"
                : "Mark as Verified"}
            </button>
          )}
        </section>

        {verifyError && <p className={styles.errorText}>{verifyError}</p>}
        {verifySuccess && <p className={styles.success}>{verifySuccess}</p>}

        <section className={styles.bookingsSection}>
          <h3 className={styles.sectionTitle}>Business Details</h3>
          <div className={styles.infoGrid}>
            <div>
              <div className={styles.infoLabel}>Business Type</div>
              <div className={styles.infoValue}>
                {selectedPartner.businessType || "—"}
              </div>
            </div>
            <div>
              <div className={styles.infoLabel}>Address</div>
              <div className={styles.infoValue}>
                {[
                  selectedPartner.buildingNo,
                  selectedPartner.street,
                  selectedPartner.city,
                  selectedPartner.state,
                  selectedPartner.country,
                  selectedPartner.zipCode,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
