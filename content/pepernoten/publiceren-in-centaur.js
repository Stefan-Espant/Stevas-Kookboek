// Uitvoeren in de browserconsole van het ingelogde Centaur-dashboard (Admin).
// Publiceert uitsluitend deze tien vooraf gecontroleerde recepten; geen veldwijzigingen.
(async () => {
  if (!/(^|\.)centaur-cms\.app$/.test(location.hostname)) throw new Error('Open eerst het Centaur-dashboard.');
  const token = localStorage.getItem('centaur_token');
  if (!token) throw new Error('Log eerst in op Centaur als Admin.');
  const targets = [
  {
    "id": "a9f7d21b-ab7a-422c-9dbe-93de75c6d56e",
    "slug": "kruidnoten-roomboter"
  },
  {
    "id": "3b873db6-c957-4fd9-8afa-bc44bc349737",
    "slug": "kruidnoten-pandan-kokos"
  },
  {
    "id": "b7495ff8-543e-4a27-9c62-f708d71a1f20",
    "slug": "kruidnoten-pumpkin-spice"
  },
  {
    "id": "7ec720fa-4e3e-4dab-8267-10074921ab0a",
    "slug": "kruidnoten-salted-caramel"
  },
  {
    "id": "de7adf87-8db0-46a9-886b-3ce06c0b8133",
    "slug": "kruidnoten-pistache-witte-chocolade"
  },
  {
    "id": "935e1f19-1829-407a-9655-8de261dadf0b",
    "slug": "kruidnoten-espresso-pure-chocolade"
  },
  {
    "id": "af5be754-8cbc-434d-8786-3c12a526b2a7",
    "slug": "kruidnoten-sinaasappel-pure-chocolade"
  },
  {
    "id": "bde709df-752f-45a0-8346-a994b065b5cc",
    "slug": "kruidnoten-citroen-maanzaad"
  },
  {
    "id": "ecc014fb-49f2-424e-ad78-1d60a3ca148e",
    "slug": "kruidnoten-chai-vanille"
  },
  {
    "id": "f3e66af6-7af9-4dc4-a4dd-89ecc8a835f8",
    "slug": "kruidnoten-framboos-witte-chocolade"
  }
];
  const call = async (path, method = 'GET') => {
    const response = await fetch('https://api.centaur-cms.app/api/admin/collections/recepten/entries/' + path, {
      method, headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Centaur ${method}: ${response.status}; gestopt. Al gepubliceerde recepten blijven gepubliceerd.`);
    return response.json();
  };
  // Controleer alle ID's en slugs voordat het eerste recept gepubliceerd wordt.
  const entries = [];
  for (const target of targets) {
    const entry = await call(target.id);
    if (entry.id !== target.id || entry.data.slug !== target.slug || !['draft', 'published'].includes(entry.status)) throw new Error(`Onverwacht recept: ${target.slug}`);
    entries.push(entry);
  }
  for (const entry of entries) {
    if (entry.status !== 'published') {
      const published = await call(entry.id + '/publish', 'POST');
      if (published.status !== 'published') throw new Error(`Publicatie niet bevestigd: ${entry.data.slug}`);
    }
    console.log('Gepubliceerd:', entry.data.slug);
  }
  console.log('Alle tien pepernotenrecepten zijn gepubliceerd. Laat daarna de gewone websitebuild draaien.');
})().catch(console.error);
