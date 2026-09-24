// Nuancier Fermob : balisage commun au serveur et au navigateur. La page arrive
// complète (première couleur ouverte) ; nuancier-fermob.js branche les interactions.
import { slugify, escapeHtml } from './format.mjs';

const HARM_ROLES = ['active', 'p1', 'p2'];

// Luminosité perçue d'un #rrggbb (ou #rgb), 0..1 : couleur lisible sur chaque carré.
export function luminance(hex) {
  let h = String(hex || '').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  if (h.length !== 6) return 1;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function swatchesHTML(colors, activeSlug = '') {
  return colors.map((c) => {
    const slug = slugify(c.name);
    return `<li>
        <button type="button" class="nf-swatch" data-slug="${escapeHtml(slug)}" aria-pressed="${slug === activeSlug}" aria-label="${escapeHtml(c.name)}" title="${escapeHtml(c.name)}" style="--swatch-color:${escapeHtml(c.hex)}">
          <span class="nf-swatch__dot" aria-hidden="true"></span>
        </button>
      </li>`;
  }).join('');
}

// Quatre compositions de carrés : la couleur active et jusqu'à deux partenaires.
export function harmoniesHTML(color) {
  const rows = Object.values(color.associations || {}).filter((row) => Array.isArray(row) && row.length);
  return rows.map((row) => {
    const cells = [color, ...row.slice(0, 2)].map((c, i) => {
      const txt = luminance(c.hex) > 0.6 ? 'var(--ink)' : 'var(--paper)';
      const hidden = i === 0 ? ' aria-hidden="true"' : '';
      return `<div class="nf-harm-sq nf-harm-sq--${HARM_ROLES[i]}" style="--sq:${escapeHtml(c.hex)}">
          <span class="nf-harm-sq__name" style="color:${txt}"${hidden}>${escapeHtml(c.name)}</span>
        </div>`;
    }).join('');
    return `<div class="nf-harm">${cells}</div>`;
  }).join('');
}

export const ambianceThumbs = (color) => Array.isArray(color.ambiance_thumbs) ? color.ambiance_thumbs.slice(0, 6) : [];
export function ambiancesHTML(color) {
  return ambianceThumbs(color).map((url, i) =>
    `<div class="nf-amb"><img loading="lazy" referrerpolicy="no-referrer" src="${escapeHtml(url)}" alt="${escapeHtml(color.name)} — ambiance ${i + 1}" /></div>`
  ).join('');
}

// Squelette du widget ; avec une couleur, il est rempli comme après setActive.
export function nuancierHTML(colors = [], color = null) {
  const moods = color && Array.isArray(color.moodboard_images) ? color.moodboard_images : [];
  const img = (attr, url, alt, extra = '') => `<img ${attr}${url ? ` src="${escapeHtml(url)}" referrerpolicy="no-referrer"` : ''} alt="${url ? escapeHtml(alt) : ''}"${extra} />`;
  const pos = color ? colors.indexOf(color) + 1 : 0;
  const harmonies = color ? harmoniesHTML(color) : '';
  const ambiances = color ? ambiancesHTML(color) : '';
  return `
  <header class="nf-nav">
    <nav class="nf-swatches" aria-label="Toutes les couleurs Fermob">
      <ol class="nf-swatches__list" data-swatches>${color ? swatchesHTML(colors, slugify(color.name)) : ''}</ol>
    </nav>
  </header>

  <section class="nf-stage" aria-live="polite">
    <div class="nf-stage__media">
      <div class="nf-stage__hero-wrap">
        ${img('class="nf-stage__hero is-front" data-mood-hero', moods[0], color ? `${color.name} · ambiance principale` : '', color ? ' aria-hidden="false"' : '')}
        <img class="nf-stage__hero" data-mood-hero-top alt="" aria-hidden="true" />
      </div>
      <div class="nf-stage__moodgrid">
        ${img('data-mood-1 loading="lazy"', moods[1], color ? `${color.name} · ambiance 2` : '')}
        ${img('data-mood-2 loading="lazy"', moods[2], color ? `${color.name} · ambiance 3` : '')}
      </div>
    </div>

    <div class="nf-stage__body">
      <div class="nf-active" data-active>
        <h2 class="nf-active__name serif" data-name>${color ? escapeHtml(color.name || '—') : '—'}</h2>
        <div class="nf-active__meta">
          <span class="nf-active__index"><span data-index>${color ? String(pos).padStart(2, '0') : '—'}</span> / <span data-total>${color ? colors.length : '—'}</span></span>
          <span class="nf-active__hex">
            <span class="nf-active__chip" data-hex-chip aria-hidden="true"${color ? ` style="--swatch-color:${escapeHtml(color.hex || 'transparent')}"` : ''}></span>
            <span class="nf-active__code" data-hex-code>${color ? escapeHtml((color.hex || '').toUpperCase()) : '—'}</span>
          </span>
        </div>
      </div>

      <p class="nf-stage__title" data-title>${color ? escapeHtml(color.title || '') : '—'}</p>
      <p class="nf-stage__desc" data-desc>${color ? escapeHtml(color.description || '') : '—'}</p>
    </div>
  </section>

  <section class="nf-stage__harmonies" data-harmonies${harmonies ? '' : ' hidden'}>
    <div class="nf-stage__harmonies-label">Harmonies recommandées</div>
    <div class="nf-stage__harmonies-list" data-harmonies-list>${harmonies}</div>
  </section>

  <section class="nf-ambiances" data-ambiances${ambiances ? '' : ' hidden'}>
    <h3 class="nf-ambiances__title serif">Ambiances · <span data-amb-color>${color ? escapeHtml(color.name) : '—'}</span></h3>
    <div class="nf-ambiances__grid" data-thumbs>${ambiances}</div>
  </section>
`;
}
