import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

const SKILL_SUGGESTIONS = ["React", "Node.js", "Python", "Java", "ML", "DSA", "MongoDB", "SQL", "UI/UX", "DevOps", "AWS", "Docker", "GraphQL", "TypeScript"];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    domain: user?.domain || "",
    experienceLevel: user?.experienceLevel || "beginner",
    skills: user?.skills || [],
    interests: user?.interests || [],
    isAvailable: user?.isAvailable ?? true,
  });
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !form.skills.includes(s)) setForm({ ...form, skills: [...form.skills, s] });
    setSkillInput("");
  };

  const removeSkill = (s) => setForm({ ...form, skills: form.skills.filter((x) => x !== s) });

  const addInterest = () => {
    const i = interestInput.trim();
    if (i && !form.interests.includes(i)) setForm({ ...form, interests: [...form.interests, i] });
    setInterestInput("");
  };

  const removeInterest = (i) => setForm({ ...form, interests: form.interests.filter((x) => x !== i) });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const { data } = await axios.put("/api/users/me", form);
      updateUser(data);
      setMsg("✅ Profile updated successfully!");
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.message || "Update failed"));
    } finally {
      setLoading(false);
    }
  };

  const isMentor = user &&
  (user.role === "mentor" ||
   user.role === "both" ||
   (user.roles && user.roles.includes("mentor")));

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Keep your profile updated to get better matches</p>
      </div>

      <div className="profile-page-layout">
        {/* Preview card */}
        <div className="profile-preview card">
          <div className="preview-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="preview-name">{form.name || user?.name}</div>
          <div className={`role-badge ${isMentor ? "mentor" : "mentee"}`}>{user?.role}</div>
          <div className="preview-domain">{form.domain || "No domain set"}</div>
          {isMentor && user?.rating > 0 && (
            <div className="rating-display">
              <span className="stars">{"★".repeat(Math.round(user.rating))}</span>
              <strong>{user.rating}</strong>
              <span style={{ color: "var(--text-dim)", fontSize: 13 }}>({user.totalReviews})</span>
            </div>
          )}
          <div className="preview-skills">
            {form.skills.slice(0, 6).map((s) => <span key={s} className="tag">{s}</span>)}
          </div>
          <div className="preview-stats">
            <div><strong>{form.skills.length}</strong><small>Skills</small></div>
            <div><strong>{form.interests.length}</strong><small>Interests</small></div>
            <div><strong>{user?.points || 0}</strong><small>Points</small></div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="profile-form card">
          {msg && (
            <div className={msg.startsWith("✅") ? "alert-success" : "alert-error"}>{msg}</div>
          )}

          <div className="form-section">
            <h3>Basic Info</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Domain / Field</label>
                <input name="domain" placeholder="e.g. Web Dev, Data Science" value={form.domain} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea name="bio" rows={4} placeholder="Tell the community about yourself..."
                value={form.bio} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Experience Level</label>
              <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            {isMentor && (
              <label className="checkbox-label">
                <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} />
                <span>Available for mentoring</span>
              </label>
            )}
          </div>

          <div className="form-section">
            <h3>Skills</h3>
            <div className="tag-input">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(skillInput))}
                placeholder="Type & press Enter to add" />
              <div className="suggestions">
                {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).map((s) => (
                  <button type="button" key={s} className="badge" onClick={() => addSkill(s)}>{s}</button>
                ))}
              </div>
              <div className="tags-list">
                {form.skills.map((s) => (
                  <span key={s} className="tag">{s}
                    <button type="button" onClick={() => removeSkill(s)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Interests</h3>
            <div className="tag-input">
              <div style={{ display: "flex", gap: 8 }}>
                <input value={interestInput} onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                  placeholder="Type & press Enter" />
                <button type="button" className="btn-outline" style={{ whiteSpace: "nowrap", padding: "10px 14px" }} onClick={addInterest}>
                  Add
                </button>
              </div>
              <div className="tags-list">
                {form.interests.map((i) => (
                  <span key={i} className="tag">{i}
                    <button type="button" onClick={() => removeInterest(i)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ padding: "12px 32px", fontSize: 15 }} disabled={loading}>
            {loading ? "Saving..." : "Save Profile ✓"}
          </button>
        </form>
      </div>
    </div>
  );
}
