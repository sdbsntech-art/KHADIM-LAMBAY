import { createHmac } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { isWaveCheckoutPaid, validWaveWebhookSignature } from './server.js';

const record = {
  amount: '7500',
  reference: 'CCJ-a2a5bcca-5c0a-46df-83d3-3a7be3ae807c',
  sessionId: 'cos-123456',
};

function createSignature(body, timestamp, secret) {
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}${body}`)
    .digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

test('Wave webhook signature accepts a valid recent signature', () => {
  const now = Date.now();
  const timestamp = Math.floor(now / 1000);
  const secret = 'test-webhook-secret';
  const body = '{"type":"checkout.session.completed"}';

  assert.equal(validWaveWebhookSignature(createSignature(body, timestamp, secret), body, secret, now), true);
});

test('Wave webhook signature rejects altered bodies and stale timestamps', () => {
  const now = Date.now();
  const timestamp = Math.floor(now / 1000);
  const secret = 'test-webhook-secret';
  const body = '{"type":"checkout.session.completed"}';
  const signature = createSignature(body, timestamp, secret);

  assert.equal(validWaveWebhookSignature(signature, `${body} `, secret, now), false);
  assert.equal(
    validWaveWebhookSignature(createSignature(body, timestamp - 301, secret), body, secret, now),
    false,
  );
});

test('Wave checkout is accepted only when its id, reference, amount and payment all match', () => {
  const paidSession = {
    amount: record.amount,
    checkout_status: 'complete',
    client_reference: record.reference,
    currency: 'XOF',
    id: record.sessionId,
    payment_status: 'succeeded',
    transaction_id: 'T-123',
  };

  assert.equal(isWaveCheckoutPaid(paidSession, record), true);
  assert.equal(isWaveCheckoutPaid({ ...paidSession, payment_status: 'processing' }, record), false);
  assert.equal(isWaveCheckoutPaid({ ...paidSession, amount: '7000' }, record), false);
  assert.equal(isWaveCheckoutPaid({ ...paidSession, id: 'cos-other' }, record), false);
});
