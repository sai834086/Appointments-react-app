import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  getAllServicesByPartner,
  getEmployeesForService,
} from "../../api/userService";
import DashBoardHeader from "../../components/usercomponent/DashBoardHeader";
import Footer from "../../components/usercomponent/Footer";
import styles from "./ServicesPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faTimes } from "@fortawesome/free-solid-svg-icons";

const ServicesPage = () => {
  const location = useLocation();
  const partnerId = location.state?.partnerId;
  const propertyId = location.state?.propertyId;
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllServicesByPartner(partnerId);
        const data = response.data.data;

        // Transform the data to match our structure
        if (data && typeof data === "object") {
          const servicesArray = [];
          Object.entries(data).forEach(([propertyName, servicesList]) => {
            if (Array.isArray(servicesList)) {
              servicesList.forEach((service) => {
                servicesArray.push({
                  ...service,
                  propertyName: propertyName,
                });
              });
            }
          });
          setServices(servicesArray);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to load services. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (partnerId) {
      fetchServices();
    }
  }, [partnerId]);

  // Handle Select button click - Fetch employees for service
  const handleSelectService = async (service) => {
    setSelectedService(service);
    setLoadingEmployees(true);
    try {
      console.log("Selected service:", service);
      console.log(
        "Property ID:",
        propertyId,
        "Service ID:",
        service.id || service.serviceId
      );

      if (!propertyId) {
        console.error("Property ID not found");
        setEmployees([]);
        setLoadingEmployees(false);
        return;
      }

      const serviceId = service.id || service.serviceId;
      const response = await getEmployeesForService(propertyId, serviceId);
      console.log("Employees response:", response);
      setEmployees(response.data.data.allEmployees || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Get unique properties for filter
  const uniqueProperties = useMemo(() => {
    return [...new Set(services.map((s) => s.propertyName))].sort();
  }, [services]);

  // Filter services based on property selection
  const filteredServices = useMemo(() => {
    if (!propertyFilter) {
      return services;
    }
    return services.filter(
      (service) => service.propertyName === propertyFilter
    );
  }, [services, propertyFilter]);

  // Group services by property name
  const servicesByProperty = useMemo(() => {
    const grouped = {};
    filteredServices.forEach((service) => {
      if (!grouped[service.propertyName]) {
        grouped[service.propertyName] = [];
      }
      grouped[service.propertyName].push(service);
    });
    return grouped;
  }, [filteredServices]);

  if (!partnerId) {
    return (
      <div className={styles.mainContainer}>
        <DashBoardHeader />
        <div className={styles.pageWrapper}>
          <div className={styles.errorMsg}>No partner selected.</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <DashBoardHeader />
      <div className={styles.pageWrapper}>
        {/* Desktop Sidebar Filter */}
        <aside className={styles.sidebar}>
          <div className={styles.filterBox}>
            <h3 className={styles.filterTitle}>Filter</h3>
            <div className={styles.filterOptions}>
              <button
                onClick={() => setPropertyFilter("")}
                className={`${styles.filterBtn} ${
                  propertyFilter === "" ? styles.active : ""
                }`}
              >
                <span>All Services</span>
                <span className={styles.badge}>{services.length}</span>
              </button>
              {uniqueProperties.map((property) => (
                <button
                  key={property}
                  onClick={() => setPropertyFilter(property)}
                  className={`${styles.filterBtn} ${
                    propertyFilter === property ? styles.active : ""
                  }`}
                >
                  <span>{property}</span>
                  <span className={styles.badge}>
                    {services.filter((s) => s.propertyName === property).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.content}>
          <div className={styles.contentHeader}>
            <h1 className={styles.title}>Available Services</h1>
            <button
              className={styles.mobileFilterToggle}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              title="Filter services"
            >
              <FontAwesomeIcon icon={faFilter} />
            </button>
          </div>

          {/* Mobile Filter Menu */}
          {showFilterMenu && (
            <div className={styles.mobileFilterOverlay}>
              <div className={styles.mobileFilterContent}>
                <div className={styles.mobileFilterTop}>
                  <h3>Filter by Property</h3>
                  <button
                    onClick={() => setShowFilterMenu(false)}
                    className={styles.closeFilterBtn}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <div className={styles.mobileFilterList}>
                  <button
                    onClick={() => {
                      setPropertyFilter("");
                      setShowFilterMenu(false);
                    }}
                    className={`${styles.mobileFilterBtn} ${
                      propertyFilter === "" ? styles.active : ""
                    }`}
                  >
                    All Services ({services.length})
                  </button>
                  {uniqueProperties.map((property) => (
                    <button
                      key={property}
                      onClick={() => {
                        setPropertyFilter(property);
                        setShowFilterMenu(false);
                      }}
                      className={`${styles.mobileFilterBtn} ${
                        propertyFilter === property ? styles.active : ""
                      }`}
                    >
                      {property} (
                      {
                        services.filter((s) => s.propertyName === property)
                          .length
                      }
                      )
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Services List */}
          {loading && (
            <div className={styles.loading}>
              <p>Loading services...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && services.length === 0 && (
            <div className={styles.empty}>
              <p>No services available</p>
            </div>
          )}

          {!loading && !error && services.length > 0 && (
            <div className={styles.servicesList}>
              {Object.entries(servicesByProperty).map(
                ([propertyName, propertyServices]) => (
                  <section key={propertyName} className={styles.propertyGroup}>
                    <h2 className={styles.propertyTitle}>{propertyName}</h2>
                    <div className={styles.servicesGrid}>
                      {propertyServices.map((service, idx) => (
                        <div
                          key={service.id || idx}
                          className={styles.serviceCard}
                        >
                          <div className={styles.cardHeader}>
                            <div>
                              <h3 className={styles.serviceName}>
                                {service.name || service.serviceName}
                              </h3>
                              {service.category && (
                                <p className={styles.category}>
                                  {service.category}
                                </p>
                              )}
                            </div>
                            {service.serviceFee || service.price ? (
                              <div className={styles.priceTag}>
                                $
                                {parseFloat(
                                  service.serviceFee || service.price
                                ).toFixed(2)}
                              </div>
                            ) : null}
                          </div>

                          <div className={styles.cardMeta}>
                            <div className={styles.metaContent}>
                              {service.eachServiceTimeInMinus ||
                              service.duration ? (
                                <span className={styles.meta}>
                                  <span className={styles.metaIcon}>⏱️</span>
                                  <span>
                                    {service.eachServiceTimeInMinus ||
                                      service.duration}{" "}
                                    mins
                                  </span>
                                </span>
                              ) : null}
                              {service.employeeName && (
                                <span className={styles.meta}>
                                  <span className={styles.metaIcon}>👤</span>
                                  <span>{service.employeeName}</span>
                                </span>
                              )}
                              {service.status && (
                                <span className={styles.meta}>
                                  <span className={styles.metaIcon}>📊</span>
                                  <span className={styles.badge}>
                                    {service.status}
                                  </span>
                                </span>
                              )}
                            </div>
                            <button
                              className={styles.selectBtn}
                              onClick={() => handleSelectService(service)}
                            >
                              Select
                            </button>
                          </div>

                          {service.description && (
                            <div className={styles.cardDescription}>
                              <div className={styles.descriptionRow}>
                                <p className={styles.descriptionText}>
                                  {service.description.length > 80
                                    ? `${service.description.substring(
                                        0,
                                        80
                                      )}...`
                                    : service.description}
                                </p>
                                <button
                                  className={styles.readMoreBtn}
                                  onClick={() =>
                                    setSelectedDescription(service.description)
                                  }
                                >
                                  Read More
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )
              )}
            </div>
          )}
        </main>
      </div>

      {/* Description Modal */}
      {selectedDescription && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Service Description</h2>
              <button
                className={styles.modalClose}
                onClick={() => setSelectedDescription(null)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>{selectedDescription}</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalButton}
                onClick={() => setSelectedDescription(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employees Modal */}
      {selectedService && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Select Employee</h2>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setSelectedService(null);
                  setEmployees([]);
                }}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {loadingEmployees ? (
                <p>Loading employees...</p>
              ) : employees.length > 0 ? (
                <div className={styles.employeesList}>
                  {employees.map((employee) => (
                    <div key={employee.id} className={styles.employeeItem}>
                      <div className={styles.employeeInfo}>
                        <h3>{employee.employeeName || employee.name}</h3>
                        {employee.email && <p>{employee.email}</p>}
                        {employee.phone && <p>{employee.phone}</p>}
                      </div>
                      <button className={styles.bookBtn}>
                        Book with {employee.employeeName || employee.name}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No employees available for this service</p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalButton}
                onClick={() => {
                  setSelectedService(null);
                  setEmployees([]);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
