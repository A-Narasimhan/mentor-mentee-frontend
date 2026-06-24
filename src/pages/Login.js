import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { API } from "../context/AuthContext";

import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleForgotPassword = async () => {
    if (!forgotEmail) { setForgotError("Please enter your email"); return; }
    setForgotLoading(true);
    setForgotError("");
    try {
  
      const { data } = await API.post("/api/auth/forgot-password", {
     
        email: forgotEmail,
      });
      setGeneratedCode(data.resetCode);
      setForgotMsg("Reset code generated! Use the code below to reset your password.");
      setShowReset(true);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to generate reset code");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword) { setForgotError("Please fill all fields"); return; }
    setForgotLoading(true);
    setForgotError("");
    try {

      await API.post("/api/auth/reset-password", {
        email: forgotEmail,
        resetCode,
        newPassword,
      });
      setForgotMsg("Password reset successful! You can now login.");
      setShowForgot(false);
      setShowReset(false);
      setGeneratedCode("");
      setResetCode("");
      setNewPassword("");
      setForgotEmail("");
    } catch (err) {
      setForgotError(err.response?.data?.message || "Reset failed");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/*
        auth-left already has the correct className.
        The problem is Auth.css overrides it with hardcoded colors.
        Adding style prop here guarantees CSS variables win regardless
        of specificity in Auth.css — inline styles always take priority.
      */}
      <div
        className="auth-left"
        style={{ background: "var(--surface)", color: "var(--text)", transition: "background 0.3s ease" }}
      >
        <div className="auth-hero">
          {/* ⚡ icon and heading now use CSS variables via parent */}
          <div className="hero-icon">⚡</div>
          {/*
            Logo text: replace hardcoded color with logo-gradient class
            defined in index.css so it responds to theme
          */}
          <h1 className="logo-gradient">Mentor Match</h1>
          <p style={{ color: "var(--text-dim)" }}>
            Connect with experienced mentors.<br />Accelerate your growth.
          </p>
        </div>
      </div>

      <div
        className="auth-right"
        style={{ background: "var(--bg)", color: "var(--text)", transition: "background 0.3s ease" }}
      >
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="auth-sub">Sign in to your account</p>

          {error && <div className="alert-error">{error}</div>}

          {forgotMsg && !showForgot && (
            <div className="alert-success" style={{ marginBottom: 16 }}>{forgotMsg}</div>
          )}

          {!showForgot ? (
            <>
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Password</label>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setForgotMsg(""); setForgotError(""); }}
                      style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13 }}>
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button className="btn-primary auth-btn" type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In →"}
                </button>
              </form>
              <p className="auth-link">
                Don't have an account? <Link to="/register">Register</Link>
              </p>
            </>
          ) : (
            <div className="auth-form">
              <h3 style={{ marginBottom: 16, fontSize: 18 }}>
                {showReset ? "Enter Reset Code" : "Forgot Password"}
              </h3>

              {forgotError && <div className="alert-error" style={{ marginBottom: 12 }}>{forgotError}</div>}
              {forgotMsg && <div className="alert-success" style={{ marginBottom: 12 }}>{forgotMsg}</div>}

              {!showReset ? (
                <>
                  <div className="form-group">
                    <label>Your Email</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-primary auth-btn"
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}>
                    {forgotLoading ? "Generating..." : "Generate Reset Code →"}
                  </button>
                </>
              ) : (
                <>
                  {generatedCode && (
                    <div style={{
                      background: "rgba(124,58,237,0.1)",
                      border: "1px solid rgba(124,58,237,0.3)",
                      borderRadius: 10, padding: "12px 16px",
                      marginBottom: 16, textAlign: "center"
                    }}>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>YOUR RESET CODE</div>
                      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, color: "var(--accent)" }}>
                        {generatedCode}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>Valid for 15 minutes</div>
                    </div>
                  )}
                  <div className="form-group">
                    <label>Enter Reset Code</label>
                    <input
                      type="text"
                      placeholder="6-digit code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-primary auth-btn"
                    onClick={handleResetPassword}
                    disabled={forgotLoading}>
                    {forgotLoading ? "Resetting..." : "Reset Password →"}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => { setShowForgot(false); setShowReset(false); setForgotError(""); setForgotMsg(""); setGeneratedCode(""); }}
                style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", marginTop: 12, fontSize: 13, display: "block", textAlign: "center", width: "100%" }}>
                ← Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}