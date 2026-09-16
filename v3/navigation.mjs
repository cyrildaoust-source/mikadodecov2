// Une représentation commune pour le navigateur et le rendu Express.
const ORIGIN = 'https://www.mikadodeco.be';
const HOME = { label: 'Accueil', href: '/' };
const CATALOG = { label: 'Catalogue', href: '/produits.html' };
const BRANDS = { label: 'Marques', href: '/marques.html' };
const DESIGNERS = { label: 'Designers', href: '/designers.html' };
const HANDLE = /^[a-z0-9][a-z0-9-]*$/;
export const navigationSlug = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function createNavigation(data = {}, curated = [], designers = []) {
  const collections = { ...(data.collections || {}) };
  const brands = {};
  for (const [handle, entry] of Object.entries(collections)) {
    if (entry.kind === 'brand') brands[entry.brand || navigationSlug(entry.label)] = { label: entry.label, href: '/produits.html?brand=' + (entry.brand || navigationSlug(entry.label)) };
  }
  // La configuration existante reste la source des destinations de marques.
  for (const brand of curated) {
    const handle = brand.href?.match(/^\/collections\/([a-z0-9-]+)$/)?.[1];
    if (!handle || !brand.name) continue;
    const slug = navigationSlug(brand.name);
    brands[slug] = { label: brand.name, href: brand.href };
    collections[handle] = { label: brand.name, kind: 'brand', brand: slug };
  }
  return { collections, brands, designers: Object.fromEntries(designers.filter(d => d.slug && d.name && !d.hidden).map(d => [d.slug, d.name])) };
}

