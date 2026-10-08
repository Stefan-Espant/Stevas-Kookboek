// Beweging voor de hele site, met GSAP + ScrollTrigger (public/vendor, zie wald.config.ts) en
// public/motion.css:
// (de hero animeert met CSS, zodat hij niet op dit script hoeft te wachten — beter voor LCP)
// 2. [data-reveal]-blokken schuiven binnen zodra ze in beeld komen, gespreid per groep;
// 3. [data-parallax]-foto's bewegen iets trager mee met scrollen;
// 4. [data-count]-getallen tellen op;
// 5. bij een view transition groeit de receptfoto van kaart naar receptpagina (en terug).
// <head> zet html.motion vóór de eerste paint en haalt hem na een time-out weer weg als dit
// script niet start: inhoud blijft nooit onzichtbaar. Bij prefers-reduced-motion gebeurt niets.
;(function () {
  var root = document.documentElement
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function init() {
    var gsap = window.gsap
    var ScrollTrigger = window.ScrollTrigger
    window.__stevaMotion = true
    if (reduced || !gsap || !ScrollTrigger) {
      root.classList.remove('motion')
      return
    }
    gsap.registerPlugin(ScrollTrigger)
    var EASE = 'power3.out'

    // ── 2. Binnenschuiven ────────────────────────────────────────────────────────────────
    // Per variant de beginstand; de eindstand is altijd "gewoon". Na afloop worden de inline
    // stijlen gewist, zodat hover-effecten van de componenten weer werken.
    var WIPE_FROM = 'inset(100% 0% 0% 0% round 0.875rem)'
    var WIPE_TO = 'inset(0% 0% 0% 0% round 0.875rem)'
    var variants = {
      '': { y: 32 },
      // Receptkaarten worden "uitgedeeld": afwisselend iets gedraaid, dan recht op tafel.
      card: { y: 44, scale: 0.96, rotation: function (i) { return i % 2 ? 1.5 : -2 } },
      left: { x: -48 },
      right: { x: 48 },
      fade: {},
      wipe: { clipPath: WIPE_FROM, autoAlpha: 1 },
      stamp: { scale: 1.5, rotation: -14 }
    }
    var timing = {
      wipe: { duration: 1.1, ease: 'power3.inOut' },
      stamp: { duration: 0.7, ease: 'back.out(2.2)' }
    }
    Object.keys(variants).forEach(function (name) {
      var selector = '[data-reveal="' + name + '"]'
      if (!document.querySelector(selector)) return
      ScrollTrigger.batch(selector, {
        start: 'top 90%',
        once: true,
        onEnter: function (elements) {
          elements.forEach(function (el) { el.removeAttribute('data-reveal') })
          var to = Object.assign(
            { autoAlpha: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 0.9, ease: EASE, stagger: 0.08, clearProps: 'all' },
            timing[name] || {},
            name === 'wipe' ? { clipPath: WIPE_TO } : {}
          )
          gsap.fromTo(elements, Object.assign({ autoAlpha: 0 }, variants[name]), to)
          // Bij een onthulling zoomt de foto erin mee uit (niet bij parallax: die beweegt de foto al).
          if (name === 'wipe') {
            gsap.fromTo(elements.filter(function (el) { return !el.hasAttribute('data-parallax') })
              .map(function (el) { return el.querySelector('img') }).filter(Boolean),
              { scale: 1.18 }, { scale: 1, duration: 1.4, ease: EASE, stagger: 0.08, clearProps: 'transform' })
          }
          elements.forEach(function (el) { el.querySelectorAll('[data-count]').forEach(countUp) })
        }
      })
    })

    // ── 3. Parallax ──────────────────────────────────────────────────────────────────────
    gsap.utils.toArray('[data-parallax]').forEach(function (frame) {
      var img = frame.querySelector('img')
      if (!img) return
      img.style.transition = 'none' // geen CSS-vertraging bovenop het meescrollen
      gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, {
        yPercent: 6, scale: 1.14, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
      })
    })

    // ── 4. Optellen ──────────────────────────────────────────────────────────────────────
    function countUp(el) {
      var target = Number(el.dataset.count)
      if (!target) return
      var counter = { value: 0 }
      gsap.to(counter, {
        value: target, duration: 1.4, ease: 'power2.out',
        onUpdate: function () { el.textContent = Math.round(counter.value) }
      })
    }
    // Getallen buiten een reveal-blok tellen op zodra ze zelf in beeld komen.
    gsap.utils.toArray('[data-count]').forEach(function (el) {
      if (el.closest('[data-reveal]')) return
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { countUp(el) } })
    })

    // Filters (/recepten) en zoeken (/zoeken) tonen kaarten die nog niet onthuld waren:
    // posities herberekenen, anders blijven ze verborgen.
    var refresh = function () { requestAnimationFrame(function () { ScrollTrigger.refresh() }) }
    ;['click', 'input', 'change'].forEach(function (type) { document.addEventListener(type, refresh) })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()

  // Shader-achtergronden (stoom, zie Layout.wald): public/effects.js alleen laden als de pagina een
  // <canvas data-effect> heeft. Los van GSAP; effects.js regelt zelf "minder beweging".
  // Pas na "load" en als de browser vrij is: de shader-start houdt anders de hoofdthread bezig
  // terwijl de pagina nog moet verschijnen.
  function loadEffects() {
    var effects = document.createElement('script')
    effects.src = '/effects.js'
    effects.async = true
    document.head.appendChild(effects)
  }
  function whenIdle() {
    if ('requestIdleCallback' in window) requestIdleCallback(loadEffects, { timeout: 2000 })
    else setTimeout(loadEffects, 200)
  }
  if (document.querySelector('canvas[data-effect]')) {
    if (document.readyState === 'complete') whenIdle()
    else window.addEventListener('load', whenIdle, { once: true })
  }

  // ── 5. Gedeelde receptfoto tussen pagina's (cross-document view transitions) ─────────────
  // Alleen de foto van het aangeklikte recept krijgt de naam, en pas tijdens de overgang: een
  // naam moet uniek zijn, en 150 benoemde kaarten zouden elke overgang zwaar maken.
  var RECIPE = /^\/recepten\/[^/]+$/
  function pathOf(url) {
    try { return new URL(url).pathname.replace(/\/$/, '') } catch (e) { return '' }
  }
  function recipeImage(path) {
    if (!RECIPE.test(path)) return null
    if (location.pathname.replace(/\/$/, '') === path) return document.querySelector('.recipe__image')
    var link = document.querySelector('a.recipe-card[href="' + path + '"], a.featured__media[href="' + path + '"]')
    return link && link.querySelector('.recipe-card__image, .featured__image')
  }
  function tag(el, transition) {
    if (!el || !transition) return
    el.style.viewTransitionName = 'recipe-image'
    transition.finished.finally(function () { el.style.viewTransitionName = '' })
  }
  window.addEventListener('pageswap', function (event) {
    if (!event.viewTransition || !event.activation || !event.activation.entry) return
    var to = pathOf(event.activation.entry.url)
    tag(recipeImage(RECIPE.test(to) ? to : location.pathname.replace(/\/$/, '')), event.viewTransition)
  })
  window.addEventListener('pagereveal', function (event) {
    if (!event.viewTransition || !window.navigation || !navigation.activation || !navigation.activation.from) return
    var here = location.pathname.replace(/\/$/, '')
    tag(recipeImage(RECIPE.test(here) ? here : pathOf(navigation.activation.from.url)), event.viewTransition)
  })
})()
