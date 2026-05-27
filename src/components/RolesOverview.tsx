import { ROLE_INFO } from "../lib/roles";
import "./RolesOverview.css";

export default function RolesOverview() {
  return (
    <section className="roles-overview" aria-labelledby="roles-title">
      <p className="section__eyebrow">Roluri pe platformă</p>
      <h2 id="roles-title" className="section__title">
        Ce rol poți avea?
      </h2>
      <p className="section__lead">
        Începi ca vizitator. După cont devii <strong>Citizen</strong> și poți cere
        alte roluri sau să te implici ca voluntar.
      </p>

      <ul className="roles-overview__list">
        {ROLE_INFO.map((role) => (
          <li key={role.id} className="role-card">
            <span className={`role-card__badge role-card__badge--${role.id}`}>
              {role.title}
            </span>
            <p className="role-card__short">{role.short}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
