import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContextSupabase";
import { ROLE_LABELS } from "../lib/roles";
import "./Header.css";
import "./Layout.css";

export default function Layout() {
  const { isAuthenticated, isAdmin, currentUser, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const guestLinks = (
    <>
      <NavLink to="/" end className="nav-link" onClick={() => setMenuOpen(false)}>
        Acasă
      </NavLink>
      <NavLink to="/inregistrare" className="nav-link" onClick={() => setMenuOpen(false)}>
        Înregistrare
      </NavLink>
      <NavLink to="/autentificare" className="nav-link" onClick={() => setMenuOpen(false)}>
        Autentificare
      </NavLink>
    </>
  );

  const citizenLinks = (
    <>
      <NavLink
        to={isAdmin ? "/admin" : "/panou"}
        className="nav-link"
        onClick={() => setMenuOpen(false)}
      >
        {isAdmin ? "Admin MTU" : "Panoul meu"}
      </NavLink>
      <button
        type="button"
        className="nav-link nav-link--btn"
        onClick={() => {
          logout();
          setMenuOpen(false);
          navigate("/");
        }}
      >
        Deconectare
      </button>
    </>
  );

  return (
    <>
      <a className="skip-link" href="#continut">
        Sari la conținut
      </a>

      <header className="header">
        <div className="header__inner">
          <Link to="/" className="header__brand" onClick={() => setMenuOpen(false)}>
            <span className="header__logo" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="2.5" />
                <path
                  d="M16 9v14M9 16h14"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="header__name">INGENIUM</span>
          </Link>

          {isAuthenticated && currentUser && (
            <span className="header__user" title={currentUser.email}>
              {currentUser.name}
            </span>
          )}

          <button
            type="button"
            className="header__menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Închide meniul" : "Deschide meniul"}
          >
            <span className={menuOpen ? "header__icon header__icon--open" : "header__icon"} />
          </button>
        </div>

        <nav
          className={menuOpen ? "header__nav header__nav--open" : "header__nav"}
          aria-label="Navigare principală"
        >
          <div className="header__nav-inner">
            {isAuthenticated ? citizenLinks : guestLinks}
          </div>
        </nav>
      </header>

      <main id="continut" className="main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navigare rapidă">
        {isAuthenticated ? (
          <>
            <NavLink to={isAdmin ? "/admin" : "/panou"} className="bottom-nav__link">
              <span aria-hidden="true">◎</span>
              {isAdmin ? "Admin" : "Panou"}
            </NavLink>
            {!isAdmin && (
              <>
                <NavLink to="/panou" className="bottom-nav__link">
                  <span aria-hidden="true">📋</span>
                  Cereri
                </NavLink>
                <NavLink to="/panou" className="bottom-nav__link">
                  <span aria-hidden="true">♥</span>
                  Prieteni
                </NavLink>
              </>
            )}
            <button
              type="button"
              className="bottom-nav__link bottom-nav__link--btn"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <span aria-hidden="true">↩</span>
              Ieșire
            </button>
          </>
        ) : (
          <>
            <NavLink to="/" end className="bottom-nav__link">
              <span aria-hidden="true">⌂</span>
              Acasă
            </NavLink>
            <NavLink to="/#evenimente" className="bottom-nav__link">
              <span aria-hidden="true">📅</span>
              Evenimente
            </NavLink>
            <NavLink to="/#roluri" className="bottom-nav__link">
              <span aria-hidden="true">◎</span>
              Roluri
            </NavLink>
            <NavLink to="/inregistrare" className="bottom-nav__link bottom-nav__link--cta">
              <span aria-hidden="true">✦</span>
              Join us
            </NavLink>
          </>
        )}
      </nav>

      <footer className="footer">
        <div className="footer__inner">
          {isAuthenticated && currentUser && (
            <p className="footer__roles">
              Roluri active:{" "}
              {currentUser.roles.map((r) => ROLE_LABELS[r]).join(" · ")}
            </p>
          )}
          <p className="footer__copy">© {new Date().getFullYear()} INGENIUM</p>
        </div>
      </footer>
    </>
  );
}
