import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    sessionStorage.getItem("token") || localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  axios.defaults.baseURL = "https://mentor-backend-8zgn.onrender.comocalhost:5000";

 useEffect(() => {
    // Use sessionStorage token first (tab-specific), fall back to localStorage
    const activeToken = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (activeToken) {
      // Store in sessionStorage for this tab
      sessionStorage.setItem("token", activeToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${activeToken}`;
      axios.get("/api/users/me")
        .then((res) => setUser(res.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const { data } = await axios.post("/api/auth/login", { email, password });
    sessionStorage.setItem("token", data.token);
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const { data } = await axios.post("/api/auth/register", formData);
    sessionStorage.setItem("token", data.token);
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => setUser((prev) => ({ ...prev, ...updatedData }));

// Helper functions for role checking
const isMentor = user
  ? user.role === "mentor" ||
    user.role === "both" ||
    (user.roles && user.roles.includes("mentor"))
  : false;

const isMentee = user
  ? user.role === "mentee" ||
    user.role === "both" ||
    (user.roles && user.roles.includes("mentee"))
  : false;

const isBoth = isMentor && isMentee;

return (
  <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isMentor, isMentee, isBoth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
