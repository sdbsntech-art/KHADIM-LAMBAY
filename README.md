# Contributions du CCJ Lambaye

Application React/Vite avec un serveur Node.js qui crée et vérifie des sessions Wave Checkout. Le rapport WhatsApp ne peut être envoyé qu'après confirmation côté serveur d'un paiement Wave réussi.

## Configuration Wave

1. Créer une clé API Checkout dans le portail Wave Business. Conserver la clé uniquement dans `.env` ou dans le gestionnaire de secrets de l'hébergeur, jamais dans le navigateur ni dans Git.
2. Copier `.env.example` vers `.env`, puis renseigner `WAVE_API_KEY` et l'adresse publique HTTPS du site dans `APP_BASE_URL`.
3. Pour les notifications instantanées, configurer dans le portail Wave un webhook HTTPS pointant vers `https://votre-domaine/api/wave/webhook`, s'abonner à `checkout.session.completed` et définir le secret correspondant dans `WAVE_WEBHOOK_SECRET`. Au retour du paiement, le site vérifie aussi la session directement auprès de l'API Wave.
4. Héberger l'application sur un serveur Node.js avec stockage persistant pour le dossier `data/`. Le lien/QR statique fourni ne permet pas d'associer un paiement à un rapport : le serveur génère une session et son QR Wave distincts pour chaque contribution.

## Développement

Installer les dépendances avec `npm install`, puis configurer `.env`. Lancer `npm run dev:api` dans un terminal et `npm run dev` dans un autre.

## Production

Lancer `npm run build`, puis `npm start`. Le serveur Node sert les fichiers compilés et les routes `/api/wave/*`. La plateforme d'hébergement doit conserver les sessions enregistrées dans `data/` (ou fournir un chemin persistant via `WAVE_SESSIONS_FILE`).

## Vérifications

`npm test`, `npm run lint` et `npm run build`.
