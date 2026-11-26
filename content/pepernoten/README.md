# Pepernoten — Traditioneel, maar top!

Tien nieuwe kruidnotenrecepten voor de Sinterklaasreeks van november 2026. De teksten komen uit de eerder uitgewerkte receptconcepten in `output/reels/sinterklaas-2026/recepten.json`. `recipes.json` bevat de volledige Centaur-velden, waaronder losse numerieke hoeveelheden, groepen, stappen, bewaartips, vragen, meta-omschrijvingen en de mediabibliotheek-URL's.

## Pagina's

Het overzicht staat op **`/inspiratie/pepernoten`**. Het gebruikt de bestaande dynamische inspiratiepagina en de tag `pepernoten`. De kaart verschijnt daardoor ook onder Inspiratie. Klassieke roomboter staat bovenaan; daarna staan de smaken alfabetisch. De kaarten vormen op desktop rijen van 3 + 3 + 2 + 2, op tablet vijf rijen van twee, en op mobiel één kolom.

De receptpagina's gebruiken de bestaande RecipeView met ingrediëntenrekentool, printknop, Recipe/FAQ-schema en gerelateerde smaken. Het kruimelpad linkt terug naar het pepernotenoverzicht.

| Smaak | Pad |
|---|---|
| Klassieke roomboter | `/recepten/kruidnoten-roomboter` |
| Pandan en kokos | `/recepten/kruidnoten-pandan-kokos` |
| Pumpkin spice | `/recepten/kruidnoten-pumpkin-spice` |
| Salted caramel | `/recepten/kruidnoten-salted-caramel` |
| Pistache en witte chocolade | `/recepten/kruidnoten-pistache-witte-chocolade` |
| Espresso en pure chocolade | `/recepten/kruidnoten-espresso-pure-chocolade` |
| Sinaasappel en pure chocolade | `/recepten/kruidnoten-sinaasappel-pure-chocolade` |
| Citroen en maanzaad | `/recepten/kruidnoten-citroen-maanzaad` |
| Chai en vanille | `/recepten/kruidnoten-chai-vanille` |
| Framboos en witte chocolade | `/recepten/kruidnoten-framboos-witte-chocolade` |

## Beelden

Tien eigen sfeerbeelden, gegenereerd met de ingebouwde imagegen-tool. De precieze prompts staan in `beeldprompts.json`; de originele PNG's staan lokaal in `output/pepernoten-2026/bronafbeeldingen/`. De beelden zijn zonder uitsnede naar WebP gecodeerd en naar de mediabibliotheek van Centaur geüpload. De overzichtsillustratie komt uit de eerder gemaakte animatie en staat in `public/images/pepernoten/strooizak.webp`.

## Import

```sh
node scripts/import-pepernoten.mjs
node scripts/import-pepernoten.mjs --apply
```

De eerste opdracht valideert zonder te schrijven. De tweede maakt uitsluitend concepten met de Nederlandse keukenrelatie. Bestaande recepten worden niet overschreven; afwijkende inhoud stopt de import. De voortgang staat lokaal in `output/pepernoten-2026/import-resultaten.json`. Een tweede import is gecontroleerd en slaat de bestaande identieke recepten over. Alle tien opgeslagen concepten zijn inhoudelijk teruggelezen.

Het bestaande adventrecept `/recepten/kruidnoten` is ongewijzigd. De nieuwe recepten zijn niet proefgebakken; dat staat ook in de conceptteksten. De ContentWrite-API biedt geen publicatiemethode. Publiceer de tien concepten in Centaur en bouw/deploy daarna de gewone site; het overzicht verschijnt vanzelf zodra minstens één recept met de tag `pepernoten` gepubliceerd is. Het beperkte script `publiceren-in-centaur.js` kan daarvoor in de browserconsole van het ingelogde Centaur-dashboard worden uitgevoerd (Admin). Het controleert eerst de tien vaste ID’s en slugs en publiceert alleen deze reeks. Accounts, favorieten en beoordelingen maken geen deel uit van deze publicatie. De klassieke variant heet **Kruidnoten**; de URL blijft `/recepten/kruidnoten-roomboter`.

## Controle

- Gewone build en conceptbuild slagen.
- Op de schone productiebranch meldt `npm run check` elf ontbrekende Node-typedeclaraties in ongewijzigde bestanden. Dezelfde controle op de ongewijzigde productiecode geeft exact dezelfde elf meldingen; geen nieuwe meldingen door deze wijziging. De lokale adventbranch heeft daarnaast bestaande impliciete `any`-parameters.
- De hoeveelheidknop ondersteunt nu ook bakrecepten met meer dan 24 stuks. De personenlimiet blijft minimaal 24. `⅛` wordt zowel op de server als in de rekentool exact weergegeven.
- `scripts/check-pepernoten.cjs` controleert het overzicht op 390, 768 en 1440 px, de tien receptpagina's, afbeeldingen, Recipe-schema, teruglinks, ontbreken van horizontale overflow, toetsenbordanker, rekentool en basisinhoud zonder JavaScript.
- Browserresultaten en screenshots staan in `output/pepernoten-2026/`.

```sh
SITE_URL=https://www.stevaskookboek.nl npm run build:preview
python3 -m http.server 4388 --bind 127.0.0.1 --directory .vercel/output/static
NODE_PATH=/private/tmp/steva-sint-tools/node_modules node scripts/check-pepernoten.cjs
```

De conceptbuild is alleen voor lokale controle. Deploy de gewone build om concepten buiten de publieke website te houden.
