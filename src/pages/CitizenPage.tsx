import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContextSupabase";
import WeeklyEvents from "../components/WeeklyEvents";
import StorageNotice from "../components/StorageNotice";
import { NEED_CATEGORY_LABELS, NEED_STATUS_LABELS, ROLE_LABELS } from "../lib/roles";
import type { NeedCategory, RequestableRole } from "../types";
import "./CitizenPage.css";

type Tab = "acasa" | "cereri" | "evenimente" | "prieteni" | "roluri";

const TABS: { id: Tab; label: string }[] = [
  { id: "acasa", label: "Acasă" },
  { id: "cereri", label: "Cereri" },
  { id: "evenimente", label: "Evenimente" },
  { id: "prieteni", label: "Prieteni" },
  { id: "roluri", label: "Roluri" },
];

export default function CitizenPage() {
  const app = useApp();
  const {
    currentUser,
    isAuthenticated,
    isAdmin,
    submitNeedRequest,
    requestRole,
    joinCommunity,
    leaveCommunity,
    setVolunteer,
    addFriend,
    removeFriend,
    sendMessage,
    getConversationMessages,
    loadConversationMessages,
    getFriends,
    getDiscoverableUsers,
    getUserNeeds,
    getUserRoleRequests,
    getFriendEvents,
    getMyProjects,
    data,
  } = app;

  const [tab, setTab] = useState<Tab>("acasa");
  const [feedback, setFeedback] = useState("");

  const [needTitle, setNeedTitle] = useState("");
  const [needDesc, setNeedDesc] = useState("");
  const [needCat, setNeedCat] = useState<NeedCategory>("infrastructure");
  const [roleMsg, setRoleMsg] = useState("");
  const [chatFriend, setChatFriend] = useState<string>("");
  const [chatBody, setChatBody] = useState("");

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/autentificare" replace />;
  }
  if (isAdmin) return <Navigate to="/admin" replace />;

  const friends = getFriends();
  const discover = getDiscoverableUsers();
  const myNeeds = getUserNeeds();
  const roleRequests = getUserRoleRequests();
  const friendEvents = getFriendEvents();
  const projects = getMyProjects();
  const hasDisability = currentUser.roles.includes("disability");

  const handleNeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await submitNeedRequest(needTitle, needDesc, needCat);
    setFeedback(res.ok ? "Cerere trimisă către MTU Cork." : (res.error ?? ""));
    if (res.ok) {
      setNeedTitle("");
      setNeedDesc("");
    }
  };

  const handleRoleRequest = async (role: RequestableRole) => {
    const res = await requestRole(role, roleMsg);
    setFeedback(res.ok ? "Cerere rol trimisă." : (res.error ?? ""));
  };

  const messages = chatFriend ? getConversationMessages(chatFriend) : [];

  useEffect(() => {
    if (!chatFriend) return;
    loadConversationMessages(chatFriend);
  }, [chatFriend, loadConversationMessages]);

  return (
    <div className="page citizen-page">
      <header className="citizen-header">
        <h1 className="section__title">Salut, {currentUser.name}</h1>
        <div className="citizen-badges">
          {currentUser.roles.map((r) => (
            <span key={r} className="citizen-badge">
              {ROLE_LABELS[r]}
            </span>
          ))}
        </div>
      </header>

      <nav className="citizen-tabs" aria-label="Secțiuni panou">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "citizen-tabs__btn citizen-tabs__btn--active" : "citizen-tabs__btn"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {feedback && <p className="citizen-feedback" role="status">{feedback}</p>}

      {tab === "acasa" && (
        <div className="citizen-panel">
          <p className="section__lead">
            Ca <strong>Citizen</strong> poți: participa la evenimente, adăuga prieteni,
            invita la evenimente, vorbi în chat și (cu rolul potrivit) trimite cereri.
          </p>
          {projects.length > 0 && (
            <div className="citizen-block">
              <h2>Proiectele tale</h2>
              <ul className="simple-list">
                {projects.map((p) => (
                  <li key={p.id}>
                    <strong>{p.title}</strong> — {p.status}
                    <br />
                    <small>{p.facultyTags.join(", ")}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {friendEvents.length > 0 && (
            <div className="citizen-block">
              <h2>Ce fac prietenii tăi săptămâna aceasta</h2>
              <ul className="simple-list">
                {friendEvents.map((e) => (
                  <li key={e.id}>{e.title} — {e.date}</li>
                ))}
              </ul>
            </div>
          )}
          <StorageNotice compact />
        </div>
      )}

      {tab === "cereri" && (
        <div className="citizen-panel">
          <h2 className="section__title section__title--sm">Cereri de accesibilitate</h2>
          {!hasDisability ? (
            <p className="section__lead">
              Solicită rolul „Persoană cu dizabilități” din tab-ul Roluri, apoi poți
              descrie ce ai nevoie (rampă, echipament, infrastructură).
            </p>
          ) : (
            <form className="need-form" onSubmit={handleNeedSubmit}>
              <div className="field">
                <label htmlFor="need-title">Titlu cerere *</label>
                <input
                  id="need-title"
                  required
                  value={needTitle}
                  onChange={(e) => setNeedTitle(e.target.value)}
                  placeholder="ex. Rampă acces sală sport"
                />
              </div>
              <div className="field">
                <label htmlFor="need-cat">Categorie</label>
                <select
                  id="need-cat"
                  value={needCat}
                  onChange={(e) => setNeedCat(e.target.value as NeedCategory)}
                >
                  {Object.entries(NEED_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="need-desc">Descriere *</label>
                <textarea
                  id="need-desc"
                  required
                  rows={4}
                  value={needDesc}
                  onChange={(e) => setNeedDesc(e.target.value)}
                  placeholder="Descrie nevoia cât mai clar..."
                />
              </div>
              <button type="submit" className="btn btn--primary btn--full">
                Trimite către MTU Cork
              </button>
            </form>
          )}

          <h3 className="citizen-subtitle">Cererile mele</h3>
          {myNeeds.length === 0 ? (
            <p className="muted">Nicio cerere încă.</p>
          ) : (
            <ul className="simple-list">
              {myNeeds.map((n) => (
                <li key={n.id}>
                  <strong>{n.title}</strong> — {NEED_STATUS_LABELS[n.status]}
                  <p className="muted">{NEED_CATEGORY_LABELS[n.category]}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "evenimente" && (
        <div className="citizen-panel">
          <WeeklyEvents showRegisterHint={false} showInvite />
        </div>
      )}

      {tab === "prieteni" && (
        <div className="citizen-panel">
          <h2 className="section__title section__title--sm">Prieteni & mesaje</h2>

          <h3 className="citizen-subtitle">Prietenii tăi ({friends.length})</h3>
          {friends.length === 0 ? (
            <p className="muted">Adaugă prieteni din lista de mai jos.</p>
          ) : (
            <ul className="friend-list">
              {friends.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className={chatFriend === f.id ? "friend-list__name active" : "friend-list__name"}
                    onClick={() => setChatFriend(f.id)}
                  >
                    {f.name}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      removeFriend(f.id);
                      if (chatFriend === f.id) setChatFriend("");
                      setFeedback(`Ai eliminat pe ${f.name} din prieteni.`);
                    }}
                  >
                    Elimină
                  </button>
                </li>
              ))}
            </ul>
          )}

          {chatFriend && (
            <div className="chat-box">
              <h3>Conversație</h3>
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <p className="muted">Niciun mesaj. Spune bună!</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={
                        m.senderId === currentUser.id
                          ? "chat-bubble chat-bubble--me"
                          : "chat-bubble"
                      }
                    >
                      {m.body}
                    </div>
                  ))
                )}
              </div>
              <form
                className="chat-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  (async () => {
                    const res = await sendMessage(chatFriend, chatBody);
                    if (res.ok) setChatBody("");
                    else setFeedback(res.error ?? "");
                  })();
                }}
              >
                <input
                  value={chatBody}
                  onChange={(e) => setChatBody(e.target.value)}
                  placeholder="Scrie un mesaj..."
                  aria-label="Mesaj"
                />
                <button type="submit" className="btn btn--primary btn--sm">
                  Trimite
                </button>
              </form>
            </div>
          )}

          <h3 className="citizen-subtitle">Adaugă prieteni</h3>
          <ul className="friend-list">
            {discover.map((u) => (
              <li key={u.id}>
                <span>{u.name}</span>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={async () => {
                    const res = await addFriend(u.id);
                    setFeedback(res.ok ? `Acum ești prieten cu ${u.name}.` : (res.error ?? ""));
                  }}
                >
                  Adaugă
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "roluri" && (
        <div className="citizen-panel section--alt">
          <h2 className="section__title section__title--sm">Roluri & comunități</h2>
          <p className="section__lead">
            Cere rol Student sau Persoană cu dizabilități. MTU Cork aprobă.
          </p>
          <div className="field">
            <label htmlFor="role-msg">Mesaj cerere</label>
            <textarea
              id="role-msg"
              rows={2}
              value={roleMsg}
              onChange={(e) => setRoleMsg(e.target.value)}
            />
          </div>
          <div className="citizen-actions-row">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={currentUser.roles.includes("student")}
              onClick={() => handleRoleRequest("student")}
            >
              Cere rol Student
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={currentUser.roles.includes("disability")}
              onClick={() => handleRoleRequest("disability")}
            >
              Cere rol Persoană cu dizabilități
            </button>
          </div>
          {roleRequests.length > 0 && (
            <ul className="simple-list">
              {roleRequests.map((r) => (
                <li key={r.id}>
                  {ROLE_LABELS[r.role]} — {r.status}
                </li>
              ))}
            </ul>
          )}

          <label className="toggle">
            <input
              type="checkbox"
              checked={currentUser.isVolunteer}
              onChange={(e) => setVolunteer(e.target.checked)}
            />
            <span>Vreau să fiu voluntar (nu doar participant)</span>
          </label>

          <h3 className="citizen-subtitle">Comunități</h3>
          <ul className="community-list">
            {data.communities.map((com) => {
              const joined = currentUser.joinedCommunityIds.includes(com.id);
              return (
                <li key={com.id} className="community-card">
                  <h4>{com.name}</h4>
                  <p>{com.description}</p>
                  <p className="muted">
                    {com.creatorName} · {com.memberIds.length} membri
                  </p>
                  {joined ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => leaveCommunity(com.id)}
                    >
                      Părăsește
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={async () => {
                        const res = await joinCommunity(com.id);
                        setFeedback(res.ok ? `Te-ai alăturat „${com.name}".` : (res.error ?? ""));
                      }}
                    >
                      Join
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
