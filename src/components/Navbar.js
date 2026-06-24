import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setThemeLocal] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    window.__setTheme = (t) => {
      setThemeLocal(t);
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("theme", t);
    };
    window.__getTheme = () => theme;
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    window.__setTheme?.(next);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isMentor = user &&
    (user.role === "mentor" ||
     user.role === "both" ||
     (user.roles && user.roles.includes("mentor")));

  const isMentee = user &&
    (user.role === "mentee" ||
     user.role === "both" ||
     (user.roles && user.roles.includes("mentee")));

  const isBoth = isMentor && isMentee;

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">MentorMatch</span>
        </div>

        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
          {isMentee && (
            <>
              <NavLink to="/mentors" onClick={() => setMenuOpen(false)}>Find Mentors</NavLink>
              <NavLink to="/recommendations" onClick={() => setMenuOpen(false)}>For You 🔍</NavLink>
            </>
          )}
          <NavLink to="/sessions" onClick={() => setMenuOpen(false)}>Sessions</NavLink>
          <NavLink to="/chat" onClick={() => setMenuOpen(false)}>Messages</NavLink>
          <NavLink to="/profile" onClick={() => setMenuOpen(false)}>Profile</NavLink>
        </div>

        <div className="nav-right">
          <div className="nav-user">
            <div className="avatar-circle">{user?.name?.[0]?.toUpperCase()}</div>
            <span className="nav-username">{user?.name?.split(" ")[0]}</span>
            <span className={"role-badge " + (isBoth ? "both" : isMentor ? "mentor" : "mentee")}
              style={{ fontSize: 11 }}>
              {isBoth ? "Mentor & Mentee" : isMentor ? "Mentor" : "Mentee"}
            </span>
          </div>

          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="theme-toggle"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button className="btn-outline logout-btn" onClick={handleLogout}>Logout</button>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}