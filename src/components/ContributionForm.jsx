import { useState } from 'react';
import { buildContributionWhatsAppUrl, CONTRIBUTION_PHONE_DISPLAY } from '../utils/whatsapp';

export default function ContributionForm({ onSubmitContribution }) {
  const [fullName, setFullName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Wave');
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const contribution = {
      fullName: fullName.trim(),
      paymentMethod,
      message: message.trim(),
      date: new Date().toISOString(),
      transactionRef: `CCJ-${Date.now().toString().slice(-8)}`,
    };

    onSubmitContribution({
      ...contribution,
      whatsappUrl: buildContributionWhatsAppUrl(contribution),
    });
  };

  return (
    <section className="form-section" id="form-section" aria-labelledby="form-title">
      <div className="form-intro">
        <p className="eyebrow">Contribution confidentielle</p>
        <h2 id="form-title">Soutenir à votre manière</h2>
        <p>Votre contribution est entièrement volontaire. Effectuez le transfert directement au numéro indiqué, puis envoyez-nous votre message.</p>
      </div>

      <form className="contribution-form" onSubmit={handleSubmit}>
        <label htmlFor="fullName">Nom ou pseudonyme <span>(facultatif)</span></label>
        <input
          autoComplete="name"
          id="fullName"
          maxLength="80"
          name="fullName"
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Vous pouvez rester anonyme"
          value={fullName}
        />

        <label htmlFor="paymentMethod">Moyen de transfert</label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          onChange={(event) => setPaymentMethod(event.target.value)}
          value={paymentMethod}
        >
          <option>Wave</option>
          <option>Orange Money</option>
          <option>Autre moyen</option>
        </select>

        <label htmlFor="message">Message <span>(facultatif)</span></label>
        <textarea
          id="message"
          maxLength="300"
          name="message"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Laissez un mot à l’équipe"
          rows="3"
          value={message}
        />

        <div className="recipient-note">
          <span>Numéro de réception</span>
          <a href="tel:+221777161933">{CONTRIBUTION_PHONE_DISPLAY}</a>
          <p>Effectuez votre transfert à ce numéro, puis envoyez votre déclaration par WhatsApp.</p>
        </div>

        <button className="button form-submit" type="submit">
          Continuer sur WhatsApp
        </button>
        <p className="form-privacy">
          Vos informations ne sont pas enregistrées sur ce site ni publiées. WhatsApp vous demandera
          de confirmer l’envoi du message.
        </p>
      </form>
    </section>
  );
}
