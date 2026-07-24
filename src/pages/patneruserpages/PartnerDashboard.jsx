import { PartnerAuthContext } from "./context/PartnerAuthContext";
import { useContext, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StyleSheet from "./PartnerDashBoard.module.css";
import Header from "../../components/partnercomponent/Header";
import PropertyRegister from "../../components/partnercomponent/PropertyRegister";
import ManagerModal from "../../components/partnercomponent/ManagerModal";
import PropertyEdit from "../../components/partnercomponent/PropertyEdit";
import {
  registerProperty,
  updateProperty,
  deleteProperty,
} from "../../api/authService";
import {
  WelcomeBanner,
  AppointmentsOverview,
  TotalsPanel,
  SectionCard,
  PropertyCard,
  DropdownMenu,
  WeatherBadge,
  useDashboardStats,
} from "../../components/partnercomponent/dashboard";
import {
  Building2,
  Users,
  Settings,
  Lightbulb,
  CheckCircle2,
  Trash2,
  Plus,
  Filter,
  ArrowUpDown,
} from "lucide-react";

const FILTER_OPTIONS = [
  { key: "ALL", label: "All statuses" },
  { key: "ACTIVE", label: "Active only" },
  { key: "INACTIVE", label: "Inactive only" },
];

const SORT_OPTIONS = [
  { key: "NAME_ASC", label: "Name A → Z" },
  { key: "NAME_DESC", label: "Name Z → A" },
  { key: "EMPLOYEES", label: "Most employees" },
  { key: "SERVICES", label: "Most services" },
];

const SORT_COMPARATORS = {
  NAME_ASC: (a, b) =>
    (a.propertyName || a.name || "").localeCompare(
      b.propertyName || b.name || "",
    ),
  NAME_DESC: (a, b) =>
    (b.propertyName || b.name || "").localeCompare(
      a.propertyName || a.name || "",
    ),
  EMPLOYEES: (a, b) => (b.totalEmployees ?? 0) - (a.totalEmployees ?? 0),
  SERVICES: (a, b) => (b.totalServices ?? 0) - (a.totalServices ?? 0),
};

export default function PartnerDashboard() {
  const { partnerProfile, properties, refreshProperties } =
    useContext(PartnerAuthContext);
  const navigate = useNavigate();
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageType, setSuccessMessageType] = useState("add");
  const [deletingProperty, setDeletingProperty] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Properties list controls — reset naturally on every visit (local state).
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NAME_ASC");

  // Property edit modal state
  const [isPropertyEditOpen, setIsPropertyEditOpen] = useState(false);
  const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState(null);

  // Manager modal state
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [managerModalMode, setManagerModalMode] = useState("add");
  const [managerContextProperty, setManagerContextProperty] = useState(null);

  // Dashboard stats — all three appointment periods at once + portfolio
  // totals + profile echo. Handles parallel fetching, focus refetch,
  // loading, and error states internally.
  const {
    appointments,
    totals,
    profile: statsProfile,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats();

  // Refresh dashboard data whenever the user lands here.
  // - on mount (covers route-navigation back from Property / Employee pages)
  // - when the tab becomes visible again (covers alt-tabbing or returning from
  //   another window where edits may have been made elsewhere)
  // The provider's `fetchPropertiesInProgress` ref de-duplicates concurrent
  // calls, so this is safe to run alongside the provider's own bootstrap fetch.
  useEffect(() => {
    if (!refreshProperties) return undefined;

    refreshProperties();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshProperties();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", refreshProperties);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", refreshProperties);
    };
  }, [refreshProperties]);

  // Keep the stat numbers in sync when the portfolio changes (a property was
  // added/removed on this page).
  useEffect(() => {
    refetchStats();
  }, [properties?.length, refetchStats]);

  const handlePropertySubmit = async (formData) => {
    const response = await registerProperty(formData);

    if (response.data.success) {
      await refreshProperties();
      setSuccessMessageType("add");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      setIsPropertyFormOpen(false);
    } else {
      throw new Error(response.data.message || "Registration failed");
    }
  };

  const handleOpenPropertyEdit = (property) => {
    setSelectedPropertyForEdit(property);
    setIsPropertyEditOpen(true);
  };

  const handlePropertyUpdate = async (propertyId, data) => {
    const response = await updateProperty(propertyId, data);
    if (response.data.success) {
      await refreshProperties();
      setSuccessMessageType("edit");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      setIsPropertyEditOpen(false);
      setSelectedPropertyForEdit(null);
    } else {
      throw new Error(response.data.message || "Update failed");
    }
  };

  const handleViewProperty = (property) => {
    const propertyId = property.propertyId || property.id;
    // Persist the selection so a page refresh can still resolve the property
    // without exposing the id in the URL.
    try {
      sessionStorage.setItem("currentPropertyId", String(propertyId));
    } catch {
      // sessionStorage unavailable; state-based navigation still works
    }
    navigate("/partner/property", {
      state: {
        propertyId,
        propertyDetails: property,
      },
    });
  };

  const handleOpenManagerModal = (property, mode) => {
    setManagerContextProperty(property);
    setManagerModalMode(mode);
    setIsManagerModalOpen(true);
  };

  const handleCloseManagerModal = () => {
    setIsManagerModalOpen(false);
    setManagerContextProperty(null);
  };

  const handleManagerSaved = async () => {
    await refreshProperties();
    setIsManagerModalOpen(false);
    setManagerContextProperty(null);
  };

  const handleDeleteProperty = async () => {
    if (!deletingProperty) return;
    const propertyId = deletingProperty.propertyId || deletingProperty.id;
    try {
      setDeleteError(null);
      await deleteProperty(propertyId);
      await refreshProperties();
      setDeletingProperty(null);
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message ||
          "Failed to delete property. Please try again.",
      );
    }
  };

  const firstName =
    statsProfile?.firstName || partnerProfile?.firstName || null;
  const businessName =
    statsProfile?.businessName || partnerProfile?.businessName || null;

  // Client-side fallback breakdown, used until the stats API provides one
  // (older backend builds) — computed from the property list in context.
  const localPropertyBreakdown = (properties || []).reduce(
    (acc, p) => {
      if (p?.status === "INACTIVE") acc.inactive += 1;
      else acc.active += 1;
      return acc;
    },
    { active: 0, inactive: 0 },
  );

  // Filtered + sorted view of the portfolio for the Properties section.
  const visibleProperties = useMemo(() => {
    let list = [...(properties || [])];
    if (statusFilter !== "ALL") {
      list = list.filter(
        (p) =>
          (p?.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") === statusFilter,
      );
    }
    list.sort(SORT_COMPARATORS[sortBy] || SORT_COMPARATORS.NAME_ASC);
    return list;
  }, [properties, statusFilter, sortBy]);

  const hasProperties = (properties?.length ?? 0) > 0;

  return (
    <div className={StyleSheet.MainContainer}>
      <div className={StyleSheet.HeaderContainer}>
        <Header />
      </div>
      <div className={StyleSheet.BodyContainer}>
        {/* Welcome banner — full-width rounded strip with the greeting and
            the page-level actions, matching the wireframe's top bar. */}
        <WelcomeBanner
          name={firstName}
          subtitle={
            businessName || "Here's a quick look at your business today."
          }
          loading={statsLoading && !firstName}
          actions={<WeatherBadge />}
        />

        {/* Stats row — Appointments circles (today, expandable to month /
            year) on the left, portfolio totals on the right. */}
        <div className={StyleSheet.StatsRow}>
          <AppointmentsOverview
            stats={appointments}
            loading={statsLoading}
            error={statsError}
            onRetry={refetchStats}
          />
          <TotalsPanel
            loading={statsLoading}
            items={[
              {
                key: "properties",
                label: "Properties",
                total: totals?.properties?.total ?? properties?.length ?? null,
                icon: Building2,
                breakdown: {
                  active:
                    totals?.properties?.active ?? localPropertyBreakdown.active,
                  inactive:
                    totals?.properties?.inactive ??
                    localPropertyBreakdown.inactive,
                },
              },
              {
                key: "services",
                label: "Services",
                total: totals?.services?.total ?? null,
                icon: Settings,
                // Breakdown appears once the backend provides it (a service
                // is ACTIVE when at least one employee offers it).
                breakdown:
                  totals?.services?.active != null
                    ? {
                        active: totals.services.active,
                        inactive: totals.services.inactive,
                      }
                    : null,
              },
              {
                key: "employees",
                label: "Employees",
                total: totals?.employees?.total ?? null,
                icon: Users,
                breakdown: {
                  active: totals?.employees?.active ?? null,
                  inactive: totals?.employees?.inactive ?? null,
                },
              },
            ]}
          />
        </div>

        {/* Partner Status Info Note */}
        {partnerProfile?.status === "INACTIVE" && (
          <div className={StyleSheet.InfoNote}>
            <div className={StyleSheet.InfoIcon}>
              <Lightbulb size={18} strokeWidth={2} />
            </div>
            <div className={StyleSheet.InfoContent}>
              <h4>Activate Your Account</h4>
              <p>
                To make your account status active, please add at least one
                property or ensure you have an active property in your
                portfolio.
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className={StyleSheet.SuccessMessage} role="status">
            <div className={StyleSheet.SuccessContent}>
              <span className={StyleSheet.SuccessIcon}>
                <CheckCircle2 size={18} strokeWidth={2.25} />
              </span>
              <div className={StyleSheet.SuccessText}>
                <h4>
                  {successMessageType === "add"
                    ? "Property Added Successfully!"
                    : "Property Updated Successfully!"}
                </h4>
                <p>
                  {successMessageType === "add"
                    ? "Your new property has been registered and is now visible in your portfolio."
                    : "Your property has been updated and the changes are now visible in your portfolio."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Properties — wireframe card layout with filter / sort controls
            and a compact Add button in the section header. */}
        <SectionCard
          title="Properties"
          count={hasProperties ? properties.length : undefined}
          className={StyleSheet.PropertiesCard}
          aria-label="Property portfolio"
          actions={
            hasProperties && (
              <>
                <DropdownMenu
                  icon={Filter}
                  label="Filter by status"
                  options={FILTER_OPTIONS}
                  value={statusFilter}
                  onSelect={setStatusFilter}
                  active={statusFilter !== "ALL"}
                />
                <DropdownMenu
                  icon={ArrowUpDown}
                  label="Sort properties"
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onSelect={setSortBy}
                  active={sortBy !== "NAME_ASC"}
                />
                <button
                  type="button"
                  className={StyleSheet.SectionAddButton}
                  onClick={() => setIsPropertyFormOpen(true)}
                  aria-label="Add new property"
                >
                  <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
                  Add
                </button>
              </>
            )
          }
        >
          {hasProperties ? (
            visibleProperties.length > 0 ? (
              <div className={StyleSheet.PropertyCardList}>
                {visibleProperties.map((property) => (
                  <PropertyCard
                    key={property.propertyId || property.id}
                    property={property}
                    onView={handleViewProperty}
                    onEdit={handleOpenPropertyEdit}
                    onManage={handleOpenManagerModal}
                  />
                ))}
              </div>
            ) : (
              <div className={StyleSheet.NoProperties}>
                <div className={StyleSheet.EmptyIcon}>
                  <Filter size={32} strokeWidth={1.75} />
                </div>
                <h3>No matching properties</h3>
                <p>No properties match the current filter.</p>
                <button
                  className={StyleSheet.GetStartedButton}
                  onClick={() => setStatusFilter("ALL")}
                >
                  Clear Filter
                </button>
              </div>
            )
          ) : (
            <div className={StyleSheet.NoProperties}>
              <div className={StyleSheet.EmptyIcon}>
                <Building2 size={32} strokeWidth={1.75} />
              </div>
              <h3>No properties yet</h3>
              <p>
                Start building your property portfolio by adding your first
                property!
              </p>
              <button
                className={StyleSheet.GetStartedButton}
                onClick={() => setIsPropertyFormOpen(true)}
              >
                Get Started
              </button>
            </div>
          )}
        </SectionCard>
      </div>

      <PropertyRegister
        isOpen={isPropertyFormOpen}
        onClose={() => setIsPropertyFormOpen(false)}
        onSubmit={handlePropertySubmit}
      />

      <PropertyEdit
        isOpen={isPropertyEditOpen}
        onClose={() => {
          setIsPropertyEditOpen(false);
          setSelectedPropertyForEdit(null);
        }}
        property={selectedPropertyForEdit}
        onUpdate={handlePropertyUpdate}
        onDelete={(propertyToDelete) => {
          // Hand off from the edit modal to the delete confirmation dialog.
          setIsPropertyEditOpen(false);
          setSelectedPropertyForEdit(null);
          setDeleteError(null);
          setDeletingProperty(propertyToDelete);
        }}
      />

      <ManagerModal
        isOpen={isManagerModalOpen}
        onClose={handleCloseManagerModal}
        mode={managerModalMode}
        propertyId={
          managerContextProperty?.propertyId || managerContextProperty?.id
        }
        propertyName={
          managerContextProperty?.propertyName ||
          managerContextProperty?.name ||
          ""
        }
        manager={
          managerContextProperty?.manager &&
          !managerContextProperty.manager.isOwner
            ? managerContextProperty.manager
            : null
        }
        onSaved={handleManagerSaved}
      />

      {/* Delete property confirm dialog */}
      {deletingProperty && (
        <div
          className={StyleSheet.ConfirmOverlay}
          onClick={() => setDeletingProperty(null)}
          role="presentation"
        >
          <div
            className={StyleSheet.ConfirmCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-property-title"
          >
            <div className={StyleSheet.ConfirmIcon}>
              <Trash2 size={28} strokeWidth={1.75} />
            </div>
            <h3 id="delete-property-title" className={StyleSheet.ConfirmTitle}>
              Delete Property?
            </h3>
            <p className={StyleSheet.ConfirmBody}>
              <strong>
                {deletingProperty.propertyName || deletingProperty.name}
              </strong>{" "}
              will be permanently deleted. This action cannot be undone.
            </p>
            {deleteError && (
              <p className={StyleSheet.ConfirmError}>{deleteError}</p>
            )}
            <div className={StyleSheet.ConfirmActions}>
              <button
                type="button"
                className={StyleSheet.ConfirmCancel}
                onClick={() => setDeletingProperty(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={StyleSheet.ConfirmDelete}
                onClick={handleDeleteProperty}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
