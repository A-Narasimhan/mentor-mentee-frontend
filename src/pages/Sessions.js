import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../context/AuthContext";
import "./Sessions.css";

const STATUS_FILTERS = ["all", "pending", "accepted", "completed", "rejected"];

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isMentor = user && (
    user.role === "mentor" ||
    user.role === "both" ||
    (user.roles && user.roles.includes("mentor"))
  );

  const isBoth = user && (
    user.role === "both" ||
    (user.roles && user.roles.includes("mentor") && user.roles.includes("mentee"))
  );

  useEffect(() => {
    API.get("/api/sessions/my")
      .then((res) => {
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

  const updateStatus = async (e, id, status) => {
    e.stopPropagation();
    try {
      const { data } = await API.put(`/api/sessions/${id}`, { status });
      setSessions((prev) =>
        Array.isArray(prev) ? prev.map((s) => (s._id === id ? data : s)) : []
      );
    } catch (err) {
      alert("Failed to update session: " + (err.response?.data?.message || err.message));
    }
  };

  const filtered = filter === "all"
    ? sessions
    : sessions.filter((s) => s.status === filter);

  const statusColor = (status) => {
    if (status === "accepted") return "#10b981";
    if (status === "completed") return "#7c3aed";
    if (status === "rejected") return "#ef4444";
    return "#f59e0b";
  };

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
            <span className="count">
              {f === "all"
                ? sessions.length
                : sessions.filter((s) => s.status === f).length}
            </span>
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
                navigate(`/mentors/${isMentor ? session.mentee?._id : session.mentor?._id}`)
              }
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{session.title}</h3>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px",
                  borderRadius: 20, background: statusColor(session.status) + "22",
                  color: statusColor(session.status), textTransform: "uppercase",
                }}>
                  {session.status}
                </span>
              </div>

              <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>
                with {isMentor ? session.mentee?.name : session.mentor?.name}
              </p>

              {session.description && (
                <p style={{ fontSize: 13, marginTop: 6, color: "var(--text-dim)" }}>
                  {session.description}
                </p>
              )}

              {session.scheduledAt && (
                <p style={{ fontSize: 12, marginTop: 6, color: "var(--accent)" }}>
                  📅 {new Date(session.scheduledAt).toLocaleString()}
                  {session.duration ? ` • ${session.duration} min` : ""}
                </p>
              )}

              {isMentor && session.status === "pending" && (
                <div
                  style={{ display: "flex", gap: 8, marginTop: 12 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn-primary"
                    style={{ flex: 1, padding: "8px", fontSize: 13 }}
                    onClick={(e) => updateStatus(e, session._id, "accepted")}
                  >
                    ✓ Accept
                  </button>
                  <button
                    className="btn-outline"
                    style={{ flex: 1, padding: "8px", fontSize: 13 }}
                    onClick={(e) => updateStatus(e, session._id, "rejected")}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}

              {isMentor && session.status === "accepted" && (
                <div
                  style={{ marginTop: 12 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn-outline"
                    style={{ width: "100%", padding: "8px", fontSize: 13 }}
                    onClick={(e) => updateStatus(e, session._id, "completed")}
                  >
                    ✓ Mark Complete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}