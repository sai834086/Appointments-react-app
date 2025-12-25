import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./SearchAddress.module.css";
import {
  loadGoogleMapsScript,
  initializePlacesAutocompleteReact,
} from "../../api/authService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSearch,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import Loading from "./Loading";

export default function SearchAddress({
  onBackClicked,
  onAddressSelected,
  onUseCurrentLocation,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const initializeAutocomplete = useCallback(() => {
    initializePlacesAutocompleteReact(inputRef.current)
      .then((autocomplete) => {
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            const addressComponents = place.address_components;
            const getComponent = (type) =>
              addressComponents.find((c) => c.types.includes(type))
                ?.long_name || "";

            // Extract address components with fallback logic
            const city =
              getComponent("locality") ||
              getComponent("administrative_area_level_2") ||
              getComponent("sublocality") ||
              getComponent("administrative_area_level_3") ||
              "";

            const state =
              getComponent("administrative_area_level_1") ||
              getComponent("administrative_area_level_2") ||
              "";

            const country = getComponent("country");

            const selectedAddress = {
              city: city || "Unknown City",
              state: state || "Unknown State",
              country: country || "Unknown Country",

              fullAddress: place.formatted_address,
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            };

            setSearchQuery(place.formatted_address);

            if (onAddressSelected) {
              onAddressSelected(selectedAddress);
            }
          }
        });

        autocompleteRef.current = autocomplete;
      })
      .catch((error) => {
        console.error(
          "Failed to initialize Google Places Autocomplete:",
          error
        );
      });
  }, [onAddressSelected]);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        initializeAutocomplete();
      })
      .catch((error) => {
        console.error("Failed to load Google Maps:", error);
      });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
      }
    };
  }, [initializeAutocomplete]);

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    // wait briefly to show loading state / debounce rapid clicks
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      if (onUseCurrentLocation) {
        await onUseCurrentLocation();
      }
    } catch (error) {
      console.error("Error getting current location:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear suggestions if input is empty
    if (!value.trim()) {
      return;
    }

    // Google Places Autocomplete handles suggestions automatically
  };

  return (
    <div className={styles.searchAddressContainer}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={onBackClicked}
          type="button"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div className={styles.title}>Search an Address</div>
      </div>

      <div className={styles.searchContent}>
        <div className={styles.searchInputWrapper}>
          <FontAwesomeIcon icon={faSearch} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Search for a city.."
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.currentLocationSection}>
        <h4>Use Current Location:</h4>
        <button
          className={styles.currentLocationButton}
          onClick={handleUseCurrentLocation}
          type="button"
          disabled={isLoadingLocation}
        >
          <div>
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </div>

          <div className={styles.currentLocationText}>
            <span>Click to enable Location</span>
          </div>
        </button>
      </div>
      <div className={styles.savedAddressesSection}>
        <h4>Saved Addresses:</h4>
      </div>
      {<Loading isLoading={isLoadingLocation} position="center" />}
    </div>
  );
}
