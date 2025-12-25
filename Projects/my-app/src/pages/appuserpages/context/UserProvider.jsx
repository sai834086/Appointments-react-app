import { useState } from "react";
import { UserContext } from "./UserContext";

export const UserProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };
  return (
    <UserContext.Provider value={{ token, login }}>
      {children}
    </UserContext.Provider>
  );
};
