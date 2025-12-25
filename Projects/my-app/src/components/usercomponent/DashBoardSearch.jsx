import styles from "./DashBoardSearch.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import React, { useState } from "react";

export default function DashBoardSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderOptions = [
    'Search "Business Name"',
    'Search "Hospital"',
    'Search "Beauty and Spa"',
    'Search "Restaurants"',
  ];

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Add search logic here
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log(`Searching for: ${searchQuery}`);
    // Add search submit logic here
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderOptions.length);
    }, 2000); // Increased interval for better UX
    return () => clearInterval(interval);
  }, [placeholderOptions.length]);

  return (
    <section className={styles.searchSection}>
      <div className={styles.searchContainer}>
        <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
          <div
            className={`${styles.searchInputWrapper} ${
              searchQuery ? styles.hasText : ""
            }`}
          >
            {!searchQuery && (
              <span className={styles.searchIcon}>
                <FontAwesomeIcon icon={faSearch} />
              </span>
            )}
            <input
              type="text"
              placeholder={placeholderOptions[placeholderIndex]}
              value={searchQuery}
              onChange={handleSearchChange}
              className={styles.searchInput}
              autoComplete="off"
              spellCheck="false"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
            {searchQuery && (
              <button
                type="submit"
                className={styles.searchButtonInside}
                aria-label="Search"
              >
                <FontAwesomeIcon icon={faSearch} />
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
