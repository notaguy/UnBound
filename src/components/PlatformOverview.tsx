import "./PlatformOverview.css";

export default function PlatformOverview() {
  return (
    <section className="platform-overview" aria-labelledby="overview-title">
      <h2 id="overview-title" className="section__title">
        Cum funcționează INGENIUM
      </h2>
      <ol className="platform-flow">
        <li>
          <strong>Cerere</strong>
          <span>
            Persoanele cu dizabilități descriu ce au nevoie — rampă, echipament
            adaptat, schimbări infrastructură.
          </span>
        </li>
        <li>
          <strong>MTU Cork</strong>
          <span>
            Universitatea verifică și aprobă cererile. Administratorii creează
            proiecte.
          </span>
        </li>
        <li>
          <strong>Studenți</strong>
          <span>
            Studenți din facultăți diferite proiectează și realizează soluții —
            pot primi credite.
          </span>
        </li>
        <li>
          <strong>Comunitate</strong>
          <span>
            Prieteni, evenimente, invitații și mesaje — toată lumea câștigă.
          </span>
        </li>
      </ol>
    </section>
  );
}
