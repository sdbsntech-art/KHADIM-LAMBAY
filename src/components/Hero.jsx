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
      <img
        className="hero-image"
        src="/hero.jpg"
        alt="Affiche des 72 heures de la jeunesse de Lambaye"
      />
    </section>
  );
}
