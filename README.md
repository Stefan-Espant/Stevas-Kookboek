# Steva's Kookboek — WaldJS + Centaur CMS

Statische site gebouwd met [WaldJS](https://www.npmjs.com/package/@waldjs/cli), met content uit Centaur CMS. Alle content wordt **tijdens de build** opgehaald; de bezoeker krijgt kant-en-klare HTML (0 KB JavaScript, behalve de kleine scripts voor cookiebanner/contactformulier en link-prefetching).

## Setup

1. `npm install`
2. Vul `.env` in (zie `.env.example`).
3. `npm run dev` → http://localhost:7233

| Script | Wat |
|---|---|
| `npm run dev` | `wald grow` — dev-server met live reload |
| `npm run build` | `wald build` — bouwt naar `.vercel/output/` (maakt die map eerst leeg) |
| `npm run build:preview` | Zelfde build, maar mét concepten uit Centaur (alleen lokaal, zie hieronder) |
| `npm run preview` | `wald preview` — bekijk de build lokaal |
| `npm run check` | `wald check` — type-check van `.wald`- en `.ts`-bestanden |

## Structuur

- `src/lib/cms.ts` — Centaur-API: `getPage`, `getNavigation`, `getBlockTypes`, `getSiteSettings`, `getSitemapSlugs`
- `src/lib/recipes.ts` — recepten en keukens uit de Centaur-collecties (`getAllRecipes`, `getCuisines`, `getCollections`, …)
- `src/lib/quantity.ts` — hoeveelheden, keukenbreuken en enkelvoud/meervoud voor de personen-rekentool
- `src/pages/recepten/[recept].wald` + `src/components/RecipeView.wald` — de receptpagina
- `src/layouts/Layout.wald` — `<head>`/SEO, JSON-LD, design tokens, onderhoudsmodus, header/footer, cookiebanner
- `src/pages/index.wald` — homepage (hero + nieuwste recepten)
- `src/pages/[slug].wald` — elke Centaur-pagina uit de sitemap
- `src/pages/404.wald` — 404-pagina
- `wald.config.ts` — laadt `.env`, en breidt de Vercel-adapter uit met `404.html`, `sitemap.xml` en `robots.txt`

## Ontwerp & Byzantium

Gebaseerd op Figma **Stevas kookboek v2** (pagina "Index"), gebouwd op het [Byzantium design system](https://www.npmjs.com/package/@byzantium-design-system/core):

- `wald.config.ts` compileert de SCSS-export van Byzantium (`@byzantium-design-system/core/styles`) naar `public/vendor/byzantium.css`: tokens (`--byz-*`), reset, focus-ring, `byz-sr-only` en grid-utilities. Dat bestand wordt gegenereerd en staat in `.gitignore`.
- In `src/layouts/Layout.wald` staat het Figma-palet als `--steva-*`, met de semantische Byzantium-tokens (achtergrond, tekst, accent, focus, fonts) daarop gemapt. Componenten gebruiken `--byz-*` voor spacing, tekstgroottes, motion en z-index.
- De Vue-componenten van Byzantium (`ByzButton` e.d.) werken niet in WaldJS, en hun CSS in `dist/` is Vue-scoped (`[data-v-…]`), dus die wordt niet gebruikt.

Fonts: Fraunces en Marck Script (Google Fonts). Het logo (`public/logo-steva.svg`) en de marmertextuur (`public/images/hero-textuur.webp`) zijn uit Figma geëxporteerd.

## Recepten en keukens (Centaur-collecties)

Recepten staan in de collectie `recepten`, keukens in `keukens` (velden: [docs/centaur-collecties.md](docs/centaur-collecties.md)). De site leest alleen **gepubliceerde** items via `/content/{collectie}`; elk recept krijgt `/recepten/<slug>`, elke keuken met recepten `/keukens/<slug>`. Oude receptpagina's op `/<slug>` krijgen een 301-redirect naar `/recepten/<slug>`.

- **Concepten bekijken:** zet `CENTAUR_PREVIEW=1` en `CENTAUR_WRITE_KEY` in `.env` (of gebruik `npm run build:preview`) — de build leest dan via `/api/manage` ook concepten. **Nooit in Vercel zetten.**
- **Velden instellen en alles publiceren:** plak [docs/centaur-recepten-velden.js](docs/centaur-recepten-velden.js) in de browserconsole van het Centaur-dashboard.
- **Recepten in bulk toevoegen:** `node docs/recepten-data/upload.mjs <batch-bestand>` maakt concepten aan via de schrijfsleutel (brondata staat niet in git).

## Pagebuilder-blokken renderen

`src/pages/[slug].wald` rendert `page.body` via `BlockRenderer.wald`. Elk bloktype wordt op basis van de veldtypes omgezet naar HTML (tekst, richtext, media, datum, geneste blokken, ...) met voorspelbare classes (`cms-block--{slug}`, `cms-field--{slug}`).

Een bloktype zelf vormgeven? Geef een `overrides`-map mee met een Wald-component; die krijgt het volledige blok als props:

```wald
---
import HeroBlock from '../components/HeroBlock.wald'
const body = await BlockRenderer.render({ blocks: page.body, blockTypes, overrides: { hero: HeroBlock } })
---
```

## Contactformulier

`src/components/ContactForm.wald` is een kant-en-klaar formulier (naam/e-mail/bericht) dat vanuit de browser naar Centaur post. Zet `<ContactForm />` op een pagina waar je het nodig hebt.

## Site-instellingen & SEO

- Favicon en titel-suffix komen uit **Instellingen → Website** in het CMS. De kleuren komen uit het Figma-ontwerp (tokens in `src/layouts/Layout.wald`); de merkkleur uit het CMS wordt niet meer gebruikt.
- Cookiebanner aan? Dan verschijnt de banner; het Analytics-script laadt pas na acceptatie.
- Onderhoudsmodus aan? Dan toont elke pagina het onderhoudsscherm (na de volgende build — een statische site kan geen 503-status meer geven).
- `sitemap.xml` en `robots.txt` worden bij elke build gegenereerd. Zet `SITE_URL` (of laat Vercel het productiedomein invullen) voor absolute URL's.

## Deployen (Vercel) & content bijwerken

`npm run build` schrijft naar `.vercel/output/` (Build Output API v3). Zet in Vercel de env vars `CENTAUR_API_BASE`, `CENTAUR_API_KEY` en `CENTAUR_TENANT_SLUG`.

Omdat de site statisch is, verschijnt een wijziging in Centaur pas na een nieuwe build:

1. Maak in Vercel een **Deploy Hook** aan (Project → Settings → Git → Deploy Hooks).
2. Voeg in Centaur onder **Instellingen → Webhooks** een webhook toe die naar die hook-URL wijst.

De hook-URL is zelf het geheim — deel hem niet.

## Oude Nuxt-versie

De vorige Nuxt-code staat tijdelijk in `_nuxt-legacy/` ter vergelijking. Verwijder die map zodra je tevreden bent.
