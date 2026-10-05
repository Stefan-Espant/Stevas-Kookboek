# Centaur-collecties voor Steva's Kookboek

Recepten en keukens verhuizen van losse pagina's (met een `recept`-blok) naar twee **collecties** in Centaur. Dit document is de veldenlijst om ze aan te maken. De slugs van collecties en velden moeten **exact** zo heten: de website (`src/lib/recipes.ts`) leest ze zo uit.

Aanmaken: Centaur → **Collecties** → nieuwe collectie, als **Admin**.

> **Let op:** keuze-opties (`options`) en repeater-subvelden (`sub_fields`) kun je nu nog niet in het dashboard instellen; [FieldBuilder.vue](../../Centaur/frontend/components/fields/FieldBuilder.vue) heeft daar geen invoer voor. Dat zit in het Centaur-plan [`2026-10-04-collections-field-config-and-write.md`](../../Centaur/docs/plans/2026-10-04-collections-field-config-and-write.md) (deel A). Maak de collecties dus pas aan als dat gebouwd is, of zet die twee configuraties tijdelijk via de API.

---

## Collectie `keukens`

Naam: **Keukens** · slug: **`keukens`** · maak deze eerst aan, want `recepten` verwijst ernaar.

| Veld (naam) | Slug | Type | Verplicht | Config / toelichting |
|---|---|---|---|---|
| Naam | `naam` | Tekst | ✓ | Zelfstandig: "Italiaans" |
| Bijvoeglijk | `bijvoeglijk` | Tekst | ✓ | Voor zinnen als "de **Italiaanse** keuken" |
| Slug | `slug` | Tekst | ✓ | URL: `/keukens/<slug>`, bv. `italiaans`. Kleine letters en koppeltekens; uniek |
| Intro | `intro` | Richtext | | Korte tekst bovenaan de keukenpagina |
| Afbeelding | `afbeelding` | Media | | Optioneel; anders gebruikt de site een foto van een recept uit deze keuken |
| Alt-tekst afbeelding | `afbeelding_alt` | Tekst | | |

## Collectie `recepten`

Naam: **Recepten** · slug: **`recepten`**

| Veld (naam) | Slug | Type | Verplicht | Config / toelichting |
|---|---|---|---|---|
| Titel | `titel` | Tekst | ✓ | |
| Slug | `slug` | Tekst | ✓ | URL: `/recepten/<slug>`. Kleine letters en koppeltekens; uniek (de build waarschuwt bij dubbele) |
| Intro | `intro` | Richtext | ✓ | 2–4 zinnen; wordt ook de omschrijving in het Recipe-schema |
| Afbeelding | `afbeelding` | Media | ✓ | Staande foto, minstens 1200 px breed |
| Alt-tekst afbeelding | `afbeelding_alt` | Tekst | | Leeg = de titel |
| Keuken | `keuken` | Relatie | | `targetCollection: "keukens"`, `multiple: false` |
| Gang | `gang` | Selectie | | `options: ["Voorgerecht", "Hoofdgerecht", "Bijgerecht", "Soep", "Dessert", "Brunch", "Snack"]` |
| Moeilijkheid | `moeilijkheid` | Selectie | | `options: ["Makkelijk", "Gemiddeld", "Uitdagend"]` |
| Voorbereidingstijd (min) | `voorbereidingstijd` | Getal | ✓ | |
| Bereidingstijd (min) | `bereidingstijd` | Getal | ✓ | |
| Personen | `personen` | Getal | ✓ | Basis voor de rekentool |
| Ingrediënten | `ingredienten` | Repeater | ✓ | Zie subvelden hieronder |
| Bereiding | `bereiding` | Repeater | ✓ | Eén rij per stap, zie subvelden hieronder |
| Tips & variaties | `tips` | Richtext | | |
| Tags | `tags` | Tekst | | Komma-gescheiden: `pasta, snel, vegetarisch` — voedt de inspiratie-thema's |
| Meta-titel | `meta_titel` | Tekst | | Leeg = de titel |
| Meta-omschrijving | `meta_omschrijving` | Tekst | | Max. ~155 tekens; leeg = ingekorte intro |

### Subvelden `ingredienten` (repeater)

Elke rij is één ingrediënt. Door hoeveelheid, eenheid en naam los op te slaan rekent de personen-rekentool exact en kan hij enkelvoud/meervoud kiezen.

