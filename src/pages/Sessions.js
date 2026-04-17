import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sessions.css";
import axios from "axios";

// ✅ API instance
const API = axios.create({
  baseURL: "https://mentor-backend-8zgn.onrender.com"
});

// ✅ Attach token
API.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const STATUS_FILTERS = ["all", "pending", "accepted", "completed", "rejected"];

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isMentor =
    user &&
    (user.role === "mentor" ||
      user.role === "both" ||
      (user.roles && user.roles.includes("mentor")));

  const isBoth =
    user &&
    (user.role === "both" ||
      (user.roles &&
        user.roles.includes("mentor") &&
        user.roles.includes("mentee")));

  useEffect(() => {
    API.get("/api/sessions/my")
      .then((res) => {
        console.log("SESSIONS RESPONSE:", res.data);

        // ✅ SAFE DATA EXTRACTION
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.sessions || res.data.data || [];

        setSessions(data);
      })
      .catch((err) => {
        console.error("Error fetching sessions:", err);
        setSessions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    const { data } = await API.put(`/api/sessions/${id}`, { status });

    setSessions((prev) =>
      Array.isArray(prev)
        ? prev.map((s) => (s._id === id ? data : s))
        : []
    );
  };

  // ✅ SAFE FILTER
  const filtered =
    filter === "all"
      ? sessions
      : Array.isArray(sessions)
      ? sessions.filter((s) => s.status === filter)
      : [];

  return (
    <div className="sessions-page">
      <div className="page-header">
        <h1>Sessions</h1>
        <p>
          {isBoth
            ? "View sessions as both mentor and mentee"
            : isMentor
            ? "Manage mentoring requests and sessions"
            : "Track your booked sessions"}
        </p>
      </div>

      <div className="filter-tabs">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}

            {f === "all" && (
              <span className="count">
                {Array.isArray(sessions) ? sessions.length : 0}
              </span>
            )}

            {f !== "all" && (
              <span className="count">
                {Array.isArray(sessions)
                  ? sessions.filter((s) => s.status === f).length
                  : 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <span style={{ fontSize: 48 }}>📭</span>
          <p style={{ color: "var(--text-dim)", marginTop: 12 }}>
            No {filter !== "all" ? filter : ""} sessions found.
          </p>
        </div>
      ) : (
        <div className="sessions-grid">
          {filtered.map((session) => (
            <div
              key={session._id}
              className="session-card"
              onClick={() =>
                navigate(
                  `/mentors/${
                    isMentor
                      ? session.mentee?._id
                      : session.mentor?._id
                  }`
                )
              }
            >
              <h3>{session.title}</h3>
              <p>
                with{" "}
                {isMentor
                  ? session.mentee?.name
                  : session.mentor?.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}