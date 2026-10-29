// Popup newsletter (ADR 0017) : règles d'ouverture, sans navigateur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { popupAllowed, nextSession, STORE_KEY, SESSION_KEY } from '../v3/newsletter-popup.mjs';

const config = JSON.parse(readFileSync(new URL('../data/newsletter.json', import.meta.url), 'utf8')).popup;
const DAY = 86_400_000;
const now = Date.parse('2026-11-20T10:00:00+01:00');

test('data/newsletter.json : réglages complets, photo légère, pages exclues', () => {
  assert.equal(config.enabled, true);
  assert.equal(config.offer, '10 %');
  for (const key of ['delaySeconds', 'pageViews', 'exitIntentSeconds', 'closedDays']) assert.ok(Number.isInteger(config[key]) && config[key] > 0, key);
  for (const p of ['/selection.html', '/conditions-generales-de-vente.html', '/politique-et-vie-privee.html']) assert.ok(config.excludedPaths.includes(p), p);
  for (const photo of [config.photo, config.photoMobile]) {
    const file = new URL('../v3' + photo, import.meta.url);
    assert.ok(readFileSync(file).length <= 150 * 1024, photo + ' ≤ 150 Ko');
  }
  assert.ok(STORE_KEY && SESSION_KEY);
});

test('jamais sur le panier, le compte ni les pages légales ; jamais pour un navigateur automatisé', () => {
  assert.equal(popupAllowed({ path: '/selection.html', config, now }).allowed, false);
  assert.equal(popupAllowed({ path: '/compte/commandes', config, now }).allowed, false);
  assert.equal(popupAllowed({ path: '/politique-cookies.html', config, now }).allowed, false);
  assert.equal(popupAllowed({ path: '/produits.html', config, now, webdriver: true }).allowed, false);
  assert.equal(popupAllowed({ path: '/produits.html', config, now }).allowed, true);
  assert.equal(popupAllowed({ path: '/produits.html', config: { ...config, enabled: false }, now }).allowed, false);
});

test('le souvenir : 30 jours après une fermeture, pour toujours après une inscription, et depuis le mail de bienvenue', () => {
  assert.equal(popupAllowed({ path: '/', config, now, memory: { closedAt: now - 10 * DAY } }).allowed, false);
  assert.equal(popupAllowed({ path: '/', config, now, memory: { closedAt: now - 31 * DAY } }).allowed, true);
  assert.equal(popupAllowed({ path: '/', config, now, memory: { subscribed: true, at: now - 400 * DAY } }).allowed, false);
  const fromMail = popupAllowed({ path: '/', search: '?utm_source=shopify&utm_medium=email-bienvenue', config, now });
  assert.equal(fromMail.allowed, false);
  assert.deepEqual(fromMail.remember, { subscribed: true });
  const fromNewsletter = popupAllowed({ path: '/collections/idees-cadeaux', search: '?utm_source=shopify_email&utm_medium=email&utm_campaign=noel', config, now });
  assert.equal(fromNewsletter.allowed, false, 'un clic depuis la newsletter ne propose pas de s’inscrire');
  assert.deepEqual(fromNewsletter.remember, { subscribed: true });
  assert.equal(popupAllowed({ path: '/', search: '?utm_source=instagram&utm_medium=social', config, now }).allowed, true);
  assert.equal(popupAllowed({ path: '/selection.html', config, now, memory: { subscribed: true }, force: true }).allowed, true, '?newsletter=1 force l’ouverture pour vérifier');
});

test('une seule fois par visite : à la 2e page, ou après le délai sur la 1re', () => {
  const first = nextSession(null, config);
  assert.deepEqual(first, { views: 1, shown: false, trigger: 'delay' });
  const second = nextSession({ views: 1, shown: false }, config);
  assert.deepEqual(second, { views: 2, shown: false, trigger: 'page' });
  assert.equal(nextSession({ views: 2, shown: true }, config).trigger, null, 'déjà montrée pendant cette visite');
  assert.equal(nextSession({ views: 'x', shown: false }, config).views, 1, 'compteur illisible : on repart de 1');
});

test('ouverture 5 secondes après l’arrivée (décision de Cyril du 13/10/2026 ; le cahier des charges disait 25)', () => {
  assert.equal(config.delaySeconds, 5);
});
