function renderSearchPage(html,data,view,renderCard) {
  return html.replace('<html lang="fr">','<html lang="fr" data-search-page>')
    .replace('<body>','<body class="has-topnav">')
    .replace(/<script>[\s\S]*?<\/script>/g,'')
    .replace(/<main id="contenu">[\s\S]*?<\/main>/,()=>`<main id="contenu" class="search-page">${view.searchContent(data,renderCard)}</main>`)
    .replace(/<script type="module">[\s\S]*?<\/script>/,()=>`<script type="application/json" id="search-initial">${JSON.stringify(data).replace(/</g,'\\u003c')}</script><script type="module" src="/search-page.js"></script>`);
}
module.exports={renderSearchPage};
