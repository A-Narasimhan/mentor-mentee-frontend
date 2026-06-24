import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Recommendations.css";

// ─────────────────────────────────────────────────────────
// FIX 1 OF 3 — Remove duplicate API instance, import the single shared one
// REMOVE these 14 lines entirely:
//   const API = axios.create({ baseURL: "https://..." });
//   API.interceptors.request.use((config) => { ... });
//
// REPLACE WITH:
import { API } from "../context/AuthContext";
// WHY: You now have one axios instance for the entire app.
// It already has baseURL set and the Authorization header
// managed centrally. Duplicating it here creates two independent
// instances that can get out of sync when the token changes.
// ─────────────────────────────────────────────────────────

export default function Recommendations() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  // ADD: error state for better user feedback
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/api/match/recommendations")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.matches || res.data.data || [];
        setMatches(data);
      })
      .catch((err) => {
        console.error("Error fetching recommendations:", err);
        // ADD: surface the actual error so you can debug in production
        setError(err.response?.data?.message || "Failed to load recommendations.");
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
      ) : error ? (
        // ADD: show actual error instead of silent empty state
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: 48 }}>⚠️</p>
          <p style={{ color: "var(--text-dim)", marginTop: 12 }}>{error}</p>
        </div>
      ) : matches.length === 0 ? (
        // ─────────────────────────────────────────────────────
        // FIX 3 OF 3 — Actionable empty state message
        // REMOVE the vague "Check back soon!" message
        // REPLACE WITH:
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: 48 }}>🤔</p>
          <p style={{ color: "var(--text-dim)", marginTop: 12, fontSize: 16 }}>
            No matches found yet.
          </p>
          <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 8 }}>
            Add your <strong>skills</strong> and <strong>interests</strong> in your profile
            so we can find mentors that match you.
          </p>
          <Link to="/profile" className="btn-primary" style={{ marginTop: 16, display: "inline-block", padding: "10px 24px" }}>
            Complete My Profile →
          </Link>
        </div>
        // WHY: The real reason matches are empty is almost always that the
        // mentee has no skills or interests saved. "Check back soon" implies
        // it's a supply problem (no mentors). It's actually a profile problem.
        // Giving a direct link to /profile lets the user fix it immediately.
        // ─────────────────────────────────────────────────────
      ) : (
        <div className="reco-list">
          {matches.map(({ mentor, score, matchPercent, commonSkills = [], commonInterests = [] }, idx) => {

            // ─────────────────────────────────────────────────────
            // FIX 2 OF 3 — Use matchPercent from backend, not score * 8
            // REMOVE:  Math.min(score * 8, 100)  (used twice below)
            // REPLACE WITH:
            const displayPercent = matchPercent ?? Math.min(Math.round(score * 8), 100);
            // WHY: The backend's normalizeScores() already computed the correct
            // percentage relative to the highest scorer. score * 8 is a magic
            // number that is sometimes over 100 (capped), sometimes too low.
            // matchPercent gives you the real relative value.
            // The ?? fallback handles old cached responses that don't have it yet.
            // ─────────────────────────────────────────────────────

            const barColor =
              displayPercent >= 70 ? "#10b981" :
              displayPercent >= 40 ? "#f59e0b" : "#ef4444";

            return (
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
                        width: displayPercent + "%",
                        background: barColor,
                      }}
                    />
                  </div>
                  <div
                    className="score-number"
                    style={{ color: barColor, fontWeight: 700, fontSize: 18 }}
                  >
                    {displayPercent}%
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
            );
          })}
        </div>
      )}
    </div>
  );
}