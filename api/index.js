// Vercel serverless entry point.
// Imports the Express app from ../server.js and exports it as the handler.
// vercel.json rewrites /api/* to this function.
module.exports = require('../server.js');
