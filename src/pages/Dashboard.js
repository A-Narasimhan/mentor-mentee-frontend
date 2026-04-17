import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/api/sessions/my").then((res) => {
      setSessions(res.data.slice(0, 5));
      setStats({
        total: res.data.length,
        pending: res.data.filter((s) => s.status === "pending").length,
        completed: res.data.filter((s) => s.status === "completed").length,
      });
    }).finally(() => setLoading(false));
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

      {/* Stats */}
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
        {/* Profile card */}
        <div className="card profile-summary">
          <h3>Your Profile</h3>
          <div className="profile-avatar-big">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="profile-name">{user?.name}</div>
          <div
  className={"role-badge " + (isBoth ? "both" : isMentor ? "mentor" : "mentee")}
  style={{ display: "inline-block", margin: "4px 0 10px" }}
>
  {isBoth ? "Mentor & Mentee" : isMentor ? "Mentor" : "Mentee"}
</div>
          <p className="profile-bio">{user?.bio || "No bio yet."}</p>
          <div className="profile-skills">
            {user?.skills?.slice(0, 5).map((s) => <span key={s} className="tag">{s}</span>)}
          </div>
          <Link to="/profile" className="btn-outline" style={{ display: "block", textAlign: "center", marginTop: 16 }}>
            Edit Profile
          </Link>
        </div>

        {/* Recent Sessions */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Sessions</h3>
            <Link to="/sessions" className="see-all">See all →</Link>
          </div>
          {loading ? <div className="spinner" /> :
            sessions.length === 0 ? (
              <div className="empty-state">
                <span>📭</span>
                <p>No sessions yet</p>
                {isMentee && <Link to="/mentors" className="btn-primary">Find a Mentor</Link>}
              </div>
            ) : (
              <div className="sessions-list">
                {sessions.map((s) => (
                  <div key={s._id} className="session-item"
                    style={{ cursor:"pointer" }}
                    onClick={() => navigate(`/mentors/${isMentor ? s.mentee?._id : s.mentor?._id}`)}>
                    <div className="session-info">
                      <div className="session-title">{s.title}</div>
                      <div className="session-with">
                        with {isMentor ? s.mentee?.name : s.mentor?.name}
                      </div>
                      <div className="session-date">
                        {new Date(s.scheduledAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                    </div>
                    <span className={`status-badge ${s.status}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          {isMentee && (
  <>
    <Link to="/mentors" className="action-card">
      <span>🔍</span>
      <strong>Find Mentors</strong>
      <small>Search by skill or domain</small>
    </Link>
    <Link to="/recommendations" className="action-card">
      <span>✨</span>
      <strong>Smart Match</strong>
      <small>AI-powered recommendations</small>
    </Link>
  </>
)}
          <Link to="/sessions" className="action-card">
            <span>📅</span>
            <strong>Sessions</strong>
            <small>Manage your bookings</small>
          </Link>
          <Link to="/chat" className="action-card">
            <span>💬</span>
            <strong>Messages</strong>
            <small>Chat with your network</small>
          </Link>
        </div>
      </div>
    </div>
  );
}

