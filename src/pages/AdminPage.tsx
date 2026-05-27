import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContextSupabase";
import {
  NEED_CATEGORY_LABELS,
  NEED_STATUS_LABELS,
  ROLE_LABELS,
} from "../lib/roles";
import "./AdminPage.css";

export default function AdminPage() {
  const {
    isAuthenticated,
    isAdmin,
    currentUser,
    data,
    getPendingNeeds,
    approveNeed,
    rejectNeed,
    createProjectFromNeed,
    assignStudentToProject,
    approveRoleRequest,
    rejectRoleRequest,
  } = useApp();

  const [feedback, setFeedback] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectFaculties, setProjectFaculties] = useState("Design, Engineering");
  const [selectedNeedId, setSelectedNeedId] = useState("");

  if (!isAuthenticated) return <Navigate to="/autentificare" replace />;
  if (!isAdmin) return <Navigate to="/panou" replace />;

  const pendingNeeds = getPendingNeeds();
  const pendingRoles = data.roleRequests.filter((r) => r.status === "pending");
  const students = data.users.filter((u) => u.roles.includes("student"));

  return (
    <div className="page admin-page">
      <header className="admin-header">
        <p className="section__eyebrow">MTU Cork</p>
        <h1 className="section__title">Panou administrator</h1>
        <p className="section__lead">
          Bun venit, {currentUser?.name}. Aprobă cereri, creează proiecte și implică
          studenți.
        </p>
      </header>

      {feedback && <p className="citizen-feedback" role="status">{feedback}</p>}

      <section className="admin-section">
        <h2>Cereri accesibilitate în așteptare ({pendingNeeds.length})</h2>
        {pendingNeeds.length === 0 ? (
          <p className="muted">Nicio cerere nouă.</p>
        ) : (
          <ul className="admin-list">
            {pendingNeeds.map((n) => (
              <li key={n.id} className="admin-card">
                <span className="admin-card__tag">{NEED_CATEGORY_LABELS[n.category]}</span>
                <h3>{n.title}</h3>
                <p>{n.description}</p>
                <p className="muted">De la: {n.userName}</p>
                <div className="admin-card__actions">
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={async () => {
                      const res = await approveNeed(n.id);
                      setFeedback(res.ok ? "Cerere aprobată." : (res.error ?? ""));
                    }}
                  >
                    Aprobă
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={async () => {
                      const res = await rejectNeed(n.id);
                      setFeedback(res.ok ? "Cerere respinsă." : (res.error ?? ""));
                    }}
                  >
                    Respinge
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-section">
        <h2>Creează proiect din cerere aprobată</h2>
        <div className="field">
          <label htmlFor="need-select">Cerere aprobată</label>
          <select
            id="need-select"
            value={selectedNeedId}
            onChange={(e) => setSelectedNeedId(e.target.value)}
          >
            <option value="">Selectează...</option>
            {data.needRequests
              .filter((n) => n.status === "approved")
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="proj-title">Titlu proiect</label>
          <input
            id="proj-title"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="proj-desc">Descriere</label>
          <textarea
            id="proj-desc"
            rows={3}
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="proj-fac">Facultăți (virgulă)</label>
          <input
            id="proj-fac"
            value={projectFaculties}
            onChange={(e) => setProjectFaculties(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={async () => {
            if (!selectedNeedId) {
              setFeedback("Selectează o cerere aprobată.");
              return;
            }
            const res = await createProjectFromNeed(
              selectedNeedId,
              projectTitle || "Proiect nou",
              projectDesc || "Proiect studenți MTU Cork",
              projectFaculties
            );
            setFeedback(res.ok ? "Proiect creat — studenții pot fi alocați." : (res.error ?? ""));
          }}
        >
          Creează proiect
        </button>
      </section>

      <section className="admin-section">
        <h2>Proiecte active</h2>
        <ul className="admin-list">
          {data.projects.map((p) => (
            <li key={p.id} className="admin-card">
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <p className="muted">Status: {p.status} · {p.facultyTags.join(", ")}</p>
              <div className="field">
                <label htmlFor={`student-${p.id}`}>Adaugă student</label>
                <select
                  id={`student-${p.id}`}
                  defaultValue=""
                    onChange={async (e) => {
                    const sid = e.target.value;
                    if (!sid) return;
                      const res = await assignStudentToProject(p.id, sid);
                    setFeedback(res.ok ? "Student alocat." : (res.error ?? ""));
                    e.target.value = "";
                  }}
                >
                  <option value="">Alege student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-section">
        <h2>Cereri rol ({pendingRoles.length})</h2>
        {pendingRoles.length === 0 ? (
          <p className="muted">Nicio cerere de rol.</p>
        ) : (
          <ul className="admin-list">
            {pendingRoles.map((r) => {
              const user = data.users.find((u) => u.id === r.userId);
              return (
                <li key={r.id} className="admin-card">
                  <h3>
                    {user?.name} — {ROLE_LABELS[r.role]}
                  </h3>
                  {r.message && <p className="muted">{r.message}</p>}
                  <div className="admin-card__actions">
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={async () => {
                        const res = await approveRoleRequest(r.id);
                        setFeedback(res.ok ? "Rol aprobat." : (res.error ?? ""));
                      }}
                    >
                      Aprobă rol
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={async () => {
                        const res = await rejectRoleRequest(r.id);
                        setFeedback(res.ok ? "Rol respins." : (res.error ?? ""));
                      }}
                    >
                      Respinge
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="admin-section">
        <h2>Toate cererile</h2>
        <ul className="simple-list">
          {data.needRequests.map((n) => (
            <li key={n.id}>
              <strong>{n.title}</strong> — {NEED_STATUS_LABELS[n.status]}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
