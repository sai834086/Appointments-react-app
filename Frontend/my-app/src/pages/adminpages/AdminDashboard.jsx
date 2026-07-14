import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AdminAuthContext } from "./context/AdminAuthContext";
import {
  getSupportUsers,
  createSupportUser,
} from "../../api/adminService";
import styles from "./AdminDashboard.module.css";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phoneNumber: "",
};

export default function AdminDashboard() {
  const { admin, logout } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  const [supportUsers, setSupportUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSupportUsers();
  }, []);

  const fetchSupportUsers = () => {
    setLoadingUsers(true);
    setUsersError(null);
    getSupportUsers()
      .then((res) => setSupportUsers(res.data?.data?.supportUsers || []))
      .catch(() => setUsersError("Failed to load support users."))
      .finally(() => setLoadingUsers(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password, phoneNumber } = form;
    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      setFormError("All fields are required.");
      return;
    }
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      await createSupportUser(form);
      setFormSuccess("Support user created successfully.");
      setForm(EMPTY_FORM);
      fetchSupportUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create support user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>Admin Portal</div>
          <div className={styles.adminName}>
            {admin?.firstName} {admin?.lastName}
          </div>
        </div>

        <div className={styles.sectionLabel}>Support Accounts</div>

        {loadingUsers && <p className={styles.info}>Loading…</p>}
        {usersError && <p className={styles.errorText}>{usersError}</p>}

        <ul className={styles.userList}>
          {supportUsers.map((u) => (
            <li key={u.appUserId} className={styles.userItem}>
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
          {!loadingUsers && !usersError && supportUsers.length === 0 && (
            <li className={styles.emptyList}>No support users yet.</li>
          )}
        </ul>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Sign Out
        </button>
      </aside>

      {/* Main panel */}
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <h1 className={styles.mainTitle}>Create Support User</h1>
          <p className={styles.mainSubtitle}>
            New support accounts can log in at <code>/support/login</code>.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Jane"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Smith"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jane@example.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              id="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="+1 555 000 0000"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Temporary Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {formError && <p className={styles.error}>{formError}</p>}
          {formSuccess && <p className={styles.success}>{formSuccess}</p>}

          <button type="submit" className={styles.button} disabled={submitting}>
            {submitting ? "Creating…" : "Create Support User"}
          </button>
        </form>
      </main>
    </div>
  );
}
