import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const distRoot = join(projectRoot, 'dist');
const recordsFile = process.env.WAVE_SESSIONS_FILE || join(projectRoot, 'data', 'wave-sessions.json');
const apiKey = process.env.WAVE_API_KEY;
const requestSigningSecret = process.env.WAVE_REQUEST_SIGNING_SECRET;
const webhookSecret = process.env.WAVE_WEBHOOK_SECRET;
const records = loadRecords();
const rateLimits = new Map();
const bodyLimit = 4096;

function loadRecords() {
  try {
    const parsed = JSON.parse(readFileSync(recordsFile, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Wave session store must contain a JSON object.');
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

function persistRecords() {
  mkdirSync(dirname(recordsFile), { recursive: true });
  const temporaryFile = `${recordsFile}.tmp`;
  writeFileSync(temporaryFile, JSON.stringify(records), { mode: 0o600 });
  renameSync(temporaryFile, recordsFile);
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  if (!request.headers['content-type']?.toLowerCase().includes('application/json')) {
    const error = new Error('Content-Type must be application/json.');
    error.status = 415;
    throw error;
  }

  let rawBody = '';
  for await (const chunk of request) {
    rawBody += chunk;
    if (Buffer.byteLength(rawBody) > bodyLimit) {
      const error = new Error('Request body is too large.');
      error.status = 413;
      throw error;
    }
  }

  try {
    const value = JSON.parse(rawBody);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Expected a JSON object.');
    }
    return value;
  } catch {
    const error = new Error('Invalid JSON request body.');
    error.status = 400;
    throw error;
  }
}

function enforceSameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;

  const remoteAddress = request.socket.remoteAddress;
  const isLocalRequest = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteAddress);
  const isLocalDevOrigin = process.env.NODE_ENV !== 'production'
    && isLocalRequest
    && ['http://127.0.0.1:5173', 'http://localhost:5173'].includes(origin);
  if (isLocalDevOrigin) return true;

  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

function enforceRateLimit(request, response, key, limit) {
  const now = Date.now();
  const client = request.socket.remoteAddress || 'unknown';
  const entry = rateLimits.get(`${client}:${key}`);
  if (entry && entry.resetAt > now && entry.count >= limit) {
    sendJson(response, 429, { error: 'Trop de tentatives. Veuillez patienter avant de réessayer.' });
    return false;
  }

  if (!entry || entry.resetAt <= now) {
    rateLimits.set(`${client}:${key}`, { count: 1, resetAt: now + 60_000 });
  } else {
    entry.count += 1;
  }

  return true;
}

function makeWaveSignature(body) {
  if (!requestSigningSecret) return null;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const digest = createHmac('sha256', requestSigningSecret)
    .update(timestamp + body)
    .digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

async function waveRequest(path, { method = 'GET', body } = {}) {
  if (!apiKey) {
    const error = new Error('WAVE_API_KEY is not configured.');
    error.status = 503;
    throw error;
  }

  const rawBody = body === undefined ? '' : JSON.stringify(body);
  const headers = { Authorization: `Bearer ${apiKey}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const signature = makeWaveSignature(rawBody);
  if (signature) headers['Wave-Signature'] = signature;

  let result;
  try {
    result = await fetch(`https://api.wave.com${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : rawBody,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (cause) {
    const error = new Error('Wave API could not be reached.', { cause });
    error.status = 502;
    throw error;
  }
  const responseText = await result.text();
  let responseBody;
  try {
    responseBody = JSON.parse(responseText);
  } catch {
    responseBody = null;
  }

  if (!result.ok) {
    console.error(`Wave API returned HTTP ${result.status} for ${method} ${path}.`);
    const error = new Error('Wave n’a pas pu traiter la demande. Vérifiez la configuration de l’API.');
    error.status = 502;
    throw error;
  }
  if (!responseBody || typeof responseBody !== 'object') {
    const error = new Error('Wave API returned an invalid response.');
    error.status = 502;
    throw error;
  }
  return responseBody;
}

function getAppBaseUrl() {
  const configuredUrl = process.env.APP_BASE_URL;
  if (!configuredUrl) {
    const error = new Error('APP_BASE_URL is not configured.');
    error.status = 503;
    throw error;
  }

  let baseUrl;
  try {
    baseUrl = new URL(configuredUrl);
  } catch {
    const error = new Error('APP_BASE_URL must be a valid absolute URL.');
    error.status = 503;
    throw error;
  }
  if (baseUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(baseUrl.hostname)) {
    const error = new Error('APP_BASE_URL must use HTTPS.');
    error.status = 503;
    throw error;
  }
  return baseUrl;
}

function isWaveCheckoutPaid(session, record) {
  return Boolean(
    session
      && session.id === record.sessionId
      && session.client_reference === record.reference
      && session.payment_status === 'succeeded'
      && session.amount === record.amount
      && session.currency === 'XOF'
      && typeof session.transaction_id === 'string'
      && session.transaction_id.length > 0,
  );
}

function validWaveWebhookSignature(signature, body, secret, now = Date.now()) {
  if (!signature || !secret) return false;
  const parts = signature.split(',').map((part) => part.trim());
  const timestampValue = parts.find((part) => part.startsWith('t='))?.slice(2);
  const timestamp = Number(timestampValue);
  const nowSeconds = Math.floor(now / 1000);
  if (!Number.isSafeInteger(timestamp) || nowSeconds - timestamp > 300 || timestamp - nowSeconds > 30) {
    return false;
  }

  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3));
  const expected = createHmac('sha256', secret)
    .update(`${timestampValue}${body}`)
    .digest();

  return signatures.some((candidate) => {
    if (!/^[a-f0-9]{64}$/i.test(candidate)) return false;
    return timingSafeEqual(Buffer.from(candidate, 'hex'), expected);
  });
}

function saveCheckoutRecord(record) {
  records[record.reference] = record;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const [reference, savedRecord] of Object.entries(records)) {
    if (!savedRecord.createdAt || Date.parse(savedRecord.createdAt) < cutoff) {
      delete records[reference];
    }
  }
  persistRecords();
}

