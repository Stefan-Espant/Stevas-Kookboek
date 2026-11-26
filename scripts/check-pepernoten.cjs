// NODE_PATH=<playwright-installatie>/node_modules node scripts/check-pepernoten.cjs [preview-url]
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const plan = JSON.parse(fs.readFileSync('content/pepernoten/recipes.json', 'utf8'))
const base = process.argv[2] || 'http://127.0.0.1:4388'
const directory = 'output/pepernoten-2026/controle'
fs.mkdirSync(directory, { recursive: true })

;(async () => {
  const browser = await chromium.launch()
  const errors = []
  const results = []
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    await context.addInitScript(() => localStorage.setItem('centaur-cookie-consent', JSON.stringify({ analytics: false, marketing: false })))
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    const visit = async path => {
      const response = await page.goto(base + path, { waitUntil: 'networkidle' })
      assert.equal(response.status(), 200, path)
      await page.evaluate(() => document.fonts.ready)
      assert.equal(await page.locator('h1').count(), 1, 'Eén H1 op ' + path)
    }
    const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Geen horizontale overflow')
    const capture = async path => {
      // Een volledige paginascreenshot scrollt niet: laad ook foto's onder de vouw
      // voordat we het beeld beoordelen, terwijl de website zelf lazy loading behoudt.
      await page.locator('img').evaluateAll(async images => {
        images.forEach(image => { image.loading = 'eager' })
        await Promise.all(images.map(image => image.decode()))
      })
      await page.screenshot({ path, fullPage: true })
    }
    for (const [width, rows] of [[1440, [3, 3, 2, 2]], [768, [2, 2, 2, 2, 2]], [390, Array(10).fill(1)]]) {
      await page.setViewportSize({ width, height: 1000 })
      await visit('/inspiratie/pepernoten/')
      assert.equal(await page.locator('#smaken .recipe-card').count(), 10)
      const links = await page.locator('#smaken .recipe-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')))
      assert.deepEqual([...links].sort(), plan.map(r => '/recepten/' + r.data.slug).sort())
      assert.equal(links[0], '/recepten/kruidnoten-roomboter', 'Traditionele smaak eerst')
      const actual = await page.locator('#smaken .recipe-grid > div').evaluateAll(cards => {
        const rows = new Map()
        for (const card of cards) { const y = Math.round(card.getBoundingClientRect().top); rows.set(y, (rows.get(y) || 0) + 1) }
        return [...rows.values()]
      })
      assert.deepEqual(actual, rows)
      await noOverflow()
      await page.getByRole('link', { name: 'Kies jouw smaak ↓' }).focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => location.hash === '#smaken')
      await page.evaluate(() => window.scrollTo(0, 0))
      if (width !== 768) await capture(`${directory}/overzicht-${width}.png`)
      results.push(`${width}px: 10 kaarten, rijverdeling ${actual.join('+')}, toetsenbordanker en geen overflow`)
    }
    for (const { data } of plan) {
      await visit('/recepten/' + data.slug + '/')
      assert.equal(await page.locator('h1').textContent(), data.titel)
      await page.waitForFunction(() => { const image = document.querySelector('.recipe__image'); return image?.complete && image.naturalWidth > 0 })
      const schema = await page.locator('script[type="application/ld+json"]').evaluateAll(scripts => scripts.map(s => JSON.parse(s.textContent)).find(s => s['@type'] === 'Recipe'))
      assert.equal(schema.recipeYield, '70 stuks')
      assert.equal(schema.recipeIngredient.length, data.ingredienten.length)
      assert.equal(schema.recipeInstructions.length, data.bereiding.length)
      assert.equal(schema.image[0], data.afbeelding)
      assert.equal(await page.locator('.recipe__scaler output').textContent(), '70')
      assert(await page.locator('a[href="/inspiratie/pepernoten"]').count() >= 1)
      assert.equal(await page.locator('.more-recipes .recipe-card').count(), 3)
      await noOverflow()
    }
    results.push('Alle 10 receptpagina’s: HTTP 200, afbeelding geladen, ingrediënten, stappen, schema, 70 stuks en teruglink')
    await visit('/recepten/kruidnoten-pumpkin-spice/')
    assert((await page.locator('.recipe__qty').allTextContents()).includes('⅛'), 'Achtste theelepel blijft exact')
    const plus = page.getByRole('button', { name: 'Eén stuk meer', exact: true })
    const minus = page.getByRole('button', { name: 'Eén stuk minder', exact: true })
    await plus.click()
    assert.equal(await page.locator('.recipe__scaler output').textContent(), '71')
    await minus.click()
    for (let i = 0; i < 35; i++) await minus.click()
    assert.equal(await page.locator('.recipe__scaler output').textContent(), '35')
    assert.equal(await page.locator('.recipe__qty').first().textContent(), '125', 'Halve hoeveelheid meel')
    assert.equal(await page.locator('[data-fact="personen"] dd').textContent(), '35')
    await capture(`${directory}/recept-mobiel.png`)
    await page.setViewportSize({ width: 1440, height: 1000 })
    await visit('/recepten/kruidnoten-pandan-kokos/')
    await capture(`${directory}/recept-desktop.png`)
    results.push('Rekentool: 70 → 71 → 70 → 35; ingrediënten en opbrengst schalen mee; ⅛ correct')
    await visit('/recepten/kruidnoten/')
    assert.equal(await page.locator('.recipe__scaler output').textContent(), '8')
    await page.getByRole('button', { name: 'Eén persoon meer', exact: true }).click()
    assert.equal(await page.locator('.recipe__scaler output').textContent(), '9')
    results.push('Bestaand adventrecept: personenrekentool blijft werken')
    await visit('/inspiratie/')
    assert(await page.locator('a[href="/inspiratie/pepernoten"]').count() >= 1)
    const noJs = await browser.newContext({ javaScriptEnabled: false })
    const staticPage = await noJs.newPage()
    const response = await staticPage.goto(base + '/recepten/kruidnoten-roomboter/')
    assert.equal(response.status(), 200)
    assert.equal(await staticPage.locator('.recipe__steps ol > li').count(), 5)
    await noJs.close()
    results.push('Receptinhoud ook beschikbaar zonder JavaScript; overzicht vindbaar onder Inspiratie')
    assert.deepEqual(errors, [])
    fs.writeFileSync('output/pepernoten-2026/browsercontrole.json', JSON.stringify({ results, errors }, null, 2) + '\n')
    console.log(results.join('\n'))
  } finally {
    await browser.close()
  }
})().catch(error => { console.error(error); process.exitCode = 1 })
