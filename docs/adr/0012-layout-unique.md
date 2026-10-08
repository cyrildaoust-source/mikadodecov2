# ADR 0012 — Un seul `<head>` pour tout le site : layout unique et pages en fragments

Date : 8 octobre 2026 · Statut : accepté · Phase 4.1 du plan.

## Contexte

Trente pages portaient chacune leur `<head>` complet : icônes, préconnexions, Typekit, feuille de style, jeu Open Graph / Twitter, canonical… copiés à la main ou par deux générateurs (journal, légal), avec des écarts (25 pages sur 30 avec un canonical, 24 avec le préchargement de police, des dimensions d'image Open Graph tantôt présentes, tantôt non). Le serveur complétait au rendu par des injections conditionnelles (préchargement Cormorant, script d'en-tête) et réécrivait les balises à coups d'expressions régulières (`renderWithOg`). Une règle SEO globale (modèle de titre, hreflang, balise de vérification) demandait trente modifications.

## Décision

- `templates/layout.html` est l'unique enveloppe HTML : `<head>` commun (métadonnées, Open Graph, Twitter, canonical, polices, feuille de style, script d'en-tête CSP) et squelette du corps (conteneurs du chrome).
- Chaque page devient un **fragment** : un en-tête `<!--page {…}-->` (title, description, canonical, image, ogType, robots), un `<template data-head>` facultatif pour ce qui est propre à la page (préchargements du héros, JSON-LD, feuille dédiée, scripts d'en-tête), puis le `<main>` et ses scripts. Les générateurs du journal et des pages légales produisent ces fragments.
- `lib/render/layout.js` — `renderPage(rel, overrides)` — assemble fragment et layout ; les routes dynamiques passent title/description/image/url puis continuent à travailler sur le HTML complet comme avant (remplacements de corps, `renderWithOg` pour les cas tardifs, `injectChrome`).
- Les quatre blocs `<style>` inline (404, 500, sélection, catalogue) sortent dans `styles.css` et `pages/produits.css` (feuille hachée comme les autres) : un pas de plus vers une CSP sans `'unsafe-inline'` pour les styles.
- Les dimensions Open Graph ne sont émises que pour l'image par défaut (1200 × 630) ; les images produit, de collection ou d'article n'en portent pas, comme `renderWithOg` le faisait déjà.

## Conséquences

- Une règle d'en-tête se change en un endroit ; une nouvelle page = un fragment de quelques lignes. Le modèle de titre par type de page et les champs SEO Shopify (`title_tag`, `description_tag`, déjà lus pour les fiches) ont désormais un point d'application unique (exigence A3 du plan SEO).
- Les tests figent le contrat : tout fragment a un titre, une description et un `<main>` ; aucun ne porte `<html>` ni `<head>` ; le layout porte le script d'en-tête et les préchargements.
- Le rendu est vérifié identique par l'outil de parité (balises SEO de chaque page), le smoke, le navigateur et le parcours panier.
- Hors périmètre, à suivre : fusion des gabarits de famille (`famille.html`, `famille-assises.html`, `templates/family-page.html`) en un seul piloté par la donnée.