| Subveld | Slug | Type | Voorbeeld |
|---|---|---|---|
| Groep | `groep` | Tekst | `Weense aardappelsalade` — alleen invullen bij de eerste rij van een nieuwe groep |
| Hoeveelheid | `hoeveelheid` | Getal | `3` · leeg voor "naar smaak" |
| Eenheid | `eenheid` | Tekst | `kg`, `ml`, `el`, `tl`, `teen` — leeg bij stuks |
| Ingrediënt | `ingredient` | Tekst | `sjalot` (enkelvoud) |
| Meervoud | `ingredient_meervoud` | Tekst | `sjalotten` — leeg als het niet verandert (`peterselie`) |
| Toelichting | `toelichting` | Tekst | `fijngesnipperd` |

### Subvelden `bereiding` (repeater)

| Subveld | Slug | Type | Voorbeeld |
|---|---|---|---|
| Kop | `kop` | Tekst | `Mosselen schoonmaken` — optioneel, verschijnt vet voor de stap |
| Stap | `stap` | Tekst | `Spoel de mosselen in een vergiet onder koud stromend water…` |

---

## Configuratie als JSON

Voor wie de collecties via de API aanmaakt (`POST /api/admin/collections`, Admin-login). De `config`-sleutels zijn dezelfde die het dashboard gebruikt (`targetCollection`, `multiple`, `options`, `sub_fields`).

```json
{
  "name": "Recepten",
  "slug": "recepten",
  "fields": [
    { "name": "Titel", "slug": "titel", "type": "text", "required": true },
    { "name": "Slug", "slug": "slug", "type": "text", "required": true },
    { "name": "Intro", "slug": "intro", "type": "richtext", "required": true },
    { "name": "Afbeelding", "slug": "afbeelding", "type": "media", "required": true },
    { "name": "Alt-tekst afbeelding", "slug": "afbeelding_alt", "type": "text" },
    { "name": "Keuken", "slug": "keuken", "type": "relation", "config": { "targetCollection": "keukens", "multiple": false } },
    { "name": "Gang", "slug": "gang", "type": "select", "config": { "options": ["Voorgerecht", "Hoofdgerecht", "Bijgerecht", "Soep", "Dessert", "Brunch", "Snack"] } },
    { "name": "Moeilijkheid", "slug": "moeilijkheid", "type": "select", "config": { "options": ["Makkelijk", "Gemiddeld", "Uitdagend"] } },
    { "name": "Voorbereidingstijd (min)", "slug": "voorbereidingstijd", "type": "number", "required": true },
    { "name": "Bereidingstijd (min)", "slug": "bereidingstijd", "type": "number", "required": true },
    { "name": "Personen", "slug": "personen", "type": "number", "required": true },
    { "name": "Ingrediënten", "slug": "ingredienten", "type": "repeater", "required": true, "config": { "sub_fields": [
      { "name": "Groep", "slug": "groep", "type": "text" },
      { "name": "Hoeveelheid", "slug": "hoeveelheid", "type": "number" },
      { "name": "Eenheid", "slug": "eenheid", "type": "text" },
      { "name": "Ingrediënt", "slug": "ingredient", "type": "text", "required": true },
      { "name": "Meervoud", "slug": "ingredient_meervoud", "type": "text" },
      { "name": "Toelichting", "slug": "toelichting", "type": "text" }
    ] } },
    { "name": "Bereiding", "slug": "bereiding", "type": "repeater", "required": true, "config": { "sub_fields": [
      { "name": "Kop", "slug": "kop", "type": "text" },
      { "name": "Stap", "slug": "stap", "type": "text", "required": true }
    ] } },
    { "name": "Tips & variaties", "slug": "tips", "type": "richtext" },
    { "name": "Tags", "slug": "tags", "type": "text" },
    { "name": "Meta-titel", "slug": "meta_titel", "type": "text" },
    { "name": "Meta-omschrijving", "slug": "meta_omschrijving", "type": "text" }
  ]
}
```

```json
{
  "name": "Keukens",
  "slug": "keukens",
  "fields": [
    { "name": "Naam", "slug": "naam", "type": "text", "required": true },
    { "name": "Bijvoeglijk", "slug": "bijvoeglijk", "type": "text", "required": true },
    { "name": "Slug", "slug": "slug", "type": "text", "required": true },
    { "name": "Intro", "slug": "intro", "type": "richtext" },
    { "name": "Afbeelding", "slug": "afbeelding", "type": "media" },
    { "name": "Alt-tekst afbeelding", "slug": "afbeelding_alt", "type": "text" }
  ]
}
```

## Daarna

1. Website leest uit `GET /content/recepten` en `GET /content/keukens` (alleen gepubliceerde items, relaties uitgevouwen) i.p.v. pagina's.
2. Recept-URL's worden `/recepten/<slug>`; de 5 bestaande recepten krijgen een redirect van `/<slug>` naar `/recepten/<slug>`.
3. Nieuwe recepten worden als concept in de collectie gezet via de schrijfsleutel (Centaur-plan deel B); publiceren doe je zelf.
