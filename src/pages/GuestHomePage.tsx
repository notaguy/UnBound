import { Link, Navigate } from "react-router-dom";
import { useApp } from "../context/AppContextSupabase";
import WeeklyEvents from "../components/WeeklyEvents";
import RolesOverview from "../components/RolesOverview";
import PlatformOverview from "../components/PlatformOverview";
import PublicNeedsList from "../components/PublicNeedsList";
import StorageNotice from "../components/StorageNotice";
import "./GuestHomePage.css";

export default function GuestHomePage() {
  const { isAuthenticated, isAdmin, publicApprovedNeeds } = useApp();
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/panou"} replace />;
  }

  return (
    <div className="page">
      <section className="guest-hero" aria-labelledby="guest-hero-title">
        <p className="guest-hero__badge">MTU Cork · Sport & accesibilitate</p>
        <h1 id="guest-hero-title" className="guest-hero__title">
          Platformă unde nevoile tale devin proiecte reale
        </h1>
        <p className="guest-hero__text">
          Cere o rampă, un echipament adaptat sau orice îți lipsește. MTU Cork
          aprobă, studenții proiectează, comunitatea te susține.
        </p>
        <div className="guest-hero__actions">
          <Link to="/inregistrare" className="btn btn--primary">
            Join us / Înregistrare
          </Link>
          <Link to="/autentificare" className="btn btn--ghost">
            Autentificare
          </Link>
        </div>
      </section>

      <div className="section">
        <PlatformOverview />
      </div>

      <div id="evenimente" className="section section--alt">
        <WeeklyEvents />
      </div>

      <div className="section">
        <p className="section__eyebrow">Impact</p>
        <h2 className="section__title">Cereri aprobate (exemple)</h2>
        <PublicNeedsList needs={publicApprovedNeeds} limit={3} />
      </div>

      <div id="roluri" className="section section--alt">
        <RolesOverview />
      </div>

      <StorageNotice />

      <section className="section guest-cta">
        <Link to="/inregistrare" className="btn btn--primary btn--full">
          Creează cont Citizen
        </Link>
      </section>
    </div>
  );
}
