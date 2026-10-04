export default function Hero({ onDonateClick }) {
  return (
    <section className="hero-section" id="top">
      <div className="hero-copy">
        <p className="eyebrow">Conseil Consultatif de la Jeunesse de Lambaye</p>
        <h1>Ensemble, faisons avancer Lambaye.</h1>
        <p className="hero-description">
          Soutenez librement les actions des jeunes pour un village plus propre,
          plus vert et en meilleure santé. Chaque contribution est volontaire.
        </p>
        <button className="button" onClick={onDonateClick} type="button">
          Contribuer librement
        </button>
        <p className="privacy-note">Votre contribution et vos coordonnées restent privées.</p>
      </div>
      <div className="hero-visual">
        <img
          className="hero-image"
          src="/hero.jpg"
          alt="Jeunes de Lambaye engagés dans une action de reboisement"
        />
        <a
          className="flyer-preview"
          href="/flyer-72h.png"
          rel="noreferrer"
          target="_blank"
          aria-label="Voir l’affiche des 72 heures de la jeunesse de Lambaye"
        >
          <img src="/flyer-72h.png" alt="" />
          <span>Voir l’affiche</span>
        </a>
      </div>
    </section>
  );
}
