import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { campaignOfferHTML } from '../v3/campaign-offer-view.mjs';

const offer = JSON.parse(fs.readFileSync(new URL('../data/campaigns/vitra-home-stories-for-winter.json', import.meta.url)));
const text = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('Home Stories shows every model, the chair price and the value of the free footstool, never a struck price', () => {
  const html = campaignOfferHTML(offer);
  assert.deepEqual(offer.models.map(m => m.name), ['Grand Relax', 'Repos', 'Grand Repos']);
  assert.doesNotMatch(html, /price-was|<s>|<del>/);
  for (const model of offer.models) for (const fabric of model.fabrics) {
    assert.ok(fabric.chair > 0 && fabric.offered.every(o => o.value > 0), fabric.name);
    assert.equal((html.match(new RegExp(`<th scope="row">${fabric.name}<`, 'g')) || []).length, offer.models.filter(m => m.fabrics.some(f => f.name === fabric.name)).length);
  }
  const words = text(html);
  assert.match(words, /Du 1er octobre 2026 au 31 janvier 2027/);
  assert.match(words, /avant le 27 novembre 2026/);
  assert.match(words, /dans la même configuration que le fauteuil/);
  assert.match(words, /Panchina offerte · valeur/);
  assert.match(words, /Ottoman offert · valeur/);
});