async function handleCreateCheckout(request, response) {
  if (!enforceSameOrigin(request)) {
    sendJson(response, 403, { error: 'Origine de la requête refusée.' });
    return;
  }
  if (!enforceRateLimit(request, response, 'checkout', 10)) return;

  const { amount } = await readJsonBody(request);
  const amountText = String(amount ?? '');
  if (!/^[1-9]\d{0,14}$/.test(amountText)) {
    sendJson(response, 400, { error: 'Saisissez un montant entier positif en FCFA.' });
    return;
  }

  const reference = `CCJ-${randomUUID()}`;
  const baseUrl = getAppBaseUrl();
  const successUrl = new URL('/', baseUrl);
  successUrl.searchParams.set('wave', 'success');
  successUrl.searchParams.set('reference', reference);
  const errorUrl = new URL('/', baseUrl);
  errorUrl.searchParams.set('wave', 'cancelled');
  errorUrl.searchParams.set('reference', reference);

  const session = await waveRequest('/v1/checkout/sessions', {
    method: 'POST',
    body: {
      amount: amountText,
      currency: 'XOF',
      client_reference: reference,
      success_url: successUrl.toString(),
      error_url: errorUrl.toString(),
    },
  });

  const launchUrl = new URL(session.wave_launch_url);
  if (launchUrl.protocol !== 'https:' || launchUrl.hostname !== 'pay.wave.com'
    || typeof session.id !== 'string' || !session.id.startsWith('cos-')) {
    throw new Error('Wave API returned an invalid checkout session.');
  }

  saveCheckoutRecord({
    amount: amountText,
    createdAt: new Date().toISOString(),
    reference,
    sessionId: session.id,
  });
  sendJson(response, 201, { reference, waveLaunchUrl: launchUrl.toString() });
}

