import { useEffect } from "react";
import api from "../api";
import { useState } from "react";

import { useNavigate } from "react-router-dom";

export default function DashBoard() {
  const [data, setData] = useState([]);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (token) {
        try {
          const response = await api.get("/Appointments/AllUsers", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          setData(response.data);
        } catch (error) {
          if (error.message === "Request failed with status code 401")
            if (error.message === "Request failed with status code 401") {
              alert("Session Expired, Please Login again");
              navigate("/login");
            } else {
              alert(
                "An error occurred while fetching data. Please try again later."
              );
              navigate("/login");
            }
          navigate("/login");
        }
      }
    };
    fetchData();
  }, [navigate, token]);

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
