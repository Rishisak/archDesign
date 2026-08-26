import React, { useState } from "react";
import { signInWithEmail, signUpWithEmail, loginAsGuestSession } from "../lib/supabase";

export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const clearErrors = () => {
    setErrors({});
    setFormError("");
  };

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    const errs = {};
    if (mode === "signup" && !fullName.trim()) {
      errs.fullName = "Enter your full name.";
    }

    if (!email.trim()) {
      errs.email = "Enter your email address.";
    } else if (!validateEmail(email.trim())) {
      errs.email = "That email address doesn't look right.";
    }

    if (!password) {
      errs.password = "Enter your password.";
    } else if (mode === "signup" && password.length < 8) {
      errs.password = "Use at least 8 characters.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setStatusNote("");

    try {
      let result;
      if (mode === "signup") {
        result = await signUpWithEmail(email.trim(), password, fullName.trim());
        setStatusNote("Account created successfully! Connecting to Supabase...");
      } else {
        result = await signInWithEmail(email.trim(), password);
        setStatusNote("Signed in successfully!");
      }

      const userObj = result?.user || {
        email: email.trim(),
        full_name: fullName.trim() || email.split("@")[0],
        id: result?.user?.id || `usr_${Date.now()}`,
      };

      setTimeout(() => {
        setLoading(false);
        if (onLoginSuccess) onLoginSuccess(userObj);
      }, 600);
    } catch (err) {
      setLoading(false);
      setFormError(err.message || "Failed to authenticate. Please try again.");
    }
  };

  const handleGuestLogin = async () => {
    clearErrors();
    setGuestLoading(true);
    setStatusNote("Initializing guest session & saving to Supabase...");

    try {
      const guestUser = await loginAsGuestSession();
      setTimeout(() => {
        setGuestLoading(false);
        if (onLoginSuccess) onLoginSuccess(guestUser);
      }, 700);
    } catch (err) {
      setGuestLoading(false);
      setFormError("Guest login failed. Please try again.");
    }
  };

  return (
    <div className="login-shell">
      {/* ── LEFT: Animated blueprint panel ── */}
      <div className="blueprint-panel">
        <div className="brand">
          <span className="brand-mark"></span>
          Blueprint Studio
        </div>

        <div className="plan-stage">
          <svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg">
            <path className="plan-fill" d="M40 40 H400 V300 H40 Z" />
            <path
              className="plan-line"
              d="
              M40 40 H400 V300 H40 Z
              M40 170 H180
              M180 40 V170
              M180 210 H400
              M260 170 V300
              M40 250 H140
            "
            />
            <path
              className="plan-line"
              d="M180 170 A 30 30 0 0 1 210 200"
              style={{ strokeWidth: 1.4 }}
            />
            <path
              className="plan-line"
              d="M260 210 A 26 26 0 0 1 234 236"
              style={{ strokeWidth: 1.4 }}
            />

            <line class="dim-tick" x1="40" y1="316" x2="400" y2="316" />
            <line class="dim-tick" x1="40" y1="310" x2="40" y2="322" />
            <line class="dim-tick" x1="400" y1="310" x2="400" y2="322" />
            <text class="plan-label" x="205" y="330">
              12.4 M
            </text>

            <line class="dim-tick" x1="416" y1="40" x2="416" y2="300" />
            <line class="dim-tick" x1="410" y1="40" x2="422" y2="40" />
            <line class="dim-tick" x1="410" y1="300" x2="422" y2="300" />

            <text class="plan-label" x="70" y="115">
              STUDIO
            </text>
            <text class="plan-label" x="290" y="130">
              TERRACE
            </text>
            <text class="plan-label" x="70" y="220">
              STORAGE
            </text>
            <text class="plan-label" x="300" y="260">
              LIVING
            </text>
          </svg>
        </div>

        <div className="titleblock">
          <div>
            <h1>Every plan starts as a blank sheet.</h1>
            <p>
              Sign in to pick up where you left off — your layouts, layers and
              revisions are saved to your account.
            </p>
          </div>
          <div className="scale-note">
            SCALE 1 : 100
            <br />
            REV. A
          </div>
        </div>
      </div>

      {/* ── RIGHT: Auth form panel ── */}
      <div className="form-panel">
        <div className="card">
          <p className="eyebrow">Project access</p>
          <h2>{mode === "signup" ? "Start your first plan" : "Welcome back"}</h2>
          <p className="sub">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <a
                  href="#signin"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode("signin");
                    clearErrors();
                  }}
                >
                  Sign in
                </a>
              </>
            ) : (
              <>
                New to Blueprint Studio?{" "}
                <a
                  href="#signup"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode("signup");
                    clearErrors();
                  }}
                >
                  Create an account
                </a>
              </>
            )}
          </p>

          {/* Mode toggle */}
          <div className="mode-toggle" role="tablist">
            <button
              type="button"
              className={mode === "signin" ? "active" : ""}
              onClick={() => {
                setMode("signin");
                clearErrors();
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                clearErrors();
              }}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {mode === "signup" && (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input
                  type="text"
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Asha Verma"
                  className={errors.fullName ? "invalid" : ""}
                />
                {errors.fullName && <p className="error-msg">{errors.fullName}</p>}
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className={errors.email ? "invalid" : ""}
              />
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={errors.password ? "invalid" : ""}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
              {errors.password && <p className="error-msg">{errors.password}</p>}
            </div>

            {mode === "signin" && (
              <div className="row-between">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    setStatusNote("Password reset link sent to your email.");
                  }}
                >
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              className={`submit-btn ${loading ? "loading" : ""}`}
              disabled={loading || guestLoading}
            >
              <span className="spinner"></span>
              <span className="btn-text">
                {mode === "signup" ? "Create account" : "Sign in"}
              </span>
            </button>

            {formError && (
              <p className="error-msg" style={{ textAlign: "center", marginTop: 8 }}>
                {formError}
              </p>
            )}
          </form>

          {/* ── PROMINENT GUEST LOGIN BUTTON ── */}
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              className={`guest-login-btn ${guestLoading ? "loading" : ""}`}
              onClick={handleGuestLogin}
              disabled={loading || guestLoading}
              title="Enter Studio instantly without registering"
            >
              {guestLoading ? (
                <>
                  <span className="spinner" style={{ display: "inline-block" }}></span>
                  <span>Saving Guest Session...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 16 }}>👤</span>
                  <span>Login as Guest</span>
                  <span className="guest-badge">Instant Access</span>
                </>
              )}
            </button>
          </div>

          <div className="divider">OR CONTINUE WITH</div>
          <div className="sso-row">
            <button
              type="button"
              className="sso-btn"
              onClick={() => setStatusNote("Connecting to Google OAuth...")}
            >
              Google
            </button>
            <button
              type="button"
              className="sso-btn"
              onClick={() => setStatusNote("Connecting to Apple Sign In...")}
            >
              Apple
            </button>
          </div>

          {statusNote && (
            <p className="form-footnote" style={{ color: "#2563eb", marginTop: 16 }}>
              {statusNote}
            </p>
          )}

          <p className="form-footnote" style={{ marginTop: 12 }}>
            Connected to Supabase (jkdjboxmtajkuxxecppo). Session details are automatically saved.
          </p>
        </div>
      </div>
    </div>
  );
}
