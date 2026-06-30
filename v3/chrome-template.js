/* ============================================================
   Mikado Deco · chrome-template (SOURCE UNIQUE du markup chrome)
   Module PUR, ESM, zéro DOM, zéro effet de bord top-level.
   Importé par /shared.js (client) ET par server.js (SSR Node).
   NE JAMAIS y mettre fetch/document/window/localStorage.
   ============================================================ */

/* ---------- chrome + footer markup ----------
   NAV_TOP is the top-level fallback that renders immediately. Mega
   menu sub-items + Marques dropdown contents are hydrated async by
   /mega-menu.js from /api/menu (Shopify-driven). If the fetch fails,
   the top-level still navigates (clicks land on the corresponding
   collection page). */
export const NAV_TOP = [
  { label: "Mobilier",      href: "/produits.html",   kind: "mega",     key: "mobilier"  },
  { label: "Marques",       href: "/marques.html",    kind: "dropdown", key: "marques"   },
  { label: "Designers",     href: "/designers.html",  kind: "dropdown", key: "designers" },
  { label: "Mikado Studio", href: "/studio.html",     kind: "link"  },
  { label: "Le journal",    href: "/journal.html",    kind: "link"  },
];

export function chromeHTML(active) {
  const links = NAV_TOP.map((n) => {
    const isActive = active === n.label;
    const cls = ["nlink", isActive ? "is-active" : "", n.kind === "promo" ? "nlink--promo" : ""].filter(Boolean).join(" ");
    const extra = (n.kind === "mega" || n.kind === "dropdown")
      ? ` data-mm-trigger="${n.key}" aria-haspopup="true" aria-expanded="false"`
      : "";
    return `<a href="${n.href}" class="${cls}"${extra}${isActive ? ' aria-current="page"' : ''}>${n.label}</a>`;
  }).join("");

  // Mega panel stage — single off-flow container, hidden by default.
  // Hydrated by /mega-menu.js after the chrome is in the DOM.
  const stage = `
    <div class="mm-stage" data-mm-stage>
      <div class="mm-stage__inner">
        <div class="mm-panel" data-mm-panel="mobilier"></div>
        <div class="mm-panel" data-mm-panel="marques"></div>
        <div class="mm-panel" data-mm-panel="designers"></div>
      </div>
    </div>`;

  // Mobile drawer — accordion sections for Mobilier/Marques, then
  // flat links for Designers / Studio / Le journal, plus a footer
  // visual block hydrated from mega-menu-config.json.
  const drawerHTML = `
    <div class="drawer" id="menu-mobile" role="dialog" aria-modal="true" aria-label="Menu" data-drawer>
      <div class="drawer__head">
        <span class="drawer__title">Menu</span>
        <button class="drawer__close" data-drawer-close aria-label="Fermer">&times;</button>
      </div>
      <div class="drawer__body">
        <div class="drawer__group" data-open="false" data-drawer-group="mobilier">
          <button type="button" class="drawer__group-head" aria-expanded="false">Mobilier <span class="drawer__chev" aria-hidden="true">▾</span></button>
          <ul class="drawer__sub" data-drawer-sub="mobilier"></ul>
        </div>
        <div class="drawer__group" data-open="false" data-drawer-group="marques">
          <button type="button" class="drawer__group-head" aria-expanded="false">Marques <span class="drawer__chev" aria-hidden="true">▾</span></button>
          <ul class="drawer__sub" data-drawer-sub="marques"></ul>
        </div>
        <div class="drawer__group" data-open="false" data-drawer-group="designers">
          <button type="button" class="drawer__group-head" aria-expanded="false">Designers <span class="drawer__chev" aria-hidden="true">▾</span></button>
          <ul class="drawer__sub" data-drawer-sub="designers"></ul>
        </div>
        <a class="drawer__link" href="/studio.html">Mikado Studio</a>
        <a class="drawer__link" href="/journal.html">Le journal</a>
        <a class="drawer__link drawer__link--util" href="/rendez-vous.html">Rendez-vous</a>
        <a class="drawer__link drawer__link--util" href="/selection.html">Ma sélection</a>
      </div>
      <footer class="drawer__foot" data-drawer-foot></footer>
    </div>`;

  // Cart drawer (mini-cart) — slides from the right, above everything. Body +
  // foot are (re)rendered by bindCartDrawer() from readCart(); the skeleton just
  // holds the slots. Present on every page (injected with the shell).
  const cartDrawerHTML = `
    <div class="cartd" data-cart-drawer>
      <div class="cartd__backdrop" data-cartd-backdrop></div>
      <aside class="cartd__panel" role="dialog" aria-modal="true" aria-label="Mon panier" data-cartd-panel>
        <header class="cartd__head">
          <h2 class="cartd__title" data-cartd-title>Mon panier</h2>
          <button class="cartd__close" data-cartd-close type="button" aria-label="Fermer le panier">&times;</button>
        </header>
        <div class="cartd__body" data-cartd-body></div>
        <footer class="cartd__foot" data-cartd-foot hidden></footer>
      </aside>
    </div>`;

  return `
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <header class="chrome" data-chrome>
    <div class="announce" data-announce>
      <span class="on">Boutique de design à Uccle · du mardi au samedi</span>
      <span>Mobilier de design, choisi pièce par pièce</span>
      <span>Livraison partout en Belgique</span>
      <span>Mikado Studio · le conseil en aménagement</span>
    </div>
    <div class="nav__inner">
      <div class="nav__left">
        <a href="/" class="wordmark" aria-label="mikadodeco"><img src="/logomikado.svg" alt="mikadodeco" /></a>
        <nav class="nav__primary">${links}</nav>
      </div>
      <div class="nav__right">
        <a href="/rendez-vous.html" class="nav__util nav__util-extra">Rendez-vous</a>
        <a href="/selection.html" class="nav__cart" aria-label="Ma sélection">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" width="22" height="22" aria-hidden="true">
            <path d="M6.46 8.2 4.55 19.2a.25.25 0 0 0 .25.3h14.4a.25.25 0 0 0 .25-.3L17.54 8.2a.25.25 0 0 0-.25-.2H6.71a.25.25 0 0 0-.25.2Z" stroke-linejoin="round"/>
            <path d="M9.5 11V4.75a.25.25 0 0 1 .25-.25h4.5a.25.25 0 0 1 .25.25V11"/>
          </svg>
          <span class="cartcount" data-cart-count>0</span>
        </a>
        <button class="nav__burger" data-burger aria-expanded="false" aria-controls="menu-mobile">Menu</button>
      </div>
    </div>
    ${stage}
  </header>
  ${drawerHTML}
  ${cartDrawerHTML}`;
}

