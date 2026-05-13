/**
 * One-shot Shopify OAuth token fetcher.
 * Run with: node scripts/oauth-get-token.js
 *
 * Requires the following in .env:
 *   SHOPIFY_SHOP_DOMAIN     (e.g. your-store.myshopify.com)
 *   SHOPIFY_CLIENT_ID
 *   SHOPIFY_CLIENT_SECRET
 *
 * 1. Opens your browser to the Shopify install/re-auth URL
 * 2. Listens on http://localhost:3456/callback for the redirect
 * 3. Exchanges the code for a SHPAT and prints it
 *
 * Make sure http://localhost:3456/callback is listed as an
 * allowed redirect URI in your Partner Dashboard app settings.
 */

require('dotenv').config();

const http   = require('http');
const https  = require('https');
const url    = require('url');
const crypto = require('crypto');

const SHOP          = process.env.SHOPIFY_SHOP_DOMAIN;
const CLIENT_ID     = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const REDIRECT_URI  = 'http://localhost:3456/callback';
const PORT          = 3456;

if (!SHOP || !CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing env vars. Required: SHOPIFY_SHOP_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET');
  process.exit(1);
}

const state = crypto.randomBytes(16).toString('hex');

const authUrl =
  `https://${SHOP}/admin/oauth/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&scope=` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&state=${state}`;

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname !== '/callback') {
    res.writeHead(404); res.end(); return;
  }

  const { code, state: returnedState, error } = parsed.query;

  if (error) {
    console.error('\nShopify returned an error:', error);
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`<h2>Error: ${error}</h2>`);
    server.close();
    return;
  }

  if (returnedState !== state) {
    console.error('\nState mismatch — possible CSRF. Aborting.');
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h2>State mismatch</h2>');
    server.close();
    return;
  }

  // Exchange code for access token
  const body = JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code });
  const options = {
    hostname: SHOP,
    path: '/admin/oauth/access_token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const tokenReq = https.request(options, tokenRes => {
    let data = '';
    tokenRes.on('data', chunk => { data += chunk; });
    tokenRes.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(data); } catch { parsed = {}; }

      if (parsed.access_token) {
        const token = parsed.access_token;
        const scopes = parsed.scope || '(unknown)';

        console.log('\n========================================');
        console.log('  SHPAT (Admin API access token):');
        console.log(' ', token);
        console.log('  Scopes:', scopes);
        console.log('========================================\n');
        console.log('Add to your .env as:');
        console.log(`  SHOPIFY_API_KEY=${token}`);
        console.log();

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <h2>Token received!</h2>
          <p>Check your terminal for the SHPAT.</p>
          <pre style="background:#eee;padding:1rem">${token}</pre>
          <p>Scopes: ${scopes}</p>
        `);
      } else {
        console.error('\nFailed to get token:', data);
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h2>Token exchange failed</h2><pre>${data}</pre>`);
      }

      server.close();
    });
  });

  tokenReq.on('error', err => {
    console.error('Request error:', err);
    res.writeHead(500); res.end();
    server.close();
  });

  tokenReq.write(body);
  tokenReq.end();
});

server.listen(PORT, () => {
  console.log(`\nOAuth server listening on port ${PORT}`);
  console.log('\nIMPORTANT: Make sure this redirect URI is allowed in your');
  console.log(`Partner Dashboard for app ${CLIENT_ID}:`);
  console.log(`  ${REDIRECT_URI}\n`);
  console.log('Open this URL in your browser to authorize:');
  console.log('\n' + authUrl + '\n');

  // Try to auto-open the browser
  const { exec } = require('child_process');
  exec(`open "${authUrl}"`, err => {
    if (err) console.log('(Could not auto-open browser — paste the URL above manually)');
  });
});
