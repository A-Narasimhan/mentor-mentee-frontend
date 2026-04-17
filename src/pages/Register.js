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
    name: "",
    email: "",
    password: "",
    role: "",              // 🔥 start empty (force selection)
    bio: "",
    domain: "",
    experienceLevel: "beginner",
    skills: [],
    interests: []
  });

  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ ROLE FIX (IMPORTANT)
  const handleRoleSelect = (role) => {
    setForm({
      ...form,
      role,
      roles: role === "both" ? ["mentor", "mentee"] : [role]
    });
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
    }
    setSkillInput("");
  };

  const removeSkill = (s) => {
    setForm({ ...form, skills: form.skills.filter((x) => x !== s) });
  };

  const addInterest = () => {
    const i = interestInput.trim();
    if (i && !form.interests.includes(i)) {
      setForm({ ...form, interests: [...form.interests, i] });
    }
    setInterestInput("");
  };

  const removeInterest = (i) => {
    setForm({ ...form, interests: form.interests.filter((x) => x !== i) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("REGISTER FORM:", form); // 🔥 debug

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
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Create Account</h2>

          {error && <div className="alert-error">{error}</div>}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="auth-form">
              <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
              <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
              <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />

              <label>Select Role</label>

              <div className="role-select">
                <button type="button" onClick={() => handleRoleSelect("mentee")}>
                  Mentee
                </button>
                <button type="button" onClick={() => handleRoleSelect("mentor")}>
                  Mentor
                </button>
                <button type="button" onClick={() => handleRoleSelect("both")}>
                  Both
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!form.name || !form.email || !form.password) {
                    setError("Fill all fields");
                    return;
                  }
                  if (!form.role) {
                    setError("Select a role");
                    return;
                  }
                  setStep(2);
                }}
              >
                Next
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <textarea name="bio" placeholder="Bio" value={form.bio} onChange={handleChange} />
              <input name="domain" placeholder="Domain" value={form.domain} onChange={handleChange} />

              <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(skillInput))}
              />

              <div>
                {form.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>
          )}

          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}