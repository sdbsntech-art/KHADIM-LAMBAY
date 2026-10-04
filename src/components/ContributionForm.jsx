import { useEffect, useRef, useState } from 'react';
import { buildContributionWhatsAppUrl } from '../utils/whatsapp';

const DRAFT_STORAGE_KEY = 'ccj-wave-contribution-draft';

function clearWaveReturnParameters() {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('wave');
  currentUrl.searchParams.delete('reference');
  window.history.replaceState(
    {},
    '',
    `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
  );
}

async function requestPaymentStatus(reference) {
  const response = await fetch('/api/wave/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Impossible de vérifier le paiement auprès de Wave.');
  }
  return result;
}

export default function ContributionForm({ onSubmitContribution }) {
  const formRef = useRef(null);
  const [amount, setAmount] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentState, setPaymentState] = useState(() => (
    new URLSearchParams(window.location.search).get('wave') === 'cancelled' ? 'failed' : 'idle'
  ));
  const [paymentError, setPaymentError] = useState(() => (
    new URLSearchParams(window.location.search).get('wave') === 'cancelled'
      ? 'Le paiement Wave n’a pas abouti. Vous pouvez réessayer.'
      : ''
  ));
  const [verifiedContribution, setVerifiedContribution] = useState(null);

  const verifyPayment = async (reference, retry = false) => {
    setPaymentState('checking');
    setPaymentError('');

    try {
      for (let attempt = 0; attempt < (retry ? 6 : 15); attempt += 1) {
        const result = await requestPaymentStatus(reference);
        if (result.paymentStatus === 'succeeded') {
          const savedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
          if (!savedDraft) {
            throw new Error('Les informations du rapport ne sont plus disponibles dans cette session.');
          }

          const draft = JSON.parse(savedDraft);
          if (draft.reference !== reference) {
            throw new Error('La référence du paiement ne correspond pas au rapport en cours.');
          }

          setAmount(String(draft.amount));
          setFirstName(draft.firstName);
          setLastName(draft.lastName);
          setPhone(draft.phone);
          setLocation(draft.location);
          setMessage(draft.message);
          setIsAnonymous(draft.isAnonymous);
          setVerifiedContribution({
            ...draft,
            amount: result.amount,
            waveTransactionId: result.transactionId,
            date: result.completedAt || new Date().toISOString(),
          });
          clearWaveReturnParameters();
          setPaymentError('');
          setPaymentState('paid');
          return;
        }

        if (result.paymentStatus === 'cancelled' || result.checkoutStatus === 'expired') {
          clearWaveReturnParameters();
          setPaymentState('failed');
          setPaymentError('Le paiement Wave a été annulé ou a expiré. Vous pouvez recommencer.');
          return;
        }

        if (attempt < (retry ? 5 : 14)) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      setPaymentState('pending');
      setPaymentError('Wave n’a pas encore confirmé le paiement. Réessayez la vérification dans un instant.');
    } catch (error) {
      setPaymentState('pending');
      setPaymentError(error.message);
    }
  };

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const waveResult = currentUrl.searchParams.get('wave');
    const reference = currentUrl.searchParams.get('reference');
    if (!waveResult || !reference) return;

    if (waveResult === 'cancelled') return;

    window.setTimeout(() => void verifyPayment(reference), 0);
  }, []);

  const handleStartPayment = async () => {
    if (!formRef.current?.reportValidity()) return;
    setPaymentState('creating');
    setPaymentError('');

    try {
      const response = await fetch('/api/wave/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Impossible de démarrer le paiement Wave.');
      }

      const draft = {
        amount: Number(amount),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        message: message.trim(),
        isAnonymous,
        paymentMethod: 'Wave',
        reference: result.reference,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      window.location.assign(result.waveLaunchUrl);
    } catch (error) {
      setPaymentState('failed');
      setPaymentError(error.message);
    }
  };

  const handleReportSubmit = (event) => {
    event.preventDefault();
    if (!verifiedContribution || paymentState !== 'paid') return;

    const contribution = {
      ...verifiedContribution,
      fullName: verifiedContribution.isAnonymous
        ? 'Anonyme'
        : `${verifiedContribution.firstName} ${verifiedContribution.lastName}`.trim(),
      transactionRef: verifiedContribution.reference,
      whatsappUrl: buildContributionWhatsAppUrl(verifiedContribution),
    };

    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    onSubmitContribution(contribution);
  };

  return (
    <section className="form-section" id="form-section" aria-labelledby="form-title">
      <div className="form-intro">
        <p className="eyebrow">Contribution volontaire et confidentielle</p>
        <h2 id="form-title">Contribuer avec Wave</h2>
        <p>
          Choisissez librement votre montant. Le paiement est vérifié par Wave avant que le rapport
          puisse être envoyé au CCJ.
        </p>
      </div>

      <form className="contribution-form" onSubmit={handleReportSubmit} ref={formRef}>
        <label htmlFor="amount">Montant libre de la contribution (FCFA)</label>
        <input
          autoComplete="off"
          disabled={paymentState === 'paid'}
          id="amount"
          min="1"
          name="amount"
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Saisissez le montant de votre choix"
          required
          step="1"
          type="number"
          value={amount}
        />

        <label className="checkbox-row" htmlFor="anonymous">
          <input
            checked={isAnonymous}
            id="anonymous"
            onChange={(event) => {
              const anonymous = event.target.checked;
              setIsAnonymous(anonymous);
              if (anonymous) {
                setFirstName('');
                setLastName('');
              }
            }}
            disabled={paymentState === 'paid'}
            type="checkbox"
          />
          <span>Je souhaite contribuer anonymement</span>
        </label>
        <p className="field-help">
          Si vous choisissez l’anonymat, votre prénom et votre nom ne seront pas inclus dans le rapport WhatsApp.
        </p>

        {!isAnonymous && (
          <div className="field-pair">
            <div>
              <label htmlFor="firstName">Prénom *</label>
              <input
                autoComplete="given-name"
                disabled={paymentState === 'paid'}
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
                disabled={paymentState === 'paid'}
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
          disabled={paymentState === 'paid'}
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
          disabled={paymentState === 'paid'}
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
          disabled={paymentState === 'paid'}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Laissez un mot à l’équipe"
          rows="3"
          value={message}
        />

        <div className="wave-payment-card">
          <img src="/wave-payment-logo.png" alt="Wave" />
          <div>
            <strong>Paiement sécurisé avec Wave</strong>
            <p>Un lien de paiement personnel et un QR code sont générés pour cette contribution.</p>
          </div>
        </div>

        {paymentError && (
          <p aria-live="polite" className={`payment-notice ${paymentState === 'paid' ? 'success' : 'error'}`}>
            {paymentError}
          </p>
        )}
        {paymentState === 'paid' && (
          <p aria-live="polite" className="payment-notice success">
            Paiement confirmé par Wave. Vous pouvez maintenant envoyer votre rapport.
          </p>
        )}

        {paymentState === 'pending' && verifiedContribution === null && (
          <button
            className="button button-secondary"
            onClick={() => {
              const currentUrl = new URL(window.location.href);
              const reference = currentUrl.searchParams.get('reference')
                || JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY) || 'null')?.reference;
              if (reference) void verifyPayment(reference, true);
            }}
            type="button"
          >
            Vérifier à nouveau le paiement
          </button>
        )}

        {paymentState === 'idle' || paymentState === 'failed' ? (
          <button
            className="button form-submit"
            onClick={handleStartPayment}
            type="button"
          >
            Payer avec Wave
          </button>
        ) : paymentState === 'paid' ? (
          <button className="button form-submit" type="submit">
            Valider et envoyer le rapport sur WhatsApp
          </button>
        ) : (
          <p aria-live="polite" className="payment-notice">
            {paymentState === 'creating' ? 'Préparation du paiement…' : 'Vérification Wave en cours…'}
          </p>
        )}

        <p className="form-privacy">
          Le rapport ne peut être envoyé qu’après confirmation du paiement par l’API Wave.
          Aucune clé secrète n’est transmise au navigateur. Le formulaire reste temporairement dans
          cet onglet pendant le paiement ; le serveur conserve uniquement les références, le montant
          et le statut du paiement.
        </p>
      </form>
    </section>
  );
}
