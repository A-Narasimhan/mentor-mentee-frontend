import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../context/AuthContext";
import "./MentorsList.css";

const DOMAINS = ["Web Dev", "Data Science", "ML/AI", "Mobile", "Design", "DevOps", "Cloud", "Blockchain"];
const LEVELS = ["beginner", "intermediate", "advanced", "expert"];

export default function MentorsList() {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [matchScores, setMatchScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", skill: "", domain: "", experience: "" });

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.skill) params.skill = filters.skill;
      if (filters.domain) params.domain = filters.domain;
      if (filters.experience) params.experience = filters.experience;

      const res = await API.get("/api/users/mentors", { params });
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.mentors || res.data.data || [];
      setMentors(data);

      const isMentee = user && (
        user.role === "mentee" ||
        user.role === "both" ||
        (user.roles && user.roles.includes("mentee"))
      );

      if (isMentee) {
        try {
          const matchRes = await API.get("/api/match/recommendations");
          const matchData = Array.isArray(matchRes.data)
            ? matchRes.data
            : matchRes.data.matches || matchRes.data.data || [];

          const scoreMap = {};
          matchData.forEach((item) => {
            if (item?.mentor?._id) {
              scoreMap[item.mentor._id] = item.matchPercent ?? Math.min(Math.round(item.score * 8), 100);
            }
          });
          setMatchScores(scoreMap);
        } catch {
          console.log("Match scores not available");
        }
      }
    } catch (err) {
      console.error("Error fetching mentors:", err);
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [filters]);

  const clearFilters = () =>
    setFilters({ search: "", skill: "", domain: "", experience: "" });

  return (
    <div className="mentors-page">
      <div className="page-header">
        <h1>Find Mentors</h1>
        <p>Connect with experienced professionals in your field</p>
      </div>

      <div className="search-bar">
        <input
          placeholder="🔍  Search by name..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <input
          placeholder="Skill (e.g. React)"
          value={filters.skill}
          onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
        />
        <select
          value={filters.domain}
          onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
        >
          <option value="">All Domains</option>
          {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={filters.experience}
          onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
        >
          <option value="">All Levels</option>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <button className="btn-outline" onClick={clearFilters}>Clear</button>
      </div>

      <div className="results-info">
        {mentors.length} mentor{mentors.length !== 1 ? "s" : ""} found
      </div>

      {loading ? (
        <div className="spinner" />
      ) : mentors.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <span style={{ fontSize: 48 }}>🔍</span>
          <p style={{ color: "var(--text-dim)", marginTop: 12 }}>
            No mentors found. Try different filters.
          </p>
        </div>
      ) : (
        <div className="mentors-grid">
          {mentors.map((mentor) => (
            <div key={mentor._id} className="mentor-card">
              <div className="mentor-card-top">
                <div className="mentor-avatar">
                  {mentor?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="mentor-name">{mentor?.name}</div>
                  <div className="mentor-domain">{mentor?.domain || "General"}</div>
                  <div className="mentor-level badge">{mentor?.experienceLevel}</div>
                </div>
              </div>

              {mentor?.rating > 0 && (
                <div className="mentor-rating">
                  <span className="stars">{"★".repeat(Math.round(mentor.rating))}</span>
                  <span>{mentor.rating}</span>
                </div>
              )}

              {matchScores[mentor._id] !== undefined && (
                <div style={{
                  fontSize: 12, fontWeight: 600, marginTop: 6,
                  color: matchScores[mentor._id] >= 70 ? "#10b981"
                    : matchScores[mentor._id] >= 40 ? "#f59e0b" : "#ef4444"
                }}>
                  {matchScores[mentor._id]}% match
                </div>
              )}

              <p className="mentor-bio">
                {mentor?.bio || "Experienced mentor ready to help."}
              </p>

              <div className="mentor-skills">
                {Array.isArray(mentor?.skills) &&
                  mentor.skills.slice(0, 4).map((s) => (
                    <span key={s} className="tag">{s}</span>
                  ))}
              </div>

              <div className="mentor-actions">
                <Link to={`/mentors/${mentor._id}`} className="btn-primary">
                  View Profile
                </Link>
                <Link to={`/chat/${mentor._id}`} className="btn-outline">💬</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}