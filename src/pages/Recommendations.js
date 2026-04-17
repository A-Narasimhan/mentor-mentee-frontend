import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Recommendations.css";
import axios from "axios";

// ✅ Proper API instance
const API = axios.create({
  baseURL: "https://mentor-backend-8zgn.onrender.com"
});

// ✅ ADD THIS RIGHT HERE
API.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default function Recommendations() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/api/match/recommendations")   // ✅ FIXED
      .then((res) => {
        console.log("RESPONSE:", res.data); // 🔍 debug

        // ✅ SAFE DATA EXTRACTION
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.matches || res.data.data || [];

        setMatches(data);
      })
      .catch((err) => {
        console.error("Error fetching recommendations:", err);
        setMatches([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="reco-page">
      <div className="reco-header">
        <h1>✨ Smart Matches For You</h1>
        <p>AI-powered mentor recommendations based on your skills, interests, and experience</p>
      </div>

      <div className="algo-info card">
        <div className="algo-icon">🧠</div>
        <div>
          <strong>How matching works</strong>
          <p>Score = (Common Skills × 2) + Interest Match + Experience Gap + Rating Bonus</p>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : matches.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: 48 }}>🤔</p>
          <p style={{ color: "var(--text-dim)", marginTop: 12 }}>
            No mentors available right now. Check back soon!
          </p>
        </div>
      ) : (
        <div className="reco-list">
          {matches.map(({ mentor, score, commonSkills = [], commonInterests = [] }, idx) => (
            <div key={mentor?._id || idx} className="reco-card">
              <div className="reco-rank">#{idx + 1}</div>

              <div className="reco-mentor-info">
                <div className="mentor-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
                  {mentor?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="reco-name">{mentor?.name}</div>
                  <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
                    {mentor?.domain || "General"} • {mentor?.experienceLevel}
                  </div>
                  {mentor?.rating > 0 && (
                    <div className="stars" style={{ fontSize: 13 }}>
                      {"★".repeat(Math.round(mentor.rating))} {mentor.rating}
                    </div>
                  )}
                </div>
              </div>

              <div className="reco-score-bar">
                <div className="score-label">Match Score</div>
                <div className="score-track">
                  <div
                    className="score-fill"
                    style={{
                      width: Math.min(score * 8, 100) + "%",
                      background:
                        score >= 10
                          ? "#10b981"
                          : score >= 6
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  />
                </div>
                <div
                  className="score-number"
                  style={{
                    color:
                      score >= 10
                        ? "#10b981"
                        : score >= 6
                        ? "#f59e0b"
                        : "#ef4444",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {Math.min(Math.round(score * 8), 100)}%
                </div>
              </div>

              <div className="reco-matches">
                {commonSkills.length > 0 && (
                  <div className="match-group">
                    <span className="match-label">Common Skills</span>
                    <div>
                      {commonSkills.map((s) => (
                        <span key={s} className="tag">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {commonInterests.length > 0 && (
                  <div className="match-group">
                    <span className="match-label">Shared Interests</span>
                    <div>
                      {commonInterests.map((i) => (
                        <span key={i} className="badge">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Link
                  to={`/mentors/${mentor?._id}`}
                  className="btn-primary"
                  style={{ flex: 1, textAlign: "center", padding: 10 }}
                >
                  View Profile
                </Link>
                <Link
                  to={`/chat/${mentor?._id}`}
                  className="btn-outline"
                  style={{ padding: "10px 16px" }}
                >
                  💬
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}