import { buildContributionWhatsAppUrl } from '../utils/whatsapp';

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
          <div><dt>Référence du rapport</dt><dd>{data.reference || data.transactionRef}</dd></div>
          <div><dt>Date</dt><dd>{formattedDate}</dd></div>
          <div><dt>Contributeur</dt><dd>{data.isAnonymous ? 'Anonyme' : `${data.firstName} ${data.lastName}`.trim()}</dd></div>
          {data.phone && <div><dt>Téléphone</dt><dd>{data.phone}</dd></div>}
          {data.location && <div><dt>Localité</dt><dd>{data.location}</dd></div>}
          <div><dt>Moyen de transfert</dt><dd>{data.paymentMethod}</dd></div>
        </dl>

        <p className="receipt-status">
          Merci pour votre contribution. Vous pouvez envoyer ce rapport au CCJ dans WhatsApp.
        </p>
        <div className="receipt-actions">
          <a
            className="button"
            href={buildContributionWhatsAppUrl(data)}
            rel="noreferrer"
            target="_blank"
          >
            Envoyer le rapport sur WhatsApp
          </a>
          <button className="button button-secondary" onClick={onClose} type="button">Fermer</button>
        </div>
      </section>
    </div>
  );
}
