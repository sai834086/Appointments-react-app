import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./MapWithSearchBarMarker.module.css";
import { loadGoogleMapsScript, reverseGeocode } from "../../api/authService";

export default function MapWithSearchBarMarker({ autoFill }) {
  const [map, setMap] = useState(null);
  const [accuracyCircle, setAccuracyCircle] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const clickListenerAdded = useRef(false);

  const autoFillRef = useRef(autoFill);

  // Update the ref when autoFill changes
  useEffect(() => {
    autoFillRef.current = autoFill;
  }, [autoFill]);

  /** Clear markers & circles */
  const clearMarkersAndCircles = useCallback(() => {
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setMap(null);
      currentMarkerRef.current = null;
    }
    if (accuracyCircle) {
      accuracyCircle.setMap(null);
      setAccuracyCircle(null);
    }
  }, [accuracyCircle]);

  /** Current location */
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const coords = { lat: latitude, lng: longitude };

        console.log("Got position:", coords, "Accuracy:", accuracy, "meters");

        if (!map) {
          setLocLoading(false);
          return;
        }

        clearMarkersAndCircles();

        map.setCenter(coords);

        // Adjust zoom based on accuracy - better accuracy = higher zoom
        const zoomLevel = accuracy < 100 ? 18 : accuracy < 500 ? 16 : 14;
        map.setZoom(zoomLevel);

        const marker = new window.google.maps.Marker({
          position: coords,
          map,
          animation: window.google.maps.Animation.DROP,
          title: `Accuracy: ±${Math.round(accuracy)}m`,
        });

        currentMarkerRef.current = marker;

        // Create accuracy circle with proper radius
        const circle = new window.google.maps.Circle({
          map,
          center: coords,
          radius: accuracy,
          fillOpacity: 0.1,
          strokeColor: "#4285F4",
          strokeOpacity: 0.3,
          strokeWeight: 1,
        });

        setAccuracyCircle(circle);

        reverseGeocode(latitude, longitude)
          .then((res) => {
            const result = res.results?.[0];
            if (result) autoFillRef.current(result.address_components);
          })
          .finally(() => setLocLoading(false));
      },
      (error) => {
        console.error("Geolocation error:", error);
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
      }
    );
  };

  const mapInitializedRef = useRef(false);

  /** Initialize map and set up click listener */
  useEffect(() => {
    if (mapInitializedRef.current || !mapRef.current) {
      return;
    }

    const initMap = async () => {
      console.log("Initializing map...");
      const google = await loadGoogleMapsScript();

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
      });

      setMap(mapInstance);
      mapInitializedRef.current = true;

      // Add click listener
      if (!clickListenerAdded.current) {
        mapInstance.addListener("click", (event) => {
          const coords = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };

          clearMarkersAndCircles();

          const marker = new google.maps.Marker({
            position: coords,
            map: mapInstance,
            animation: google.maps.Animation.DROP,
          });
          currentMarkerRef.current = marker;
          reverseGeocode(coords.lat, coords.lng)
            .then((res) => {
              console.log("Reverse geocode result:", res);
              const result = res.results?.[0];
              if (result) {
                console.log(
                  "Calling autoFill with:",
                  result.address_components
                );
                autoFillRef.current(result.address_components);
              } else {
                console.log("No results from reverse geocode");
              }
            })
            .catch((error) => {
              console.error("Reverse geocode error:", error);
            });
        });

        clickListenerAdded.current = true;
      }
    };

    initMap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch suggestions as user types
  useEffect(() => {
    let active = true;
    let autocompleteService = null;
    let google;
    const fetchPredictions = async () => {
      if (!inputValue) {
        setSuggestions([]);
        return;
      }
      google = await loadGoogleMapsScript();
      autocompleteService = new google.maps.places.AutocompleteService();
      autocompleteService.getPlacePredictions(
        { input: inputValue },
        (predictions, status) => {
          if (active) {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              setSuggestions(predictions);
            } else {
              setSuggestions([]);
            }
          }
        }
      );
    };
    fetchPredictions();
    return () => {
      active = false;
    };
  }, [inputValue]);

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion) => {
    if (!map || !mapRef.current) return;
    setInputValue(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    const google = await loadGoogleMapsScript();
    const placesService = new google.maps.places.PlacesService(map);
    placesService.getDetails(
      { placeId: suggestion.place_id },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.geometry
        ) {
          const coords = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          map.panTo(coords);
          map.setZoom(16);
          clearMarkersAndCircles();
          const marker = new google.maps.Marker({
            position: coords,
            map: map,
            animation: google.maps.Animation.DROP,
          });
          currentMarkerRef.current = marker;
          if (place.address_components) {
            autoFillRef.current(place.address_components);
          }
        }
      }
    );
  };

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <div className={styles.searchContainer} ref={searchWrapperRef}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Enter your Business Name/ Address..."
          className={styles.searchInput}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className={styles.suggestionsDropdown}>
            {suggestions.map((s) => (
              <li
                key={s.place_id}
                className={styles.suggestionItem}
                onMouseDown={() => handleSuggestionClick(s)}
              >
                {s.description}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Current Location */}
      <div className={styles.currentLocation}>
        <button onClick={handleCurrentLocation} disabled={locLoading}>
          {locLoading ? "Detecting…" : "Use Current Location"}
        </button>
      </div>

      {/* Map */}
      <div ref={mapRef} className={styles.mapContainer}>
        <div className={styles.mapInstructions}>
          Click anywhere on the map to auto-fill address.
        </div>
      </div>
    </div>
  );
}
