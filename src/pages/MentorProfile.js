import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../context/AuthContext";
import "./MentorProfile.css";

export default function MentorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showBook, setShowBook] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [session, setSession] = useState({ title: "", description: "", scheduledAt: "", duration: 60 });
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      API.get(`/api/users/${id}`),
      API.get(`/api/reviews/${id}`),
    ])
      .then(([u, r]) => {
        setMentor(u.data);
        setReviews(Array.isArray(r.data) ? r.data : []);
      })
      .catch((err) => {
        console.error("Failed to load mentor profile:", err);
        setError("Could not load this profile. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const bookSession = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/api/sessions`, { mentorId: id, ...session });
      setMsg("✅ Session booked! Waiting for mentor approval.");
      setShowBook(false);
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.message || "Failed to book"));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/api/reviews`, { mentorId: id, ...review });
      setReviews([data, ...reviews]);
      setMsg("✅ Review submitted!");
      setShowReview(false);
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.message || "Failed to submit"));
    }
  };

  if (loading) return <div className="spinner" />;

  if (error) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-dim)" }}>
      <p style={{ fontSize: 18 }}>⚠️ {error}</p>
      <button className="btn-outline" onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );

  if (!mentor) return <p>Mentor not found.</p>;

  return (
    <div className="mentor-profile">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      {msg && (
        <div className={msg.startsWith("✅") ? "alert-success" : "alert-error"} style={{ marginBottom: 16 }}>
          {msg}
        </div>
      )}

      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="card" style={{ textAlign: "center" }}>
            <div className="big-avatar">{mentor.name?.[0]?.toUpperCase()}</div>
            <h2 className="profile-mentor-name">{mentor.name}</h2>
            <div className="badge" style={{ margin: "6px 0" }}>{mentor.experienceLevel}</div>
            <div className="mentor-domain-tag">{mentor.domain || "General"}</div>

            <div className="rating-display">
              <span className="stars">
                {mentor.rating > 0
                  ? "★".repeat(Math.round(mentor.rating)) + "☆".repeat(5 - Math.round(mentor.rating))
                  : "☆☆☆☆☆"}
              </span>
              <strong>{mentor.rating > 0 ? mentor.rating : "No ratings yet"}</strong>
              {mentor.totalReviews > 0 && (
                <span style={{ color: "var(--text-dim)", fontSize: 13 }}>
                  ({mentor.totalReviews} reviews)
                </span>
              )}
            </div>

            <div className="availability">
              <span className={`dot ${mentor.availableForMentoring ? "green" : "red"}`} />
              {mentor.availableForMentoring ? "Available" : "Not Available"}
            </div>

            {user && user._id !== mentor._id && (
              <div className="profile-actions">
                {(user.role === "mentee" ||
                  user.role === "both" ||
                  (user.roles && user.roles.includes("mentee"))) && (
                  <button className="btn-primary" style={{ width: "100%" }} onClick={() => setShowBook(true)}>
                    📅 Book Session
                  </button>
                )}
                <Link to={"/chat/" + mentor._id} className="btn-outline" style={{ display: "block", textAlign: "center" }}>
                  💬 Message
                </Link>
                {(user.role === "mentee" ||
                  user.role === "both" ||
                  (user.roles && user.roles.includes("mentee"))) && (
                  <button className="btn-outline" style={{ width: "100%" }} onClick={() => setShowReview(true)}>
                    ⭐ Leave Review
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="profile-main">
          <div className="card">
            <h3>About</h3>
            <p className="about-text">{mentor.bio || "No bio provided yet."}</p>
          </div>

          <div className="card">
            <h3>Skills</h3>
            <div className="skills-list">
              {(mentor.skills || []).length > 0
                ? (mentor.skills || []).map((s) => (
                    <span key={s} className="tag" style={{ fontSize: 14, padding: "6px 14px" }}>{s}</span>
                  ))
                : <p style={{ color: "var(--text-dim)" }}>No skills listed.</p>}
            </div>
          </div>

          <div className="card">
            <h3>Interests</h3>
            <div className="skills-list">
              {(mentor.interests || []).length > 0
                ? (mentor.interests || []).map((i) => (
                    <span key={i} className="badge" style={{ margin: 3, cursor: "default" }}>{i}</span>
                  ))
                : <p style={{ color: "var(--text-dim)" }}>No interests listed.</p>}
            </div>
          </div>

          <div className="card">
            <h3>Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p style={{ color: "var(--text-dim)" }}>No reviews yet. Be the first!</p>
            ) : (
              <div className="reviews-list">
                {reviews.map((r) => (
                  <div key={r._id} className="review-item">
                    <div className="review-header">
                      <div className="review-avatar">{r.mentee?.name?.[0]}</div>
                      <div>
                        <div className="review-name">{r.mentee?.name}</div>
                        <div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                      </div>
                      <div className="review-date" style={{ marginLeft: "auto", color: "var(--text-dim)", fontSize: 12 }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="review-comment">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showBook && (
        <div className="modal-overlay" onClick={() => setShowBook(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Book a Session with {mentor.name}</h3>
            <form onSubmit={bookSession} className="auth-form" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Session Title</label>
                <input required placeholder="e.g. React Fundamentals Review" value={session.title}
                  onChange={(e) => setSession({ ...session, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} placeholder="What do you want to discuss?"
                  value={session.description}
                  onChange={(e) => setSession({ ...session, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date & Time</label>
                <input type="datetime-local" required value={session.scheduledAt}
                  onChange={(e) => setSession({ ...session, scheduledAt: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <select value={session.duration} onChange={(e) => setSession({ ...session, duration: Number(e.target.value) })}>
                  <option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn-outline" onClick={() => setShowBook(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Book Session</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReview && (
        <div className="modal-overlay" onClick={() => setShowReview(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Review {mentor.name}</h3>
            <form onSubmit={submitReview} className="auth-form" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Rating</label>
                <div className="star-picker">
                  {[1,2,3,4,5].map((n) => (
                    <button type="button" key={n} className={`star-btn ${review.rating >= n ? "active" : ""}`}
                      onClick={() => setReview({ ...review, rating: n })}>★</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea required rows={4} placeholder="Share your experience..."
                  value={review.comment}
                  onChange={(e) => setReview({ ...review, comment: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn-outline" onClick={() => setShowReview(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}