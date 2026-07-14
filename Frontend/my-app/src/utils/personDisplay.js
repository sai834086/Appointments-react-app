// Shared display helpers for any person-like record with firstName/lastName
// fields (receptionists, employees, managers, etc). Previously duplicated
// across PropertyDetails.jsx, ManagerDashboard.jsx, and
// ManageReceptionists.jsx as getReceptionistInitials/getReceptionistFullName
// and getInitials/getFullName.

/**
 * Two-letter initials from a person's first/last name.
 * @param {{firstName?: string, lastName?: string}} person
 * @param {string} fallback - single character used when firstName is missing
 *   (defaults to "R" to match the original receptionist-card behavior)
 */
export function getPersonInitials(person, fallback = "R") {
  const first = (person?.firstName?.[0] || fallback).toUpperCase();
  const last = (person?.lastName?.[0] || "").toUpperCase();
  return first + last || fallback;
}

/**
 * "First Last" display name, trimmed. Returns "" if both names are missing.
 * @param {{firstName?: string, lastName?: string}} person
 */
export function getPersonFullName(person) {
  return `${person?.firstName || ""} ${person?.lastName || ""}`.trim();
}
