export default function Header({ onDonateClick }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="CCJ Lambaye, accueil">
        <img src="/ccj-flyer-logo.png" alt="Logo du CCJ Lambaye" />
        <span>
          <strong>CCJ Lambaye</strong>
          <small>Jeunesse engagée, territoire durable</small>
        </span>
      </a>
      <button className="button button-small" onClick={onDonateClick} type="button">
        Je contribue
      </button>
    </header>
  );
}
