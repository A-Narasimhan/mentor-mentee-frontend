import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../context/AuthContext";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/api/sessions/my")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.sessions || res.data.data || [];

        setSessions(data.slice(0, 5));
        setStats({
          total: data.length,
          pending: data.filter((s) => s.status === "pending").length,
          completed: data.filter((s) => s.status === "completed").length,
        });
      })
      .catch((err) => {
        console.error("Error fetching sessions:", err);
        setSessions([]);
      })
      .finally(() => setLoading(false));
  }, []);

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
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="dash-sub">
            {isBoth
              ? "You are both a mentor and a mentee. Switch views below."
              : isMentor
              ? "Here's an overview of your mentoring activity."
              : "Discover mentors and track your learning journey."}
          </p>
        </div>
        {isMentee && (
          <Link to="/recommendations" className="btn-primary" style={{ padding: "12px 24px" }}>
            ✨ Get Matched
          </Link>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div>
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Sessions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div>
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div>
            <div className="stat-number">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div>
            <div className="stat-number">{user?.rating || "—"}</div>
            <div className="stat-label">{isMentor ? "Rating" : "Points"}</div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card profile-summary">
          <h3>Your Profile</h3>
          <div className="profile-avatar-big">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="profile-name">{user?.name}</div>
          <div className={"role-badge " + (isBoth ? "both" : isMentor ? "mentor" : "mentee")}>
            {isBoth ? "Mentor & Mentee" : isMentor ? "Mentor" : "Mentee"}
          </div>
          <p className="profile-bio">{user?.bio || "No bio yet."}</p>
          <div className="profile-skills">
            {Array.isArray(user?.skills) &&
              user.skills.slice(0, 5).map((s) => (
                <span key={s} className="tag">{s}</span>
              ))}
          </div>
          <Link to="/profile" className="btn-outline">Edit Profile</Link>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recent Sessions</h3>
            <Link to="/sessions" className="see-all">See all →</Link>
          </div>
          {loading ? (
            <div className="spinner" />
          ) : sessions.length === 0 ? (
            <div style={{ color: "var(--text-dim)", fontSize: 14, padding: "20px 0" }}>
              No sessions yet.{" "}
              {isMentee && <Link to="/mentors">Find a mentor →</Link>}
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s._id}
                onClick={() => navigate(`/mentors/${isMentor ? s.mentee?._id : s.mentor?._id}`)}
                style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  with {isMentor ? s.mentee?.name : s.mentor?.name} •{" "}
                  <span className={`status-${s.status}`}>{s.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}