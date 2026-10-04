const actions = [
  {
    title: 'Set-Setal',
    description: 'Nettoyage des écoles, du poste de santé et des quartiers.',
  },
  {
    title: 'Reboisement',
    description: 'Plantation d’arbres pour un cadre de vie plus vert.',
  },
  {
    title: 'Sensibilisation',
    description: 'Actions autour de l’hygiène et de la santé publique.',
  },
];

export default function NeedsBreakdown() {
  return (
    <section className="actions-section" aria-labelledby="actions-title">
      <div className="section-heading">
        <p className="eyebrow">Nos actions</p>
        <h2 id="actions-title">À quoi servira votre soutien ?</h2>
        <p>Les contributions volontaires aident à organiser ces activités avec les jeunes de Lambaye.</p>
      </div>
      <div className="action-grid">
        {actions.map((action) => (
          <article className="action-card" key={action.title}>
            <h3>{action.title}</h3>
            <p>{action.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
