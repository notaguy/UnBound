import { STORAGE_INFO } from "../lib/storage";
import "./StorageNotice.css";

export default function StorageNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="storage-notice storage-notice--compact">
        Date demo în <strong>{STORAGE_INFO.current}</strong> — la lansare:{" "}
        {STORAGE_INFO.future}.
      </p>
    );
  }
  return (
    <aside className="storage-notice" aria-label="Informații stocare date">
      <h3>Unde sunt stocate datele?</h3>
      <p>
        <strong>Acum (demo):</strong> {STORAGE_INFO.current} — în browserul tău.
        Funcționează fără server, potrivit pentru GitHub Pages, dar datele nu se
        sincronizează între dispozitive și nu sunt potrivite pentru poze/multimedia
        la scară mare.
      </p>
      <p>
        <strong>La lansare:</strong> {STORAGE_INFO.future} — conturi reale,
        poze, postări, conversații și backup securizat.
      </p>
    </aside>
  );
}
