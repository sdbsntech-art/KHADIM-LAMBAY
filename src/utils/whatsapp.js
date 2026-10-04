export const CCJ_WHATSAPP_NUMBER = '221777161933';
export const CCJ_WHATSAPP_DISPLAY = '77 716 19 33';

export function buildContributionWhatsAppUrl(data) {
  const lines = [
    'RAPPORT DE CONTRIBUTION VOLONTAIRE — CCJ LAMBAYE',
    '',
    `Contributeur : ${data.isAnonymous ? 'Anonyme' : `${data.firstName} ${data.lastName}`.trim()}`,
    data.phone ? `Téléphone : ${data.phone}` : '',
    data.location ? `Localité : ${data.location}` : '',
    `Montant versé : ${Number(data.amount).toLocaleString('fr-FR')} FCFA`,
    `Moyen de paiement : ${data.paymentMethod}`,
    `Référence du rapport : ${data.reference || data.transactionRef}`,
    data.waveTransactionId ? `Transaction Wave : ${data.waveTransactionId}` : '',
    data.message ? `Message : ${data.message}` : '',
    '',
    'Paiement confirmé par Wave.',
  ].filter(Boolean);

  return `https://wa.me/${CCJ_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}
