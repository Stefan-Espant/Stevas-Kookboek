// Vereist Playwright met Chromium en een draaiende conceptpreview.
// NODE_PATH=<playwright-installatie>/node_modules node scripts/check-halloween-grid.cjs [basis-URL]
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const base = process.argv[2] || 'http://127.0.0.1:4387'

;(async () => {
  const browser = await chromium.launch()
  try {
    // Normale beweging is essentieel: GSAP clearProps verwijdert inline stijlen.
    const page = await browser.newPage({ reducedMotion: 'no-preference' })
    await page.addInitScript(() => localStorage.setItem('centaur-cookie-consent', JSON.stringify({ analytics: false, marketing: false })))
    for (const [width, expected] of [
      [1440, [3, 3, 2, 2]],
      [768, [2, 2, 2, 2, 2]],
      [390, Array(10).fill(1)]
    ]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(base + '/inspiratie/halloween/', { waitUntil: 'networkidle' })
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      for (let y = 0; y < height; y += 650) {
        await page.evaluate(y => window.scrollTo(0, y), y)
        await page.waitForTimeout(1500)
      }
      await page.waitForTimeout(1600)
      const cards = page.locator('.recipe-grid--balanced > div')
      assert.equal(await cards.count(), 10)
      assert.equal(await page.locator('.recipe-grid--balanced > div[data-reveal]').count(), 0, 'Alle kaarten moeten daadwerkelijk zijn geanimeerd')
      const rows = await cards.evaluateAll(elements => {
        const counts = new Map()
        for (const element of elements) {
          const top = Math.round(element.getBoundingClientRect().top)
          counts.set(top, (counts.get(top) || 0) + 1)
        }
        return [...counts.values()]
      })
      assert.deepEqual(rows, expected, `Rijverdeling na animatie op ${width}px`)
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Geen horizontale overflow')
      console.log(`${width}px: ${rows.join(' + ')} na alle animaties`)
    }
  } finally {
    await browser.close()
  }
})().catch(error => { console.error(error); process.exitCode = 1 })
