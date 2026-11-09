// Page de l'offre Black Month : cartes et bandeaux envoyés complets par le serveur (lib/render/black-month.js).
import { initShell } from '/shell.mjs';
import { restoreSelectionPosition } from '/product-grid.mjs';
initShell({ active: 'Black Month', hero: false });
restoreSelectionPosition();
