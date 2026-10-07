// Point d'entrée — Mikado Deco
// ----------------------------
// `node server.js` en local (nodemon en dev) ; sur Vercel, api/index.js importe
// l'application. Toute la composition est dans app.js, le code métier dans lib/,
// les routes dans routes/.
const app = require('./app');
const { PORT } = require('./lib/config');

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  Mikado Deco — serveur demarre`);
    console.log(`  http://localhost:${PORT}\n`);
  });
}

module.exports = app;