async function handlePaymentStatus(request, response) {
  if (!enforceSameOrigin(request)) {
    sendJson(response, 403, { error: 'Origine de la requête refusée.' });
    return;
  }
  if (!enforceRateLimit(request, response, 'status', 40)) return;

  const { reference } = await readJsonBody(request);
  if (typeof reference !== 'string' || !/^CCJ-[\da-f-]{36}$/i.test(reference)) {
    sendJson(response, 400, { error: 'Référence de paiement invalide.' });
    return;
  }
  const record = records[reference];
  if (!record) {
    sendJson(response, 404, { error: 'Session Wave inconnue ou expirée.' });
    return;
  }

  const session = await waveRequest(`/v1/checkout/sessions/${encodeURIComponent(record.sessionId)}`);
  if (!isWaveCheckoutPaid(session, record)) {
    sendJson(response, 200, {
      checkoutStatus: session.checkout_status,
      paymentStatus: session.payment_status,
    });
    return;
  }

  record.paymentStatus = 'succeeded';
  record.transactionId = session.transaction_id;
  record.completedAt = session.when_completed;
  persistRecords();
  sendJson(response, 200, {
    amount: Number(session.amount),
    checkoutStatus: session.checkout_status,
    completedAt: session.when_completed,
    paymentStatus: session.payment_status,
    transactionId: session.transaction_id,
  });
}

async function handleWaveWebhook(request, response) {
  if (!webhookSecret) {
    sendJson(response, 503, { error: 'WAVE_WEBHOOK_SECRET is not configured.' });
    return;
  }

  let rawBody = '';
  for await (const chunk of request) {
    rawBody += chunk;
    if (Buffer.byteLength(rawBody) > 64_000) {
      sendJson(response, 413, { error: 'Webhook payload is too large.' });
      return;
    }
  }
  if (!validWaveWebhookSignature(request.headers['wave-signature'], rawBody, webhookSecret)) {
    sendJson(response, 401, { error: 'Signature Wave invalide.' });
    return;
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    sendJson(response, 400, { error: 'Webhook JSON invalide.' });
    return;
  }
  if (event.type === 'checkout.session.completed' && event.data?.payment_status === 'succeeded') {
    const data = event.data;
    const record = records[data.client_reference];
    if (record && isWaveCheckoutPaid(data, record)) {
      record.paymentStatus = 'succeeded';
      record.transactionId = data.transaction_id;
      record.completedAt = data.when_completed;
      persistRecords();
    }
  }

  sendJson(response, 200, { received: true });
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

async function serveStatic(pathname, response) {
  let requestedPath;
  try {
    requestedPath = decodeURIComponent(pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.slice(1);
  let filePath = resolve(distRoot, relativePath);
  if (!filePath.startsWith(`${distRoot}${sep}`) && filePath !== distRoot) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const content = readFileSync(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(content);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    if (extname(relativePath)) {
      response.writeHead(404).end('Not found');
      return;
    }
    filePath = join(distRoot, 'index.html');
    response.writeHead(200, { 'Content-Type': contentTypes['.html'] });
    response.end(readFileSync(filePath));
  }
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, 'http://localhost');
  if (requestUrl.pathname === '/api/wave/checkout' && request.method === 'POST') {
    await handleCreateCheckout(request, response);
    return;
  }
  if (requestUrl.pathname === '/api/wave/status' && request.method === 'POST') {
    await handlePaymentStatus(request, response);
    return;
  }
  if (requestUrl.pathname === '/api/wave/webhook' && request.method === 'POST') {
    await handleWaveWebhook(request, response);
    return;
  }
  if (requestUrl.pathname.startsWith('/api/')) {
    sendJson(response, 404, { error: 'Route API inconnue.' });
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405).end('Method not allowed');
    return;
  }
  await serveStatic(requestUrl.pathname, response);
}

export { isWaveCheckoutPaid, validWaveWebhookSignature };

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 8787);
  const server = createServer((request, response) => {
    void handleRequest(request, response).catch((error) => {
      console.error('Request failed:', error);
      if (!response.headersSent) {
        sendJson(response, error.status || 500, {
          error: error.status === 503
            ? error.message
            : 'Une erreur est survenue. Veuillez réessayer.',
        });
      } else {
        response.destroy();
      }
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`CCJ site and Wave API server listening on port ${port}.`);
    if (!apiKey) console.warn('WAVE_API_KEY is not configured; Wave checkout is unavailable.');
  });
}