// Ne transporte jamais d'URL externe, d'identifiant de compte ni de paramètre de suivi.
export function selectionURL(value) {
  if (typeof value !== 'string' || value.length > 6000 || !value.startsWith('/') || /^\/\//.test(value) || /[\\\u0000-\u001f]/.test(value)) return '';
  let url;
  try { url = new URL(value, ORIGIN); } catch { return ''; }
  if (url.origin !== ORIGIN) return '';
  if (url.pathname === '/selection.html') return '/selection.html';
  if (!/^\/collections\/[a-z0-9][a-z0-9-]*\/?$/.test(url.pathname) && url.pathname !== '/produits.html') return '';
  let path = url.pathname.replace(/\/$/, '');
  const legacy = url.searchParams.get('coll');
  if (path === '/produits.html' && HANDLE.test(legacy || '') && legacy !== 'all') path = '/collections/' + legacy;
  if (['/collections/all','/collections/frontpage'].includes(path)) path = '/produits.html';
  const params = new URLSearchParams();
  const chair = path === '/collections/chaises';
  for (const key of ['brand','designer','cats','q','tag','sort','page','cursor','shown',...(chair?['color','material','usage','feature','min','max','seat_min','seat_max','stock']:[])]) {
    const val = url.searchParams.get(key);
    if (!val) continue;
    if (['brand','designer','tag'].includes(key) && !(chair && key==='brand' ? /^[a-z0-9-]+(?:,[a-z0-9-]+)*$/.test(val) : HANDLE.test(val))) continue;
    if (['color','material','usage','feature'].includes(key) && !/^[a-z0-9-]+(?:,[a-z0-9-]+)*$/.test(val)) continue;
    if (['min','max','seat_min','seat_max'].includes(key) && (!/^\d+(?:\.\d{1,2})?$/.test(val) || Number(val)>1000000)) continue;
    if (key==='stock' && val!=='1') continue;
    if (key === 'cats' && !/^[a-z0-9-]+(?:,[a-z0-9-]+)*$/.test(val)) continue;
    if (key === 'sort' && !['pop','asc','desc','az'].includes(val)) continue;
    if (['page','shown'].includes(key) && (!/^[1-9][0-9]*$/.test(val) || Number(val) > 100000)) continue;
    if (key === 'cursor' && val.length > 4000) continue;
    params.set(key, key === 'q' ? val.slice(0, 200) : val);
  }
  const hash = /^#(?:grille|product-[a-z0-9-]+)$/.test(url.hash) ? url.hash : '';
  return path + (params.size ? '?' + params : '') + hash;
}

export function listingContext(url) {
  const clean = selectionURL(url.pathname + url.search);
  if (!clean || clean === '/selection.html') return '';
  const parsed = new URL(clean, ORIGIN), p = parsed.searchParams;
  const handle = parsed.pathname.match(/^\/collections\/([a-z0-9-]+)$/)?.[1];
  if (handle) return p.get('brand') && HANDLE.test(p.get('brand')) ? `coll-brand:${handle}:${p.get('brand')}` : `coll:${handle}`;
  if (p.get('designer')) return 'designer:' + p.get('designer');
  if (p.get('brand')) return 'brand:' + p.get('brand');
  return '';
}

export function sourceSelection(url) {
  const explicit = url.searchParams.get('returnTo');
  if (explicit) return selectionURL(explicit);
  const from = url.searchParams.get('from') || '';
  let match = from.match(/^coll-brand:([a-z0-9-]+):([a-z0-9-]+)$/);
  if (match) return selectionURL(`/collections/${match[1]}?brand=${match[2]}`);
  match = from.match(/^(coll|brand|designer):([a-z0-9-]+)$/);
  return match ? selectionURL(match[1] === 'coll' ? '/collections/' + match[2] : '/produits.html?' + match[1] + '=' + match[2]) : '';
}

export function productHref(product, source = '', variant = '') {
  const params = new URLSearchParams();
  const handle = product.handle || '';
  if (HANDLE.test(handle)) params.set('handle', handle);
  else {
    const id = product.id || handle;
    if (!/^(?:gid:\/\/shopify\/Product\/)?[0-9]+$/.test(id || '')) return '';
    params.set('id', id);
  }
  const selected = selectionURL(source);
  const back = selected && selected !== "/selection.html" && HANDLE.test(handle)
    ? selected.split("#")[0] + "#product-" + handle : selected;
  if (back) {
    const from = listingContext(new URL(back, ORIGIN));
    if (from) params.set('from', from);
    params.set('returnTo', back);
  }
  const variantId = String(variant || product.matchedVariantId || '').match(/^(?:gid:\/\/shopify\/ProductVariant\/)?([0-9]+)$/)?.[1];
  if (variantId) params.set('variant', variantId);
  return '/produit.html?' + params;
}

export function collectionTrail(handle, nav, label = '', seen = new Set()) {
  if (!HANDLE.test(handle || '') || seen.has(handle)) return [HOME, CATALOG];
  seen.add(handle);
  const entry = nav.collections[handle];
  if (!entry && !label) return [HOME, CATALOG];
  const current = { label: entry?.label || label, href: '/collections/' + handle };
  if (entry?.kind === 'brand') return [HOME, BRANDS, current];
  if (entry?.kind === 'designer') return [HOME, DESIGNERS, current];
  if (entry?.parent) return [...collectionTrail(entry.parent, nav, '', seen), current];
  return [HOME, CATALOG, current];
}

export function listingTrail(url, nav, { title = '', brandName = '' } = {}) {
  if (url.pathname === '/marques.html') return [HOME, BRANDS];
  if (url.pathname === '/designers.html') return [HOME, DESIGNERS];
  if (url.pathname === '/selection.html') return [HOME, { label: 'Ma sélection', href: '/selection.html' }];
  const path = selectionURL(url.pathname + url.search);
  if (!path) return [HOME, CATALOG];
  const p = new URL(path, ORIGIN).searchParams;
  const handle = new URL(path, ORIGIN).pathname.match(/^\/collections\/([a-z0-9-]+)$/)?.[1];
  const brand = p.get('brand');
  const brandLabel = brand?.includes(',') ? 'Sélection de marques' : nav.brands[brand]?.label || (navigationSlug(brandName) === brand ? brandName : 'Marque introuvable');
  if (handle) {
    const trail = collectionTrail(handle, nav, title);
    if (brand) trail.push({ label: brandLabel, href: '/collections/' + handle + '?brand=' + encodeURIComponent(brand) });
    return trail;
  }
  if (p.get('designer')) return [HOME, DESIGNERS, { label: nav.designers[p.get('designer')] || 'Designer introuvable', href: '/produits.html?designer=' + encodeURIComponent(p.get('designer')) }];
  if (p.get('q')) return [HOME, CATALOG, { label: `Résultats pour « ${p.get('q')} »${brand ? ' · ' + brandLabel : ''}`, href: path }];
  const cats = (p.get('cats') || '').split(',').filter(Boolean);
  let trail = cats.length === 1 ? collectionTrail(cats[0], nav) : [HOME, CATALOG];
  if (cats.length > 1 || p.get('tag')) trail.push({ label: 'Sélection filtrée', href: path });
  if (brand) {
    if (!cats.length && !p.get('tag')) trail = [HOME, BRANDS];
    trail.push({ label: brandLabel, href: cats.length || p.get('tag') ? path : nav.brands[brand]?.href || '/produits.html?brand=' + encodeURIComponent(brand) });
  }
  return trail;
}

export function productTrail(product, url, nav) {
  const source = sourceSelection(url);
  let trail = [HOME, CATALOG];
  if (source && source !== '/selection.html') {
    const listing = new URL(source, ORIGIN);
    // Un ancien lien combinant une autre marque ne doit pas afficher une fausse appartenance.
    if (listing.searchParams.has('brand') && listing.searchParams.get('brand') !== navigationSlug(product.brand)) listing.searchParams.delete('brand');
    const handle = listing.pathname.match(/^\/collections\/([a-z0-9-]+)$/)?.[1];
    const entry = nav.collections[handle];
    if (!entry || entry.kind !== 'brand' || (entry.brand || navigationSlug(entry.label)) === navigationSlug(product.brand)) trail = listingTrail(listing, nav, { brandName: product.brand });
  }
  return [...trail, { label: product.name }];
}

export function breadcrumbHTML(trail) {
  if (!Array.isArray(trail) || !trail.length) return '';
  return `<nav class="breadcrumb" aria-label="Fil d'Ariane"><ol>${trail.map((item, i) => `<li>${i < trail.length - 1 && item.href ? `<a href="${escape(item.href)}">${escape(item.label)}</a>` : `<span${i === trail.length - 1 ? ' aria-current="page"' : ''}>${escape(item.label)}</span>`}</li>`).join('')}</ol></nav>`;
}

export function breadcrumbData(trail, currentURL) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trail.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.label, item: new URL(index === trail.length - 1 ? currentURL : item.href, ORIGIN).href })) };
}

export function returnLinkHTML(source) {
  const href = selectionURL(source);
  return href ? `<a class="navigation-return" href="${escape(href)}"><span aria-hidden="true">← </span>Retour à ma sélection</a>` : '';
}

export function productBrandDestination(product, url, nav) {
  const slug = navigationSlug(product.brand);
  const source = sourceSelection(url);
  const handle = source && new URL(source, ORIGIN).pathname.match(/^\/collections\/([a-z0-9-]+)$/)?.[1];
  if (['family', 'subcategory'].includes(nav.collections[handle]?.kind)) return '/collections/' + handle + '?brand=' + encodeURIComponent(slug);
  return nav.brands[slug]?.href || (slug ? '/produits.html?brand=' + encodeURIComponent(slug) : '/marques.html');
}
