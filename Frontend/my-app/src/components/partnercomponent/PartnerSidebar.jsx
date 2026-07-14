import { useContext, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserCircle,
  Settings,
  HelpCircle,
  Mail,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import styles from "./PartnerSidebar.module.css";
import { PartnerAuthContext } from "../../pages/patneruserpages/context/PartnerAuthContext";

export default function PartnerSidebar({ expanded = false, onExpandedChange }) {
  const { userType } = useContext(PartnerAuthContext) || {};
  const [open, setOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const setExpanded = onExpandedChange ?? (() => {});

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  const closeDrawer = () => setOpen(false);

  const isManager = userType === "manager";
  // Managers browse under the /partner/manager/* namespace end-to-end so the
  // URL always reflects which portal they're in; partners keep the plain
  // /partner/* paths. Both sets of routes render the same shared page
  // components — see PartnerApp.jsx.
  const withBase = (path) => (isManager ? `/partner/manager${path}` : `/partner${path}`);

  const dashboardTarget = withBase("/dashboard");

  const navItems = [
    { to: dashboardTarget, label: "Dashboard", icon: LayoutDashboard },
    {
      to: withBase("/notifications"),
      label: "Notifications",
      icon: Bell,
      hasDot: true,
    },
    { to: withBase("/account"), label: "Profile", icon: UserCircle },
    { to: withBase("/settings"), label: "Settings", icon: Settings },
    { to: withBase("/help"), label: "Help", icon: HelpCircle },
    { to: withBase("/contact"), label: "Contact Us", icon: Mail },
  ];

  const roleLabel = userType === "manager" ? "Property Manager" : "Partner";

  return (
    <>
      {/* Mobile-only hamburger trigger */}
      <button
        type="button"
        className={styles.HamburgerBtn}
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="partner-sidebar"
        onClick={() => setOpen(true)}
      >
        <Menu size={22} />
      </button>

      {/* Backdrop (mobile drawer) */}
      {open && (
        <div
          className={styles.Backdrop}
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      <aside
        id="partner-sidebar"
        className={`${styles.Sidebar} ${open ? styles.SidebarOpen : ""} ${!expanded ? styles.SidebarCollapsed : ""}`}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        aria-label="Partner navigation"
      >
        {/* Brand row */}
        <div className={styles.BrandRow}>
          {/* Closed: always a button — shows 🏢 when idle, ChevronRight when hovered */}
          {!expanded ? (
            <button
              type="button"
              className={styles.ExpandBtn}
              onClick={() => setExpanded(true)}
              aria-label="Expand navigation menu"
            >
              {sidebarHovered ? (
                <ChevronRight size={18} />
              ) : (
                <Building2 size={18} />
              )}
            </button>
          ) : (
            <div className={styles.Brand}>
              <span className={styles.BrandIcon} aria-hidden="true">
                <Building2 size={19} strokeWidth={2.1} />
              </span>
              <div className={styles.BrandText}>
                <div className={styles.BrandName}>PropertyHub</div>
                <div className={styles.BrandTag}>{roleLabel} portal</div>
              </div>
            </div>
          )}
          {/* Mobile close */}
          <button
            type="button"
            className={styles.CloseBtn}
            onClick={closeDrawer}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
          {/* Desktop collapse — only shown when expanded */}
          {expanded && (
            <button
              type="button"
              className={styles.CollapseBtn}
              onClick={() => setExpanded(false)}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Primary nav */}
        <nav className={styles.Nav} aria-label="Primary">
          <ul className={styles.NavList}>
            {navItems.map(({ to, label, icon: Icon, hasDot }) => (
              <li key={to} className={styles.NavItem}>
                <NavLink
                  to={to}
                  end={to === dashboardTarget}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `${styles.NavLink} ${isActive ? styles.NavLinkActive : ""}`
                  }
                  title={!expanded ? label : undefined}
                >
                  <span className={styles.NavIcon} aria-hidden="true">
                    <Icon size={18} />
                    {hasDot && (
                      <span className={styles.NavBadge} aria-hidden="true" />
                    )}
                  </span>
                  {expanded ? (
                    <>
                      <span className={styles.NavLabel}>{label}</span>
                      <span
                        className={styles.NavIndicator}
                        aria-hidden="true"
                      />
                    </>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {expanded && (
          <div className={styles.Footer}>
            <div className={styles.FooterMeta}>
              © {new Date().getFullYear()} PropertyHub
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
