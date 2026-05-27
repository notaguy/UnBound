import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContextSupabase";
import "./AuthPages.css";

export default function RegisterPage() {
  const { register, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAuthenticated) return <Navigate to="/panou" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Parola trebuie să aibă minim 6 caractere.");
      return;
    }
    const res = await register(name, email, password);
    if (!res.ok) {
      setError(res.error ?? "Eroare la înregistrare.");
      return;
    }
    navigate("/panou");
  };

  return (
    <div className="auth-page">
      <Link to="/" className="auth-page__back">
        ← Înapoi
      </Link>
      <p className="section__eyebrow">Join us</p>
      <h1 className="section__title">Creează cont</h1>
      <p className="section__lead">
        După înregistrare devii automat <strong>Citizen</strong> — poți participa la
        evenimente, comunități și poți cere roluri suplimentare.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="reg-name">Nume *</label>
          <input
            id="reg-name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="reg-email">Email *</label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="reg-pass">Parolă * (min. 6 caractere)</label>
          <input
            id="reg-pass"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn--primary btn--full">
          Înregistrează-te ca Citizen
        </button>
      </form>

      <p className="auth-note">
        Ai cont? <Link to="/autentificare">Autentifică-te</Link>
      </p>
    </div>
  );
}
