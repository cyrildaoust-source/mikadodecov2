// Offre Vitra Home Stories for Winter : repose-pieds offert, présenté par sa valeur
// (jamais par un prix de fauteuil barré). Données : data/campaigns/vitra-home-stories-for-winter.json.
import { euro, escapeHtml } from './format.mjs';

const ZONE = 'Europe/Brussels';
function frenchDate(iso, { lastDay = false } = {}) {
  const date = new Date(new Date(iso).getTime() - (lastDay ? 1 : 0));
  const parts = Object.fromEntries(new Intl.DateTimeFormat('fr-BE', { timeZone: ZONE, day: 'numeric', month: 'long', year: 'numeric' })
    .formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.day === '1' ? '1er' : parts.day} ${parts.month} ${parts.year}`;
}
const offered = ({ footstool, value }) => `${footstool} ${footstool === 'Panchina' ? 'offerte' : 'offert'} · valeur ${euro(value)}`;
const range = (values, format = euro) => {
  const min = Math.min(...values), max = Math.max(...values);
  return min === max ? format(min) : `de ${format(min)} à ${format(max)}`;
};

function modelHTML(model) {
  const types = [...new Set(model.fabrics.flatMap(f => f.offered.map(o => o.footstool)))];
  const gifts = types.map(type => {
    const values = model.fabrics.flatMap(f => f.offered.filter(o => o.footstool === type).map(o => o.value));
    return `${type} ${type === 'Panchina' ? 'offerte' : 'offert'} (valeur ${range(values)})`;
  }).join(' ou ') + (types.length > 1 ? ', au choix' : '');
  const colors = model.fabrics.map(f => f.colors);
  const config = [
    `${model.fabrics.length} revêtements, ${range(colors, String)} coloris`,
    model.bases.length ? `piètement ${model.bases.map(b => b.toLowerCase()).join(' ou ')}` : '',
    model.backLeathers.length ? `cuir du dos en ${model.backLeathers.length} teintes` : '',
  ].filter(Boolean).join(' · ');
  const rows = model.fabrics.map(f => `<tr>
      <th scope="row">${escapeHtml(f.name)}<span>${f.colors} coloris</span></th>
      <td>${euro(f.chair)}</td>
      <td>${f.offered.map(o => `<span>${escapeHtml(offered(o))}</span>`).join('')}</td>
    </tr>`).join('');
  return `<article class="campaign-offer__model">
    <h3 class="serif">${escapeHtml(model.name)}</h3>
    <p>Fauteuil à partir de <strong>${euro(Math.min(...model.fabrics.map(f => f.chair)))}</strong>. ${escapeHtml(gifts)}.</p>
    <p class="campaign-offer__config">${escapeHtml(config)}</p>
    <table class="campaign-offer__table">
      <thead><tr><th scope="col">Revêtement</th><th scope="col">Fauteuil</th><th scope="col">Repose-pieds offert</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </article>`;
}

export function campaignOfferHTML(offer) {
  const start = frenchDate(offer.startsAt), end = frenchDate(offer.endsAt, { lastDay: true });
  const christmas = frenchDate(offer.christmasOrderBy + 'T12:00:00Z');
  const conditions = [
    `Offre valable du ${start} au ${end} inclus.`,
    'Pour l’achat d’un fauteuil Vitra Grand Relax, Repos ou Grand Repos dans l’un des revêtements présentés ci-dessus.',
    'Un repose-pieds offert par fauteuil, dans la même configuration que le fauteuil : l’Ottoman pour le Grand Relax ; l’Ottoman ou la Panchina, au choix, pour le Repos et le Grand Repos.',
    'La valeur du repose-pieds est déduite automatiquement dans le panier ; vous payez le prix du fauteuil.',
    'Offre non cumulable avec une autre remise.',
    `Pour une commande passée avant le ${christmas}, une livraison avant Noël est probablement possible pour certaines configurations, sous réserve de confirmation au moment de la commande.`,
    'Offre réservée au client final, valable auprès des revendeurs participants et selon les configurations proposées.',
  ];
  return `<section class="section wrap campaign-offer" aria-labelledby="campaign-offer-title">
    <h2 class="serif catalogue-head" id="campaign-offer-title">Le repose-pieds offert, dans la même configuration que le fauteuil</h2>
    <p class="campaign-offer__lead">Du ${start} au ${end}. Commandé avant le ${christmas}, votre fauteuil pourra probablement être livré avant Noël.</p>
    <div class="campaign-offer__models">${offer.models.map(modelHTML).join('')}</div>
  </section>
  <section class="section wrap" aria-labelledby="campaign-terms-title">
    <h2 class="serif catalogue-head" id="campaign-terms-title">Conditions de l’offre</h2>
    <ul class="campaign-offer__terms">${conditions.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
  </section>`;
}