export function footerHTML() {
  return `
  <footer class="footer">
    <div class="wrap">
      <div class="footer__lockbar">
        <span class="lockup-lg">Mikado Deco · Boutique de design · Uccle, Bruxelles</span>
        <svg class="seal" viewBox="0 0 120 120" role="img" aria-label="Mikado Deco, Bruxelles, depuis 2011">
          <defs><path id="seal-arc" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs>
          <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" stroke-width="1" />
          <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" stroke-width="1" />
          <text font-family="'neue-haas-grotesk-display', sans-serif" font-size="8.4" letter-spacing="2.4" fill="currentColor"><textPath href="#seal-arc" startOffset="0">· MIKADODECO · MOBILIER DE DESIGN · BRUXELLES </textPath></text>
          <text x="60" y="67" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-weight="600" font-size="20" fill="currentColor">Uccle</text>
        </svg>
      </div>
      <div class="footer__grid">
        <div class="footer__news">
          <h4 class="serif">Restons en contact</h4>
          <p>Recevez nos nouveautés, nos coups de cœur et les rendez-vous de la boutique.</p>
          <form class="footer__form" data-newsletter novalidate>
            <input type="email" name="email" placeholder="Votre adresse e-mail" aria-label="E-mail" autocomplete="email" required />
            <input type="text" name="hp_field" tabindex="-1" autocomplete="off" aria-hidden="true" style="display:none" />
            <button class="btn btn--solid btn--block" type="submit">S'inscrire</button>
            <p class="footer__news-status" data-news-status role="status" aria-live="polite"></p>
          </form>
        </div>
        <div><h5>Boutique</h5><ul>
          <li><a href="/produits.html">Mobilier</a></li>
          <li><a href="/collections/luminaires">Luminaires</a></li>
          <li><a href="/collections/decoration">Décoration</a></li>
          <li><a href="/collections/outdoor">Extérieur</a></li>
        </ul></div>
        <div><h5>Maison</h5><ul>
          <li><a href="/marques.html">Les marques</a></li>
          <li><a href="/materiaux.html">Les matières</a></li>
          <li><a href="/journal.html">Le journal</a></li>
          <li><a href="/rendez-vous.html">Rendez-vous</a></li>
        </ul></div>
        <div><h5>Contact</h5><ul>
          <li><a href="mailto:shop@mikadodeco.be">shop@mikadodeco.be</a></li>
          <li><a href="tel:+32493837983">+32 (0)493 83 79 83</a></li>
          <li><a href="/contact.html">Nous écrire</a></li>
          <li><a href="https://maps.google.com/?q=75+Rue+du+Doyenné+1180+Uccle" target="_blank" rel="noopener">75 Rue du Doyenné, 1180 Uccle</a></li>
          <li><a href="https://maps.app.goo.gl/NE71nd6NytFjot6K6" target="_blank" rel="noopener">★ Voir nos avis Google</a></li>
        </ul></div>
      </div>
      <div class="footer__bottom">
        <nav aria-label="Liens légaux">
          <a href="/mentions-legales.html">Mentions légales</a>
          <a href="/conditions-generales-de-vente.html">Conditions générales de vente</a>
          <a href="/politique-et-vie-privee.html">Confidentialité</a>
          <a href="/politique-cookies.html">Cookies</a>
          <span>&copy; 2026 Mikado M-O-A SRL · TVA BE 0839.015.455</span>
        </nav>
        <div class="pay"><span>Visa</span><span>Mastercard</span><span>Bancontact</span><span>PayPal</span></div>
      </div>
    </div>
  </footer>`;
}
