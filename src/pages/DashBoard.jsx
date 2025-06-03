import React, { useState, useEffect } from "react";
import axios from "axios";

export default function DashBoard() {
  const [data, setData] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get("/Appointments/AllUsers", {
          baseURL: "https://api.timesetandbook.com",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setData(response.data);
      } catch (error) {
        console.error("API request failed:", error);
      }
    }

    if (token) {
      fetchData();
    }
  }, [token]); // Run effect when token changes

  if (!token) {
    return <div>Please log in.</div>;
  }

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>hello</div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
