const WAVE_PAYMENT_URL = 'https://pay.wave.com/m/M_sn_3Ww200ZUi0za/c/sn/';

export default function ContributionForm() {
  return (
    <section className="form-section" id="form-section" aria-labelledby="form-title">
      <div className="form-intro">
        <p className="eyebrow">Contribution volontaire</p>
        <h2 id="form-title">Contribuer avec Wave</h2>
        <p>Scannez le QR code ou ouvrez le lien Wave pour soutenir les actions de Lambaye.</p>
      </div>

      <div className="wave-payment-card">
        <a
          aria-label="Ouvrir le lien de contribution Wave"
          className="wave-qr-link"
          href={WAVE_PAYMENT_URL}
        >
          <img src="/wave-payment-qr.png" alt="QR code de contribution Wave" />
        </a>
        <div className="wave-payment-details">
          <img className="wave-app-icon" src="/wave-app-icon.png" alt="Application Wave" />
          <h3>Contribuer avec Wave</h3>
          <p>Scannez le QR code ou ouvrez le lien de contribution.</p>
          <a className="button wave-link-button" href={WAVE_PAYMENT_URL}>
            Contribuer avec Wave
          </a>
        </div>
      </div>

      <div className="thank-you-card">
        <h3>Merci pour votre contribution !</h3>
        <p>
          Grâce à votre soutien, nous avançons ensemble pour un Lambaye plus propre,
          plus vert et plus agréable pour tous.
        </p>
      </div>
    </section>
  );
}
