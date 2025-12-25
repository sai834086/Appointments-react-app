import React, { useEffect, useState } from "react";
import styles from "./DashBoard.module.css";
import { getAllPartners } from "../../api/userService";
import { reverseGeocode } from "../../api/authService";
import DashboardHeader from "../../components/usercomponent/DashBoardHeader";
import DashboardSearch from "../../components/usercomponent/DashBoardSearch";
import DashBoardLocation from "../../components/usercomponent/DashBoardLocation";
import PartnersList from "../../components/usercomponent/PartnersList";
import Footer from "../../components/usercomponent/Footer";
import { useCallback } from "react";
import SearchAddress from "../../components/usercomponent/SearchAddress";

export default function DashBoard() {
  const [allPartners, setAllPartners] = useState([]);
  const [locationClicked, setLocationClicked] = useState(false);

  const [userAddress, setUserAddress] = useState(
    localStorage.getItem("userAddress")
      ? JSON.parse(localStorage.getItem("userAddress"))
      : null
  );
  const handleLocationSearch = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
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
            localStorage.setItem(
              "userAddress",
              JSON.stringify({ country, state, city })
            );
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          alert("Unable to retrieve your location. Please try again.");
        }
      },
      (error) => {
        alert(
          "Unable to retrieve your location. Please allow location access."
        );
        console.error("Geolocation error:", error);
      }
    );
  }, [setUserAddress]);

  useEffect(() => {
    if (userAddress === null) {
      handleLocationSearch();
    }

    async function fetchPartners() {
      try {
        const response = await getAllPartners(userAddress);
        const data = response.data;

        const allPartnerUsers = data?.data?.allPartnerUsers;
        setAllPartners(
          Array.isArray(allPartnerUsers)
            ? allPartnerUsers.map((p) => ({
                id: p.partnerId,
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
                isVerified: p.isVerified,
                status: p.status,
              }))
            : []
        );
      } catch (error) {
        console.error("Error fetching partners:", error);
      }
    }
    fetchPartners();
  }, [userAddress, handleLocationSearch]);

  const handleLocationClicked = () => {
    setLocationClicked(!locationClicked);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
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
            localStorage.setItem(
              "userAddress",
              JSON.stringify(selectedAddress)
            );
            setLocationClicked(false); // Go back to main dashboard
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          alert("Unable to retrieve your location. Please try again.");
        }
      },
      (error) => {
        alert(
          "Unable to retrieve your location. Please allow location access."
        );
        console.error("Geolocation error:", error);
      }
    );
  };

  const handleAddressSelected = (selectedAddress) => {
    console.log("Selected address from SearchAddress:", selectedAddress);

    setUserAddress(selectedAddress);
    localStorage.setItem("userAddress", JSON.stringify(selectedAddress));
    setLocationClicked(false); // Go back to main dashboard
  };
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerContainer}>
        {/* Header Section */}
        <DashboardHeader />
      </div>

      <div className={styles.headBodyContainer}>
        <div className={styles.bodyContainer}>
          {/* Address Search Section */}
          {locationClicked ? (
            <SearchAddress
              onBackClicked={handleLocationClicked}
              onAddressSelected={handleAddressSelected}
              onUseCurrentLocation={handleUseCurrentLocation}
            />
          ) : (
            <>
              {/* Location Section */}
              <DashBoardLocation
                userAddress={userAddress}
                onLocationClicked={handleLocationClicked}
              />
              {/* Search Section */}
              <DashboardSearch />

              {/* Partners List Section */}
              <PartnersList partners={allPartners} />
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
