export const CONTRIBUTION_PHONE = '221777161933';
export const CONTRIBUTION_PHONE_DISPLAY = '77 716 19 33';

export function buildContributionWhatsAppUrl(data) {
  const lines = [
    'Bonjour, je souhaite déclarer une contribution volontaire au CCJ Lambaye.',
    '',
    `Moyen de transfert : ${data.paymentMethod}`,
    `Nom : ${data.fullName || 'Anonyme'}`,
    `Référence : ${data.transactionRef}`,
    data.message ? `Message : ${data.message}` : '',
    '',
    'Merci de confirmer la réception de mon transfert.',
  ].filter(Boolean);

  return `https://wa.me/${CONTRIBUTION_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
}
