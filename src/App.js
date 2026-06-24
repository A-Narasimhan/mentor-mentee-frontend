import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MentorsList from "./pages/MentorsList";
import MentorProfile from "./pages/MentorProfile";
import Chat from "./pages/Chat";
import Sessions from "./pages/Sessions";
import Profile from "./pages/Profile";
import Recommendations from "./pages/Recommendations";


function ThemeInitializer() {
  const { user } = useAuth();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem("theme");
      
      if (!saved) {
        setTheme("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      }
    }
  }, [user]);

  useEffect(() => {
    window.__setTheme = setTheme;
    window.__getTheme = () => theme;
    return () => {
      delete window.__setTheme;
      delete window.__getTheme;
    };
  }, [theme]);

  return null;
}


const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  return !user ? children : <Navigate to="/dashboard" />;
};

export default function App() {
  return (
    <BrowserRouter>
      {}
      <ThemeInitializer />
      {}
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Navbar /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="mentors" element={<MentorsList />} />
          <Route path="mentors/:id" element={<MentorProfile />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:userId" element={<Chat />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}