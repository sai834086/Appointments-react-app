/**
 * Header
 * ------
 * Intentionally renders nothing. The PartnerSidebar now owns the brand
 * mark, primary navigation, notifications, and identity, so the old top
 * strip is no longer needed. We keep the component (and its imports
 * across pages) so individual screens don't all have to be edited just
 * to drop the markup — they can keep `<Header />` in their tree without
 * any visual effect.
 */
export default function Header() {
  return null;
}
