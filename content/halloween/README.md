# Halloweenrecepten

Tien recepten en tien afbeeldingen aangeleverd door de eigenaar op 27 oktober 2026, uit `stevas-halloween-recepten.md` en `stevas-halloween-afbeeldingen-16x9.zip`.

Alle oorspronkelijke ingrediënten en vier bereidingsstappen per recept zijn overgenomen. Intro’s, SEO-titels, metabeschrijvingen en afbeeldingsbeschrijvingen zijn toegevoegd. Er zijn geen recepten uit een andere browserchat gereconstrueerd.

De volledige liggende compositie is behouden bij het coderen naar WebP. De afbeeldingen staan in de mediabibliotheek van Centaur; hun publieke URL’s staan in `recipes.json`. De oorspronkelijke PNG’s blijven lokaal in `output/halloween-2026/bronafbeeldingen/`.

## Import en publicatie

```sh
node scripts/import-halloween.mjs output/halloween-2026/bronafbeeldingen
node scripts/import-halloween.mjs output/halloween-2026/bronafbeeldingen --apply
```

Het script controleert de inhoud en maakt met de schrijfsleutel concepten aan; bestaande recepten worden nooit overschreven. Resultaten worden bijgehouden in `output/halloween-2026/import-resultaten.json` om een onderbroken import te hervatten. Sleutels worden uitsluitend uit `.env` gelezen.

De ContentWrite-API biedt bewust geen publicatiemethode. Publiceer de tien concepten in de collectie **Recepten** in Centaur. De tag `Halloween` vult `/inspiratie/halloween` automatisch, inclusief het overzicht onder Inspiratie. In oktober toont de homepage maximaal drie Halloweenrecepten. Lege thema’s en concepten worden niet openbaar getoond.

## Hoeveelheden en extra tijd

`personen` is de basishoeveelheid voor de rekentool. Het optionele veld `portie_eenheid` bevat `personen`, `stuks` of `stukken`, zodat bijvoorbeeld 8 hotdogs niet als 8 personen worden weergegeven. Het optionele tekstveld `tijd_toelichting` benoemt extra opstijf- of afkoeltijd. De kaart toont dan “+ wachttijd”; het Recipe-schema claimt geen volledige totaaltijd zolang die extra tijd niet numeriek bekend is. Bestaande recepten zonder deze velden behouden hun weergave.

Deze twee aanvullende velden worden in de entry-data bewaard. Om ze ook als losse invoervelden in de CMS-editor te bewerken, kunnen optionele tekstvelden met dezelfde slugs aan de collectie worden toegevoegd.
