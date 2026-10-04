import { useState } from 'react';
import { buildContributionWhatsAppUrl } from '../utils/whatsapp';

const WAVE_PAYMENT_URL = 'https://pay.wave.com/m/M_sn_iRpPVxT7n-Ey/c/sn/';

export default function ContributionForm({ onSubmitContribution }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!paymentCompleted) return;

    const contribution = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      location: location.trim(),
      message: message.trim(),
      isAnonymous,
      paymentMethod: 'Wave',
      date: new Date().toISOString(),
      reference: `CCJ-${Date.now().toString().slice(-8)}`,
    };

    onSubmitContribution({
      ...contribution,
      whatsappUrl: buildContributionWhatsAppUrl(contribution),
    });
  };

  return (
    <section className="form-section" id="form-section" aria-labelledby="form-title">
      <div className="form-intro">
        <p className="eyebrow">Contribution volontaire</p>
        <h2 id="form-title">Contribuer avec Wave</h2>
        <p>Scannez le QR code ou ouvrez le lien Wave pour effectuer votre contribution.</p>
      </div>

      <div className="wave-payment-card">
        <a
          aria-label="Ouvrir le lien de paiement Wave"
          className="wave-qr-link"
          href={WAVE_PAYMENT_URL}
          rel="noreferrer"
          target="_blank"
        >
          <img src="/wave-payment-qr.png" alt="QR code Wave pour payer Zayel Khalifa" />
        </a>
        <div className="wave-payment-details">
          <h3>Payer avec Wave</h3>
          <p>Scannez le QR code ou ouvrez le lien de paiement.</p>
          <a className="button wave-link-button" href={WAVE_PAYMENT_URL} rel="noreferrer" target="_blank">
            Payer avec Wave
          </a>
        </div>
      </div>

      <form className="contribution-form" onSubmit={handleSubmit}>
        <div className="form-intro report-intro">
          <h3>Votre rapport de contribution</h3>
          <p>Après le paiement, remplissez ces informations pour envoyer votre rapport au CCJ.</p>
        </div>

        <label className="checkbox-row" htmlFor="anonymous">
          <input
            checked={isAnonymous}
            id="anonymous"
            onChange={(event) => setIsAnonymous(event.target.checked)}
            type="checkbox"
          />
          <span>Je souhaite contribuer anonymement</span>
        </label>
        {isAnonymous ? (
          <p className="field-help">Votre prénom et votre nom ne seront pas inclus dans le rapport.</p>
        ) : (
          <div className="field-pair">
            <div>
              <label htmlFor="firstName">Prénom *</label>
              <input
                autoComplete="given-name"
                id="firstName"
                maxLength="80"
                onChange={(event) => setFirstName(event.target.value)}
                required
                value={firstName}
              />
            </div>
            <div>
              <label htmlFor="lastName">Nom *</label>
              <input
                autoComplete="family-name"
                id="lastName"
                maxLength="80"
                onChange={(event) => setLastName(event.target.value)}
                required
                value={lastName}
              />
            </div>
          </div>
        )}

        <label htmlFor="phone">Téléphone / WhatsApp <span>(facultatif)</span></label>
        <input
          autoComplete="tel"
          id="phone"
          maxLength="30"
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+221 77 000 00 00"
          type="tel"
          value={phone}
        />

        <label htmlFor="location">Localité <span>(facultatif)</span></label>
        <input
          autoComplete="address-level2"
          id="location"
          maxLength="100"
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Commune, quartier ou pays"
          value={location}
        />

        <label htmlFor="message">Message <span>(facultatif)</span></label>
        <textarea
          id="message"
          maxLength="300"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Laissez un mot à l’équipe"
          rows="3"
          value={message}
        />

        <label className="checkbox-row payment-confirmation" htmlFor="paymentCompleted">
          <input
            checked={paymentCompleted}
            id="paymentCompleted"
            onChange={(event) => setPaymentCompleted(event.target.checked)}
            required
            type="checkbox"
          />
          <span>J’ai effectué ma contribution avec Wave</span>
        </label>

        <button className="button form-submit" disabled={!paymentCompleted} type="submit">
          Valider et envoyer sur WhatsApp
        </button>
      </form>
    </section>
  );
}
