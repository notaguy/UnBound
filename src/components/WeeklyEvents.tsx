import { Link } from "react-router-dom";
import { useApp } from "../context/AppContextSupabase";
import { formatEventDate, formatWeekLabel } from "../lib/week";
import "./WeeklyEvents.css";

type Props = {
  showRegisterHint?: boolean;
  showInvite?: boolean;
};

export default function WeeklyEvents({
  showRegisterHint = true,
  showInvite = false,
}: Props) {
  const {
    weeklyEvents,
    currentUser,
    registerForEvent,
    inviteFriendToEvent,
    getFriends,
    getInvitationsForMe,
    respondToEventInvite,
  } = useApp();

  const friends = getFriends();
  const invitations = getInvitationsForMe();

  return (
    <section className="weekly" aria-labelledby="weekly-title">
      <div className="weekly__head">
        <p className="section__eyebrow">Evenimente</p>
        <h2 id="weekly-title" className="section__title">
          Săptămâna aceasta
        </h2>
        <p className="weekly__range">{formatWeekLabel()}</p>
      </div>

      {invitations.length > 0 && (
        <div className="weekly__invites">
          <h3>Invitații pentru tine</h3>
          <ul>
            {invitations.map(({ event, status }) => (
              <li key={event.id}>
                <strong>{event.title}</strong> — {status}
                {status === "pending" && (
                  <span className="weekly__invite-actions">
                    <button
                      type="button"
                      className="btn btn--sm btn--primary"
                      onClick={async () => {
                        const res = await respondToEventInvite(event.id, true);
                        if (!res.ok) alert(res.error);
                      }}
                    >
                      Acceptă
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--ghost"
                      onClick={async () => {
                        const res = await respondToEventInvite(event.id, false);
                        if (!res.ok) alert(res.error);
                      }}
                    >
                      Refuză
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {weeklyEvents.length === 0 ? (
        <p className="weekly__empty">Niciun eveniment săptămâna aceasta.</p>
      ) : (
        <ul className="weekly__list">
          {weeklyEvents.map((event) => {
            const registered = currentUser?.registeredEventIds.includes(event.id);
            return (
              <li key={event.id} className="event-card">
                <div className="event-card__meta">
                  <time dateTime={event.date}>{formatEventDate(event.date)}</time>
                  <span>{event.time}</span>
                </div>
                <h3 className="event-card__title">{event.title}</h3>
                <p className="event-card__desc">{event.description}</p>
                <p className="event-card__loc">📍 {event.location}</p>
                <p className="event-card__host">Organizator: {event.hostName}</p>

                {currentUser ? (
                  <>
                    {registered ? (
                      <p className="event-card__status">✓ Ești înscris</p>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={async () => {
                          const res = await registerForEvent(event.id);
                          if (!res.ok) alert(res.error);
                        }}
                      >
                        Înscrie-te
                      </button>
                    )}
                    {showInvite && friends.length > 0 && (
                      <div className="event-card__invite">
                        <label htmlFor={`invite-${event.id}`}>Invită prieten:</label>
                        <select
                          id={`invite-${event.id}`}
                          defaultValue=""
                          onChange={async (e) => {
                            const fid = e.target.value;
                            if (!fid) return;
                            const res = await inviteFriendToEvent(event.id, fid);
                            alert(res.ok ? "Invitație trimisă!" : res.error);
                            e.target.value = "";
                          }}
                        >
                          <option value="">Alege...</option>
                          {friends.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  showRegisterHint && (
                    <p className="event-card__hint">
                      <Link to="/inregistrare">Creează cont</Link> pentru înscriere.
                    </p>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
