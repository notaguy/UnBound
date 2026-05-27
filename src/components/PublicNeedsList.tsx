import { NEED_CATEGORY_LABELS, NEED_STATUS_LABELS } from "../lib/roles";
import type { NeedRequest } from "../types";
import "./PublicNeedsList.css";

type Props = { needs: NeedRequest[]; limit?: number };

export default function PublicNeedsList({ needs, limit }: Props) {
  const list = limit ? needs.slice(0, limit) : needs;

  if (list.length === 0) {
    return (
      <p className="public-needs__empty">
        Încă nu sunt cereri aprobate publice. Fii primul care contribuie după înregistrare.
      </p>
    );
  }

  return (
    <ul className="public-needs">
      {list.map((n) => (
        <li key={n.id} className="public-needs__item">
          <span className="public-needs__cat">{NEED_CATEGORY_LABELS[n.category]}</span>
          <h3>{n.title}</h3>
          <p>{n.description}</p>
          <footer>
            {NEED_STATUS_LABELS[n.status]}
            {n.status === "in_project" && " · proiect studenți activ"}
          </footer>
        </li>
      ))}
    </ul>
  );
}
