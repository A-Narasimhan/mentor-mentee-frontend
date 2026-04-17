import axios from "axios";
import React, { createContext, useState, useContext, useEffect } from "react";

const API = axios.create({
  baseURL: "https://mentor-backend-8zgn.onrender.com",
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    sessionStorage.getItem("token") || localStorage.getItem("token")
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeToken =
      sessionStorage.getItem("token") || localStorage.getItem("token");

    if (activeToken) {
      sessionStorage.setItem("token", activeToken);

      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${activeToken}`;

      API.get("/api/users/me")
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const { data } = await API.post("/api/auth/login", {
      email,
      password,
    });

    sessionStorage.setItem("token", data.token);
    localStorage.setItem("token", data.token);

    API.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${data.token}`;

    setToken(data.token);

    // FIXED HERE
    setUser(data);

    return data;
  };

  const register = async (formData) => {
    const { data } = await API.post("/api/auth/register", formData);

    sessionStorage.setItem("token", data.token);
    localStorage.setItem("token", data.token);

    API.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${data.token}`;

    setToken(data.token);

    // FIXED HERE
    setUser(data);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    delete API.defaults.headers.common["Authorization"];

    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) =>
    setUser((prev) => ({ ...prev, ...updatedData }));

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
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isMentor,
        isMentee,
        isBoth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);