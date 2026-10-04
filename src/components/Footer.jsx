import { CCJ_WHATSAPP_DISPLAY, CCJ_WHATSAPP_NUMBER } from '../utils/whatsapp';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>CCJ Lambaye</strong>
        <p>Des jeunes mobilisés pour un village propre, vert et en bonne santé.</p>
      </div>
      <a href={`https://wa.me/${CCJ_WHATSAPP_NUMBER}`} rel="noreferrer" target="_blank">
        WhatsApp · {CCJ_WHATSAPP_DISPLAY}
      </a>
    </footer>
  );
}
