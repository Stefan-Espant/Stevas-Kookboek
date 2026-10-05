# Groeiplan — Steva's Kookboek

**Doel:** publiek bereik/bekendheid (bezoekers, vindbaarheid, mensen die recepten koken en delen)
**Uitgangspositie:** een paar ChatGPT-recepten, kan zelf AI-afbeeldingen genereren, nog geen niche, ~1-2u/week beschikbaar
**Datum:** 2026-08-09

Realistisch met 1-2u/week: dit wordt geen dagelijkse contentmachine. De insteek hieronder is bewust laag-onderhoud maar met hefboom — dingen die één keer gedaan worden en daarna lang blijven werken (SEO, Pinterest), in plaats van dingen die continu tijd vragen (dagelijks social posten).

---

## Fase 0 — Fundament (nu al deels gedaan)

- [x] Boilerplate draait, gekoppeld aan Centaur CMS
- [x] Site-instellingen: siteName "Steva's Kookboek", brandkleur `#16a34a`
- [ ] Vul in Centaur (Instellingen → Website) nog aan: tagline, meta-omschrijving, favicon, logo
- [ ] **Kies een niche.** Met weinig tijd is "brede verzameling recepten" de moeilijkste weg — je concurreert dan met elke foodblog ter wereld. Een scherpe hoek is makkelijker te laten groeien:
  - Voorbeelden: airfryer-recepten, budgetmaaltijden onder €5 p.p., Nederlandse klassiekers met een twist, 15-minuten-doordeweeks
  - Kies iets dat aansluit bij wat je zelf echt kookt — dat houdt het vol te houden

## Fase 1 — Contentbasis (eerste 4-8 weken)

- [ ] **Bouw een eigen "Recept"-bloktype in Centaur** (naast de generieke blokken die er al zijn: titel, paragraph, gallery, review, ...). Velden: ingrediënten (lijst), bereidingsstappen, bereidingstijd, portiegrootte, moeilijkheidsgraad. Dit is de belangrijkste technische stap — zonder gestructureerde receptvelden kun je geen recept-rijke resultaten in Google krijgen (zie Fase 2) en oogt elk recept anders.
- [ ] **Verwerk de ChatGPT-recepten, plak ze niet blind over.** Test ze zelf (of laat iemand anders ze koken) en pas hoeveelheden/stappen aan waar nodig. Google's kwaliteitsrichtlijnen (en simpelweg vertrouwen van bezoekers) straffen ongeteste AI-recepten af — een recept dat niet klopt kost je meteen een teleurgestelde bezoeker die niet terugkomt.
- [ ] **Eigen foto's, ook al zijn ze niet perfect**, wegen zwaarder dan AI-gegenereerde beelden. Bij eten prikt AI-imperfectie er snel doorheen (net-niet-echte structuur/kleur) en het is precies het soort content waar mensen op afhaken. AI-afbeeldingen kunnen prima als placeholder tot je een foto hebt, maar bouw er niet blijvend op.
- [ ] Ritme: gezien je tijdsbudget, mik op **1 recept per 1-2 weken**, goed uitgewerkt, in plaats van veel haastig werk.

## Fase 2 — Vindbaarheid (SEO — eenmalig werk, blijft renderen)

- [x] `/sitemap.xml` en `/robots.txt` werken al automatisch (boilerplate)
- [ ] Voeg de site toe aan **Google Search Console** zodra er een paar recepten live staan, en dien de sitemap in
- [ ] Vul per recept een goede meta-omschrijving en OG-afbeelding in (velden zitten al in het CMS)
- [ ] **Recipe-schema (JSON-LD)** toevoegen aan receptpagina's zodra het Recept-blok bestaat — dit geeft je kans op een rijk zoekresultaat in Google (foto, bereidingstijd, sterren) wat veel meer clicks oplevert dan een gewone blauwe link
- [ ] Link recepten onderling ("meer airfryer-recepten") — helpt zowel bezoekers als Google

## Fase 3 — Distributie (bereik met weinig tijd)

- [ ] **Pinterest** is voor receptensites de beste tijd/opbrengst-verhouding: één pin per recept, evergreen (blijft maanden/jaren verkeer opleveren), geen dagelijkse aanwezigheid nodig zoals Instagram/TikTok
- [ ] Instagram alleen als leuke bijzaak: één Reel van het bereiden per recept is genoeg, geen dagelijkse posts nodig
- [ ] Hergebruik: 1 recept → 1 pagina op de site + 1 Pinterest-pin + evt. 1 Reel. Geen apart contentplan per kanaal nodig.

## Fase 4 — Herhalen wat werkt

- [ ] Check maandelijks in Google Search Console / Analytics welke recepten trekken
- [ ] Maak meer varianten op wat het goed doet (bijv. als "airfryer kip" het goed doet, meer airfryer-kipvarianten)
- [ ] Het **review-blok** bestaat al in het CMS (`review`, `reviews_block`) — zet dat onder recepten zodra je eerste bezoekers reageren; sociale bewijskracht helpt zowel bezoekers als SEO

---

## Volgorde samengevat

1. Niche kiezen
2. Recept-bloktype bouwen in Centaur
3. Eerste 5-10 recepten: getest, eigen (of verbeterde) foto's, goed ingevuld
4. Search Console + Recipe-schema
5. Pinterest erbij
6. Elke maand bijsturen op basis van wat werkt

**Volgende stap:** wil je hulp bij het opzetten van het Recept-bloktype in Centaur, of eerst een niche bepalen?
