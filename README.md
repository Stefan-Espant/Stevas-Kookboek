# Centaur CMS — Nuxt starter

Kant-en-klare Nuxt 3-boilerplate gekoppeld aan Centaur CMS.

## Setup

1. `npm install`
2. `.env` is al ingevuld met een werkende API-sleutel en je tenant-slug (gegenereerd bij het downloaden). Wil je 'm handmatig vervangen? Gebruik `.env.example` als referentie. `CENTAUR_WEBHOOK_SECRET` vul je zelf in zodra je een webhook registreert (zie onderaan).
3. `npm run dev`

## Wat zit erin

- `composables/useCms.ts` — `getPage(slug)`, `getNavigation(slug)`, `submitForm(...)`
- `pages/[...slug].vue` — rendert elke Centaur-pagina op basis van de URL-slug
- `server/api/webhook.ts` — ontvangt Centaur-webhooks, verifieert de `X-Centaur-Signature` header

## Pagebuilder-blokken renderen

`pages/[...slug].vue` rendert `page.body` automatisch via `<BlockRenderer>` — voor elk bloktype worden de velden op basis van hun type omgezet naar HTML (tekst, richtext, media, datum, geneste blokken, ...). Elk blok en veld krijgt een voorspelbare class (`cms-block--{slug}`, `cms-field--{slug}`) om te stylen.

Wil je een bloktype volledig zelf vormgeven? Geef een `overrides`-map mee:

```vue
<BlockRenderer
  :blocks="page.body"
  :block-types="blockTypes ?? []"
  :overrides="{ hero: resolveComponent('HeroBlock') }"
/>
```

Het geregistreerde component krijgt het volledige blok (incl. alle veldwaarden) als props.

## Contactformulier

`components/ContactForm.vue` is een kant-en-klaar voorbeeldformulier (naam/e-mail/bericht) gekoppeld aan `submitForm()`. Plak `<ContactForm />` op elke pagina waar je een formulier nodig hebt.

## Site-instellingen, SEO & meer

- Favicon, paginatitel-suffix en merkkleur (`--brand-primary`) komen automatisch uit **Instellingen → Website** in het CMS.
- Staat "Cookiebanner" aan? Dan verschijnt er een banner met je eigen tekst; het Analytics-script (indien ingesteld) laadt pas na acceptatie.
- Staat "Onderhoudsmodus" aan? Dan toont de site overal een onderhoudsscherm met je eigen bericht (HTTP-status 503).
- `/sitemap.xml` en `/robots.txt` werken direct, gebaseerd op je gepubliceerde pagina's.
- Pagina's gebruiken automatisch hun OG-titel/-beschrijving/-afbeelding en canonical-URL (indien ingesteld), plus een JSON-LD-blok op basis van je site-instellingen.

Alles hierboven zet/wijzig je in het CMS, niet in code.

## Webhook instellen

Voeg in het Centaur-dashboard onder **Instellingen → Webhooks** een webhook toe die naar `https://jouw-domein.nl/api/webhook` wijst, met hetzelfde secret als `CENTAUR_WEBHOOK_SECRET`.

## Deployen

```bash
npm run build
node .output/server/index.mjs
```
