import { CONTRIBUTION_PHONE_DISPLAY } from '../utils/whatsapp';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>CCJ Lambaye</strong>
        <p>Des jeunes mobilisés pour un village propre, vert et en bonne santé.</p>
      </div>
      <a href="https://wa.me/221777161933" rel="noreferrer" target="_blank">
        WhatsApp · {CONTRIBUTION_PHONE_DISPLAY}
      </a>
    </footer>
  );
}
