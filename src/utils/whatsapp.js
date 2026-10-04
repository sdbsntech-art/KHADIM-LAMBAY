export const CCJ_WHATSAPP_NUMBER = '221777161933';
export const CCJ_WHATSAPP_DISPLAY = '77 716 19 33';

export function buildContributionWhatsAppUrl(data) {
  const lines = [
    'RAPPORT DE CONTRIBUTION VOLONTAIRE — CCJ LAMBAYE',
    '',
    `Contributeur : ${data.isAnonymous ? 'Anonyme' : `${data.firstName} ${data.lastName}`.trim()}`,
    data.phone ? `Téléphone : ${data.phone}` : '',
    data.location ? `Localité : ${data.location}` : '',
    `Moyen de paiement : ${data.paymentMethod}`,
    `Référence du rapport : ${data.reference || data.transactionRef}`,
    data.message ? `Message : ${data.message}` : '',
  ].filter(Boolean);

  return `https://wa.me/${CCJ_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}
