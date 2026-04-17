import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const SKILL_SUGGESTIONS = [
  "React",
  "Node.js",
  "Python",
  "Java",
  "ML",
  "DSA",
  "MongoDB",
  "SQL",
  "UI/UX",
  "DevOps",
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    roles: [],
    bio: "",
    domain: "",
    experienceLevel: "beginner",
    skills: [],
    interests: [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ✅ Proper role handling
  const handleRoleSelect = (selectedRole) => {
    setForm({
      ...form,
      role: selectedRole,
      roles:
        selectedRole === "both"
          ? ["mentor", "mentee"]
          : [selectedRole],
    });
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !form.skills.includes(s)) {
      setForm({
        ...form,
        skills: [...form.skills, s],
      });
    }
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setForm({
      ...form,
      skills: form.skills.filter((s) => s !== skill),
    });
  };

  const addInterest = () => {
    const i = interestInput.trim();
    if (i && !form.interests.includes(i)) {
      setForm({
        ...form,
        interests: [...form.interests, i],
      });
    }
    setInterestInput("");
  };

  const removeInterest = (interest) => {
    setForm({
      ...form,
      interests: form.interests.filter((i) => i !== interest),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("REGISTER FORM:", form);

      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT SIDE */}
      <div className="auth-left">
        <div className="auth-hero">
          <div className="hero-icon">⚡</div>
          <h1>MentorMatch</h1>
          <p>
            Join as a mentor or mentee.
            <br />
            Build your future together.
          </p>

          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? "active" : ""}`}>
              1
            </div>
            <div className="step-line"></div>
            <div className={`step-dot ${step >= 2 ? "active" : ""}`}>
              2
            </div>
          </div>

          <p className="step-label">
            {step === 1
              ? "Basic Info & Role"
              : "Skills & Profile"}
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-right">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="auth-sub">
            Step {step} of 2
          </p>

          {error && (
            <div className="alert-error">{error}</div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="auth-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  name="name"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Select Role</label>

                <div className="role-select">
                  <button
                    type="button"
                    className={`role-btn ${
                      form.role === "mentee"
                        ? "active-mentee"
                        : ""
                    }`}
                    onClick={() =>
                      handleRoleSelect("mentee")
                    }
                  >
                    🎓 Mentee
                    <small>I need guidance</small>
                  </button>

                  <button
                    type="button"
                    className={`role-btn ${
                      form.role === "mentor"
                        ? "active-mentor"
                        : ""
                    }`}
                    onClick={() =>
                      handleRoleSelect("mentor")
                    }
                  >
                    🏆 Mentor
                    <small>I offer guidance</small>
                  </button>

                  <button
                    type="button"
                    className={`role-btn ${
                      form.role === "both"
                        ? "active-mentor"
                        : ""
                    }`}
                    onClick={() =>
                      handleRoleSelect("both")
                    }
                  >
                    🔄 Both
                    <small>Mentor + Mentee</small>
                  </button>
                </div>
              </div>

              <button
                className="btn-primary auth-btn"
                type="button"
                onClick={() => {
                  if (
                    !form.name ||
                    !form.email ||
                    !form.password
                  ) {
                    setError(
                      "Please fill all required fields"
                    );
                    return;
                  }

                  if (!form.role) {
                    setError(
                      "Please select your role"
                    );
                    return;
                  }

                  setError("");
                  setStep(2);
                }}
              >
                Next →
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form
              onSubmit={handleSubmit}
              className="auth-form"
            >
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  placeholder="Tell something about yourself..."
                  value={form.bio}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Domain / Field</label>
                <input
                  name="domain"
                  placeholder="Web Dev / AI / Design..."
                  value={form.domain}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Experience Level</label>
                <select
                  name="experienceLevel"
                  value={form.experienceLevel}
                  onChange={handleChange}
                >
                  <option value="beginner">
                    Beginner
                  </option>
                  <option value="intermediate">
                    Intermediate
                  </option>
                  <option value="advanced">
                    Advanced
                  </option>
                  <option value="expert">
                    Expert
                  </option>
                </select>
              </div>

              <div className="form-group">
  <label>Skills</label>

  {/* Manual input */}
  <input
    value={skillInput}
    placeholder="Type skill & press Enter"
    onChange={(e) => setSkillInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addSkill(skillInput);
      }
    }}
  />

  {/* Suggested skill buttons */}
  <div className="suggestions">
    {SKILL_SUGGESTIONS.map((skill) => (
      <span
        key={skill}
        className="badge"
        onClick={() => addSkill(skill)}
        style={{ cursor: "pointer" }}
      >
        {skill}
      </span>
    ))}
  </div>

  {/* Selected skills */}
  <div className="tags-list">
    {form.skills.map((skill) => (
      <span key={skill} className="tag">
        {skill}
        <button
          type="button"
          onClick={() => removeSkill(skill)}
        >
          ×
        </button>
      </span>
    ))}
  </div>
</div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  className="btn-primary auth-btn"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading
                    ? "Creating..."
                    : "Create Account ✨"}
                </button>
              </div>
            </form>
          )}

          <p className="auth-link">
            Already have an account?{" "}
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}