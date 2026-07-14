import { useState, useEffect, useRef } from "react";
import styles from "./MapWithSearchBarMarker.module.css";
import { loadGoogleMapsScript, reverseGeocode } from "../../api/authService";

// Address input — a Places-autocomplete search field + "Use current
// location" button, no embedded map. This matches how most apps collect an
// address today (Airbnb, Uber, DoorDash, etc.): type a few characters, pick
// a suggestion, and the structured fields below fill themselves in. An
// interactive map the user has to click around on is no longer part of the
// flow — it's slower, and easy to misclick on mobile.
export default function MapWithSearchBarMarker({ autoFill }) {
  const [locLoading, setLocLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const autoFillRef = useRef(autoFill);
  useEffect(() => {
    autoFillRef.current = autoFill;
  }, [autoFill]);

  // Places' getDetails() needs either a Map instance or a plain
  // HTMLDivElement to construct a PlacesService — we don't render a map,
  // so we hand it a detached div that's never mounted. This is a
  // documented, widely-used way to use PlacesService without a visible map.
  const attributionNodeRef = useRef(
    typeof document !== "undefined" ? document.createElement("div") : null,
  );

  /** Current location — reverse-geocodes the coordinates directly, no map
   *  needed to center/zoom/drop a pin on anymore. */
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        reverseGeocode(latitude, longitude)
          .then((res) => {
            const result = res.results?.[0];
            if (result) {
              setInputValue(result.formatted_address || "");
              autoFillRef.current(result.address_components);
            }
          })
          .finally(() => setLocLoading(false));
      },
      (error) => {
        let errorMessage = "Unable to detect location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Location information unavailable. Please check your GPS/network.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        alert(errorMessage);
        setLocLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000, // Accept cached position up to 1 minute old
      },
    );
  };

  // Fetch suggestions as the user types, lightly debounced so it doesn't
  // fire a request on every keystroke.
  useEffect(() => {
    let active = true;

    const fetchPredictions = async () => {
      if (!inputValue.trim()) {
        setSuggestions([]);
        return;
      }
      const google = await loadGoogleMapsScript();
      const autocompleteService = new google.maps.places.AutocompleteService();
      autocompleteService.getPlacePredictions(
        { input: inputValue },
        (predictions, status) => {
          if (!active) return;
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        },
      );
    };

    const timer = setTimeout(fetchPredictions, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [inputValue]);

  const handleSuggestionClick = async (suggestion) => {
    setInputValue(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);

    const google = await loadGoogleMapsScript();
    const placesService = new google.maps.places.PlacesService(
      attributionNodeRef.current,
    );
    placesService.getDetails(
      { placeId: suggestion.place_id, fields: ["address_components"] },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place?.address_components
        ) {
          autoFillRef.current(place.address_components);
        }
      },
    );
  };

  function handleKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <span className={styles.searchIcon} aria-hidden="true">
          ⌕
        </span>
        <input
          type="text"
          placeholder="Enter your business address..."
          className={styles.searchInput}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className={styles.suggestionsDropdown} role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={s.place_id}
                role="option"
                aria-selected={i === activeIndex}
                className={`${styles.suggestionItem} ${
                  i === activeIndex ? styles.suggestionItemActive : ""
                }`}
                onMouseDown={() => handleSuggestionClick(s)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span className={styles.suggestionPin} aria-hidden="true">
                  📍
                </span>
                {s.description}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className={styles.currentLocationButton}
        onClick={handleCurrentLocation}
        disabled={locLoading}
      >
        <span aria-hidden="true">{locLoading ? "…" : "⊙"}</span>
        {locLoading ? "Detecting…" : "Use current location"}
      </button>
    </div>
  );
}
