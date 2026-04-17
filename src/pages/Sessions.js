import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sessions.css";
import axios from "axios";
const STATUS_FILTERS = ["all", "pending", "accepted", "completed", "rejected"];

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const isMentor = user &&
  (user.role === "mentor" ||
   user.role === "both" ||
   (user.roles && user.roles.includes("mentor")));
 const isBoth =
  user &&
  (user.role === "both" ||
    (user.roles &&
      user.roles.includes("mentor") &&
      user.roles.includes("mentee")));
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/api/sessions/my")
      .then((res) => setSessions(res.data))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    const { data } = await axios.put(`/api/sessions/${id}`, { status });
    setSessions((prev) => prev.map((s) => (s._id === id ? data : s)));
  };

  const filtered = filter === "all" ? sessions : sessions.filter((s) => s.status === filter);

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
          <button key={f} className={`filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "all" && <span className="count">{sessions.length}</span>}
            {f !== "all" && <span className="count">{sessions.filter((s) => s.status === f).length}</span>}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="empty-state" style={{ textAlign: "center", padding: "60px 20px" }}>
          <span style={{ fontSize: 48 }}>📭</span>
          <p style={{ color: "var(--text-dim)", marginTop: 12 }}>No {filter !== "all" ? filter : ""} sessions found.</p>
        </div>
      ) : (
        <div className="sessions-grid">
          {filtered.map((session) => {
            const other =
              session.mentor?._id === user?._id ? session.mentee : session.mentor;
            return (
              <div key={session._id} className="session-card" 
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/mentors/${isMentor ? session.mentee?._id : session.mentor?._id}`)}>
                <div className="session-card-header">
                  <div>
                    <h3 className="session-card-title">{session.title}</h3>
                    <div className="session-card-with">
  {session.mentor?._id === user?._id
    ? "👤 Mentee:"
    : "🏆 Mentor:"}{" "}
  <strong>
    {session.mentor?._id === user?._id
      ? session.mentee?.name
      : session.mentor?.name}
  </strong>
</div>
                  </div>
                  <span className={`status-badge ${session.status}`}>{session.status}</span>
                </div>

                {session.description && (
                  <p className="session-desc">{session.description}</p>
                )}

                <div className="session-meta">
                  <div className="meta-item">
                    <span>📅</span>
                    {new Date(session.scheduledAt).toLocaleDateString("en-IN", {
                      weekday: "short", day: "numeric", month: "short", year: "numeric"
                    })}
                  </div>
                  <div className="meta-item">
                    <span>🕐</span>
                    {new Date(session.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="meta-item">
                    <span>⏱</span>
                    {session.duration} min
                  </div>
                </div>

                {session.meetLink && (
                  <a href={session.meetLink} target="_blank" rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="btn-primary" style={{ display: "block", textAlign: "center", marginTop: 10 }}>
                    🎥 Join Meeting
                  </a>
                )}
                <div style={{ display:"flex", gap:8, marginTop:10 }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn-outline" style={{ flex:1 }}
                    onClick={() => navigate(`/mentors/${isMentor ? session.mentee?._id : session.mentor?._id}`)}>
                    👤 View Profile
                  </button>
                  <button className="btn-outline" style={{ padding:"10px 16px" }}
                    onClick={() => navigate(`/chat/${isMentor ? session.mentee?._id : session.mentor?._id}`)}>
                    💬 Chat
                  </button>
                </div>

                {/* Mentor actions */}
                {session.mentor?._id === user?._id && session.status === "pending" && (
                  <div className="session-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-accept" onClick={() => updateStatus(session._id, "accepted")}>✅ Accept</button>
                    <button className="btn-reject" onClick={() => updateStatus(session._id, "rejected")}>❌ Reject</button>
                  </div>
                )}

                {session.mentor?._id === user?._id && session.status === "accepted" && (
                  <button className="btn-primary" style={{ width: "100%", marginTop: 10 }}
                    onClick={(e) => { e.stopPropagation(); updateStatus(session._id, "completed"); }}>
                    Mark as Completed ✓
                   </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
