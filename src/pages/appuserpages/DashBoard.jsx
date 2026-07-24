import React, { useEffect, useState, useCallback } from "react";
import styles from "./DashBoard.module.css";
import { getAllPartners } from "../../api/userService";
import { getUserDetails } from "../../api/userService";
import { reverseGeocode } from "../../api/authService";
import PartnersList from "../../components/usercomponent/PartnersList";
import SearchAddress from "../../components/usercomponent/SearchAddress";
import { useNavigate, useLocation } from "react-router-dom";

// â”€â”€ Category config with emojis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALL_CATEGORIES = [
  "All",
  "Hospital",
  "Beauty & Spa",
  "Restaurant",
  "Clinic",
  "Gym",
];

const CATEGORY_ICONS = {
  All: "â­",
  Hospital: "ðŸ¥",
  "Beauty & Spa": "ðŸ’†",
  Restaurant: "ðŸ½ï¸",
  Clinic: "ðŸ©º",
  Gym: "ðŸ’ª",
};

// â”€â”€ Greeting by time of day â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function DashBoard() {
  const [allPartners, setAllPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationClicked, setLocationClicked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [userName, setUserName] = useState("");
  const [showGreeting, setShowGreeting] = useState(false);

  // The selected location lives in sessionStorage so a refresh within the tab
  // remembers it, but it never persists beyond the session (per "only the JWT
  // token may live in localStorage" rule).
  const [userAddress, setUserAddress] = useState(() => {
    try {
      const raw = sessionStorage.getItem("userAddress");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();

  // â”€â”€ Fetch user name â”€â”€
  useEffect(() => {
    getUserDetails()
      .then((res) => {
        const profile = res.data?.data?.profile;
        if (profile?.firstName) {
          setUserName(profile.firstName.toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!location.state?.showGreeting) {
      setShowGreeting(false);
      return undefined;
    }

    setShowGreeting(true);
    const hideGreetingTimer = window.setTimeout(() => {
      setShowGreeting(false);
    }, 2400);

    return () => window.clearTimeout(hideGreetingTimer);
  }, [location.state]);

  // â”€â”€ Geolocation â”€â”€
  const handleLocationSearch = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const data = await reverseGeocode(latitude, longitude);
          if (data.status === "OK" && data.results.length > 0) {
            const components = data.results[0].address_components;
            const getComponent = (type) =>
              components.find((c) => c.types.includes(type))?.long_name || "";
            const country = getComponent("country");
            const state = getComponent("administrative_area_level_1");
            const city =
              getComponent("locality") ||
              getComponent("administrative_area_level_2") ||
              getComponent("sublocality") ||
              "";
            setUserAddress({ country, state, city });
            try {
              sessionStorage.setItem(
                "userAddress",
                JSON.stringify({ country, state, city }),
              );
            } catch {
              /* ignore storage errors */
            }
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
        }
      },
      (error) => console.error("Geolocation error:", error),
    );
  }, []);

  // â”€â”€ Fetch partners â”€â”€
  useEffect(() => {
    if (userAddress === null) {
      handleLocationSearch();
    }

    async function fetchPartners() {
      setIsLoading(true);
      try {
        const response = await getAllPartners(userAddress);
        const allPartnerUsers = response.data?.data?.allPartnerUsers;
        setAllPartners(
          Array.isArray(allPartnerUsers)
            ? allPartnerUsers.map((p) => ({
                id: p.id || p.partnerId,
                partnerId: p.id || p.partnerId,
                name: p.businessName,
                type: p.businessType,
                address: [
                  p.buildingNo,
                  p.street,
                  p.city,
                  p.state,
                  p.zipCode,
                  p.country,
                ]
                  .filter(Boolean)
                  .join(", "),
                buildingNo: p.buildingNo,
                street: p.street,
                city: p.city,
                state: p.state,
                isVerified: p.isVerified,
                status: p.status,
                propertyCount: p.propertyCount ?? 0,
                serviceCount: p.serviceCount ?? 0,
              }))
            : [],
        );
      } catch (error) {
        console.error("Error fetching partners:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPartners();
  }, [userAddress, handleLocationSearch]);

  // â”€â”€ Location handlers â”€â”€
  const handleLocationClicked = () => setLocationClicked(!locationClicked);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const data = await reverseGeocode(latitude, longitude);
          if (data.status === "OK" && data.results.length > 0) {
            const components = data.results[0].address_components;
            const getComponent = (type) =>
              components.find((c) => c.types.includes(type))?.long_name || "";
            const country = getComponent("country");
            const state = getComponent("administrative_area_level_1");
            const city =
              getComponent("locality") ||
              getComponent("administrative_area_level_2") ||
              getComponent("sublocality") ||
              "";
            const selectedAddress = { country, state, city };
            setUserAddress(selectedAddress);
            try {
              sessionStorage.setItem(
                "userAddress",
                JSON.stringify(selectedAddress),
              );
            } catch {
              /* ignore storage errors */
            }
            setLocationClicked(false);
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
        }
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleAddressSelected = (selectedAddress) => {
    setUserAddress(selectedAddress);
    try {
      sessionStorage.setItem("userAddress", JSON.stringify(selectedAddress));
    } catch {
      /* ignore storage errors */
    }
    setLocationClicked(false);
  };

  // â”€â”€ Derived categories (only show what's available in area) â”€â”€
  const availableCategories = ALL_CATEGORIES.filter((cat) => {
    if (cat === "All") return true;
    return allPartners.some(
      (p) =>
        p.type?.toLowerCase().includes(cat.toLowerCase()) ||
        p.name?.toLowerCase().includes(cat.toLowerCase()),
    );
  });

  const activeCategory = availableCategories.includes(selectedCategory)
    ? selectedCategory
    : "All";

  // â”€â”€ Filter partners â”€â”€
  const filteredPartners = allPartners.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q);

    const matchesCategory =
      activeCategory === "All" ||
      p.type?.toLowerCase().includes(activeCategory.toLowerCase()) ||
      p.name?.toLowerCase().includes(activeCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <UserLayout
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      userAddress={userAddress}
      onLocationClick={handleLocationClicked}
    >
      {locationClicked ? (
        <SearchAddress
          onBackClicked={handleLocationClicked}
          onAddressSelected={handleAddressSelected}
          onUseCurrentLocation={handleUseCurrentLocation}
        />
      ) : (
        <>
          {showGreeting && (
            <div className={styles.greeting}>
              <h1>
                {getGreeting()}
                {userName ? `, ${userName}` : ""}
              </h1>
              <p className={styles.greetingSubtitle}>Welcome back</p>
            </div>
          )}

          {/* Category chips with emojis */}
          <div
            className={styles.categoriesSection}
            role="group"
            aria-label="Filter by category"
          >
            {availableCategories.map((cat) => (
              <button
                key={cat}
                className={`${styles.categoryChip} ${activeCategory === cat ? styles.categoryChipActive : ""}`}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={activeCategory === cat}
              >
                <span className={styles.chipEmoji}>{CATEGORY_ICONS[cat]}</span>
                <span className={styles.chipLabel}>{cat}</span>
              </button>
            ))}
          </div>

          {/* Partners list */}
          <PartnersList
            partners={filteredPartners}
            isLoading={isLoading}
            totalCount={allPartners.length}
            searchQuery={searchQuery}
            selectedCategory={activeCategory}
            userAddress={userAddress}
          />
        </>
      )}
        </UserLayout>
  );
}
