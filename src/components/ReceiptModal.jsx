import { buildContributionWhatsAppUrl, CONTRIBUTION_PHONE_DISPLAY } from '../utils/whatsapp';

export default function ReceiptModal({ data, onClose }) {
  const formattedDate = new Date(data.date).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-labelledby="receipt-title"
        aria-modal="true"
        className="receipt-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label="Fermer" className="modal-close" onClick={onClose} type="button">×</button>
        <p className="eyebrow">Récapitulatif privé</p>
        <h2 id="receipt-title">Votre message WhatsApp est prêt</h2>
        <p className="receipt-intro">
          WhatsApp s’est ouvert avec votre déclaration préremplie. Appuyez sur « Envoyer » dans
          WhatsApp pour la transmettre au CCJ.
        </p>

        <dl className="receipt-details">
          <div><dt>Référence</dt><dd>{data.transactionRef}</dd></div>
          <div><dt>Date</dt><dd>{formattedDate}</dd></div>
          <div><dt>Nom</dt><dd>{data.fullName || 'Anonyme'}</dd></div>
          <div><dt>Moyen de transfert</dt><dd>{data.paymentMethod}</dd></div>
          <div><dt>Destinataire</dt><dd>{CONTRIBUTION_PHONE_DISPLAY}</dd></div>
        </dl>

        <p className="receipt-status">
          Ce récapitulatif n’est pas une preuve de paiement. Votre transfert doit être vérifié par
          l’équipe du CCJ.
        </p>
        <div className="receipt-actions">
          <a
            className="button"
            href={buildContributionWhatsAppUrl(data)}
            rel="noreferrer"
            target="_blank"
          >
            Rouvrir WhatsApp
          </a>
          <button className="button button-secondary" onClick={onClose} type="button">Fermer</button>
        </div>
      </section>
    </div>
  );
}
