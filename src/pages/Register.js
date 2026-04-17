import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const SKILL_SUGGESTIONS = ["React", "Node.js", "Python", "Java", "ML", "DSA", "MongoDB", "SQL", "UI/UX", "DevOps"];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "mentee", roles: ["mentee"],
    bio: "", domain: "", experienceLevel: "beginner",
    skills: [], interests: [],
  });
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-hero">
          <div className="hero-icon">⚡</div>
          <h1>MentorMatch</h1>
          <p>Join as a mentor or mentee.<br />Build your future together.</p>
          <div className="step-indicator">
            <div className={"step-dot " + (step >= 1 ? "active" : "")}>1</div>
            <div className="step-line" />
            <div className={"step-dot " + (step >= 2 ? "active" : "")}>2</div>
          </div>
          <p className="step-label">
            {step === 1 ? "Basic Info & Role" : "Skills & Profile"}
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="auth-sub">Step {step} of 2</p>

          {error && <div className="alert-error">{error}</div>}

          {step === 1 && (
            <div className="auth-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>I am a...</label>
                <div className="role-select">
                  <button
                    type="button"
                    className={"role-btn " + (form.role === "mentee" ? "active-mentee" : "")}
                    onClick={() => setForm({ ...form, role: "mentee", roles: ["mentee"] })}>
                    🎓 Mentee
                    <small>I want guidance</small>
                  </button>
                  <button
                    type="button"
                    className={"role-btn " + (form.role === "mentor" ? "active-mentor" : "")}
                    onClick={() => setForm({ ...form, role: "mentor", roles: ["mentor"] })}>
                    🏆 Mentor
                    <small>I offer guidance</small>
                  </button>
                  <button
                    type="button"
                    className={"role-btn " + (form.role === "both" ? "active-mentor" : "")}
                    onClick={() => setForm({ ...form, role: "both", roles: ["mentor", "mentee"] })}>
                    🔄 Both
                    <small>Mentor & Mentee</small>
                  </button>
                </div>
              </div>
              <button
                className="btn-primary auth-btn"
                type="button"
                onClick={() => {
                  if (!form.name || !form.email || !form.password) {
                    setError("Please fill in name, email and password");
                    return;
                  }
                  if (!form.role) {
                    setError("Please select a role");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}>
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  placeholder="Tell us about yourself..."
                  value={form.bio}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Domain / Field</label>
                <input
                  name="domain"
                  placeholder="e.g. Web Dev, Data Science, Design"
                  value={form.domain}
                  onChange={handleChange}
                />
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
              <div className="form-group">
                <label>Skills</label>
                <div className="tag-input">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(skillInput))}
                    placeholder="Type & press Enter"
                  />
                  <div className="suggestions">
                    {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).map((s) => (
                      <button type="button" key={s} className="badge" onClick={() => addSkill(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="tags-list">
                    {form.skills.map((s) => (
                      <span key={s} className="tag">
                        {s}
                        <button type="button" onClick={() => removeSkill(s)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Interests</label>
                <div className="tag-input">
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                      placeholder="Type & press Enter"
                    />
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ whiteSpace: "nowrap", padding: "10px 14px" }}
                      onClick={addInterest}>
                      Add
                    </button>
                  </div>
                  <div className="tags-list">
                    {form.interests.map((i) => (
                      <span key={i} className="tag">
                        {i}
                        <button type="button" onClick={() => removeInterest(i)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn-outline" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button
                  className="btn-primary auth-btn"
                  type="submit"
                  disabled={loading}
                  style={{ flex: 1 }}>
                  {loading ? "Creating..." : "Create Account ✨"}
                </button>
              </div>
            </form>
          )}

          <p className="auth-link">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}