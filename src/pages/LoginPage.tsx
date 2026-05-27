import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthTrustNotice from "../components/AuthTrustNotice";
import DemoAccountsPanel from "../components/DemoAccountsPanel";
import { useApp } from "../context/AppContextSupabase";
import "./AuthPages.css";

export default function LoginPage() {
  const { login, isAuthenticated, isAdmin } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/panou"} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await login(email, password);
    if (!res.ok) {
      setError(res.error ?? "Eroare la autentificare.");
      return;
    }
    const trimmed = email.trim().toLowerCase();
    navigate(trimmed === "admin@mtucork.ie" ? "/admin" : "/panou");
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-page__back">
        ← Înapoi
      </Link>
      <p className="section__eyebrow">Autentificare</p>
      <h1 className="section__title">Intră în cont</h1>
      <AuthTrustNotice />

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="login-pass">Parolă</label>
          <input
            id="login-pass"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn--primary btn--full">
          Autentificare
        </button>
      </form>

      <DemoAccountsPanel
        onSelect={(demoEmail, demoPassword) => {
          setEmail(demoEmail);
          setPassword(demoPassword);
        }}
      />

      <p className="auth-note">
        Nu ai cont? <Link to="/inregistrare">Înregistrează-te</Link>
      </p>
    </div>
  );
}
