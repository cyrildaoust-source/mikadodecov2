// Vercel serverless entry point.
// Imports the Express app from ../server.js and exports it as the handler.
// vercel.json réécrit toutes les URL vers cette fonction (ADR 0009).
module.exports = require('../server.js');
