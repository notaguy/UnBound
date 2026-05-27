import "./AuthTrustNotice.css";

const REPO_URL = "https://github.com/notaguy/UnBound";

export default function AuthTrustNotice() {
  if (!import.meta.env.PROD) return null;

  return (
    <aside className="auth-trust" aria-label="Informații despre platformă">
      <p className="auth-trust__title">Platformă demo INGENIUM · MTU Cork</p>
      <p className="auth-trust__text">
        Site static pe GitHub Pages. Autentificarea rulează securizat prin Supabase — parolele
        nu sunt stocate pe acest domeniu.
      </p>
      <a
        className="auth-trust__link"
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        Cod sursă public pe GitHub
      </a>
    </aside>
  );
}
