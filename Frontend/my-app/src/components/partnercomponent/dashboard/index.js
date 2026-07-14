/**
 * Dashboard component kit — reusable building blocks for partner-facing
 * dashboards (owner, manager, receptionist).
 *
 *   import {
 *     WelcomeBanner,
 *     AppointmentsOverview,
 *     TotalsPanel,
 *     SectionCard,
 *     StatCircle,
 *     useDashboardStats,
 *   } from ".../components/partnercomponent/dashboard";
 */
export { default as SectionCard } from "./SectionCard";
export { default as StatCircle } from "./StatCircle";
export { default as AppointmentsOverview } from "./AppointmentsOverview";
export { default as TotalsPanel } from "./TotalsPanel";
export { default as WelcomeBanner } from "./WelcomeBanner";
export { default as PropertyCard } from "./PropertyCard";
export { default as DropdownMenu } from "./DropdownMenu";
export { default as WeatherBadge } from "./WeatherBadge";
export { default as useDashboardStats, STAT_PERIODS } from "./useDashboardStats";
