import { useState } from 'react';
import { buildContributionWhatsAppUrl } from '../utils/whatsapp';

const WAVE_PAYMENT_URL = 'https://pay.wave.com/m/M_sn_iRpPVxT7n-Ey/c/sn/';
const WAVE_PAYMENT_STARTED_KEY = 'ccj-wave-payment-started';
const CONTRIBUTION_DRAFT_KEY = 'ccj-contribution-draft';

function readContributionDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(CONTRIBUTION_DRAFT_KEY) || 'null') || {};
  } catch {
    return {};
  }
}

const savedDraft = readContributionDraft();

export default function ContributionForm({ onSubmitContribution }) {
  const [firstName, setFirstName] = useState(savedDraft.firstName || '');
  const [lastName, setLastName] = useState(savedDraft.lastName || '');
  const [phone, setPhone] = useState(savedDraft.phone || '');
  const [location, setLocation] = useState(savedDraft.location || '');
  const [message, setMessage] = useState(savedDraft.message || '');
  const [isAnonymous, setIsAnonymous] = useState(savedDraft.isAnonymous || false);
  const [waveOpened, setWaveOpened] = useState(
    sessionStorage.getItem(WAVE_PAYMENT_STARTED_KEY) === 'true',
  );
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const handleWaveRedirect = () => {
    sessionStorage.setItem(WAVE_PAYMENT_STARTED_KEY, 'true');
    sessionStorage.setItem(CONTRIBUTION_DRAFT_KEY, JSON.stringify({
      firstName,
      lastName,
      phone,
      location,
      message,
      isAnonymous,
    }));
    setWaveOpened(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!waveOpened || !paymentCompleted) return;

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

    sessionStorage.removeItem(WAVE_PAYMENT_STARTED_KEY);
    sessionStorage.removeItem(CONTRIBUTION_DRAFT_KEY);
    onSubmitContribution({ ...contribution, whatsappUrl: buildContributionWhatsAppUrl(contribution) });
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
          onClick={handleWaveRedirect}
        >
          <img src="/wave-payment-qr.png" alt="QR code Wave pour payer Zayel Khalifa" />
        </a>
        <div className="wave-payment-details">
          <img className="wave-app-icon" src="/wave-app-icon.png" alt="" />
          <h3>Contribuer avec Wave</h3>
          <p>Scannez le QR code ou ouvrez le lien de paiement.</p>
          <a className="button wave-link-button" href={WAVE_PAYMENT_URL} onClick={handleWaveRedirect}>
            Contribuer avec Wave
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

        <label className={`checkbox-row payment-confirmation ${!waveOpened ? 'disabled' : ''}`} htmlFor="paymentCompleted">
          <input
            checked={paymentCompleted}
            disabled={!waveOpened}
            id="paymentCompleted"
            onChange={(event) => setPaymentCompleted(event.target.checked)}
            required
            type="checkbox"
          />
          <span>{waveOpened ? 'Je suis revenu de Wave et j’ai effectué ma contribution' : 'Ouvrez d’abord Wave pour effectuer votre contribution'}</span>
        </label>

        <button className="button form-submit whatsapp-submit" disabled={!waveOpened || !paymentCompleted} type="submit">
          <img src="/wave-app-icon.png" alt="" />
          Valider et envoyer sur WhatsApp
        </button>
      </form>
    </section>
  );
}
