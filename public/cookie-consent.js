(function () {
  var banner = document.querySelector('.cms-cookie-banner')
  var dialog = document.querySelector('.cms-cookie-dialog')
  if (!banner || !dialog || banner.dataset.initialized) return
  banner.dataset.initialized = 'true'

  var consentKey = 'centaur-cookie-consent'
  var enabled = banner.dataset.enabled === 'true'
  var analyticsId = banner.dataset.analyticsId || ''
  var metaPixelId = banner.dataset.metaPixelId || ''
  var capturlyAccount = banner.dataset.capturlyAccount || ''
  var capturlySiteId = banner.dataset.capturlySiteId || ''
  var analyticsCheckbox = dialog.querySelector('input[name="analytics"]')
  var marketingCheckbox = dialog.querySelector('input[name="marketing"]')
  var marketingOption = marketingCheckbox.closest('label')
  if (marketingOption) marketingOption.hidden = !metaPixelId

  function readConsent() {
    try {
      var raw = localStorage.getItem(consentKey)
      if (raw === 'accepted') return { analytics: true }
      var consent = JSON.parse(raw)
      return consent && typeof consent === 'object' && !Array.isArray(consent) ? consent : null
    } catch (e) { return null }
  }

  function writeConsent(consent) {
    try {
      localStorage.setItem(consentKey, JSON.stringify({
        analytics: consent.analytics === true,
        marketing: consent.marketing === true,
        date: new Date().toISOString()
      }))
    } catch (e) {}
  }

  function loadAnalytics(id) {
    if (!id || document.querySelector('script[data-centaur-analytics]')) return
    var script = document.createElement('script')
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id)
    script.dataset.centaurAnalytics = id
    window.dataLayer = window.dataLayer || []
    window.gtag = function () { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', id)
    document.head.appendChild(script)
  }

  function loadCapturly() {
    if (!capturlyAccount || !capturlySiteId || document.querySelector('script[data-capturly]')) return
    window.trq = window.trq || function () { (window.trq.q = window.trq.q || []).push(arguments) }
    window.trq('account', capturlyAccount)
    window.trq('collectorUrl', 'https://collector.capturly.com/collect')
    window._paq = window._paq || []
    window._paq.push(['enableLinkTracking'])
    window._paq.push(['setTrackerUrl', 'https://collector.capturly.com/track'])
    window._paq.push(['setSiteId', capturlySiteId])
    var script = document.createElement('script')
    script.async = true
    script.defer = true
    script.src = 'https://capturly.com/capturly-track-js.js'
    script.dataset.capturly = capturlySiteId
    document.head.appendChild(script)
  }

  function loadMetaPixel(id) {
    if (!/^\d{5,25}$/.test(id) || document.querySelector('script[data-meta-pixel]')) return
    // Dezelfde queue als de Meta-basiscode, pas aangemaakt na marketingtoestemming.
    if (!window.fbq) {
      var fbq = window.fbq = function () {
        if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments)
        else fbq.queue.push(arguments)
      }
      window._fbq = fbq
      fbq.push = fbq
      fbq.loaded = true
      fbq.version = '2.0'
      fbq.queue = []
    }
    window.fbq('consent', 'grant')
    window.fbq('init', id)
    window.fbq('track', 'PageView')
    var script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    script.dataset.metaPixel = id
    document.head.appendChild(script)
  }

  function removeTracking(consent) {
    var removeAnalytics = consent.analytics !== true
    var removeMarketing = consent.marketing !== true
    var analyticsLoaded = !!document.querySelector('script[data-centaur-analytics]')
    var capturlyLoaded = !!document.querySelector('script[data-capturly]')
    var metaLoaded = !!document.querySelector('script[data-meta-pixel]')
    if (removeAnalytics && analyticsLoaded) window['ga-disable-' + analyticsId] = true
    if (removeAnalytics && capturlyLoaded && window._paq) {
      window._paq.push(['disableCookies'])
      window._paq.push(['deleteCookies'])
    }
    if (removeMarketing && window.fbq) window.fbq('consent', 'revoke')

    var domains = ['', location.hostname]
    var parts = location.hostname.split('.')
    for (var i = 0; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'))
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim()
      if (!((removeAnalytics && /^(_ga|_tr_)/.test(name)) || (removeMarketing && /^_fb[pc]$/.test(name)))) return
      domains.forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '')
      })
    })
    if ((removeAnalytics && (analyticsLoaded || capturlyLoaded)) || (removeMarketing && metaLoaded)) {
      location.reload()
      return true
    }
    return false
  }

  function apply(consent) {
    if (!enabled || (consent && consent.analytics === true)) loadAnalytics(analyticsId)
    if (consent && consent.analytics === true) loadCapturly()
    // Een oude statistiekenkeuze geeft nooit toestemming voor marketing.
    if (consent && consent.marketing === true) loadMetaPixel(metaPixelId)
  }

  function choose(consent) {
    writeConsent(consent)
    banner.hidden = true
    if (dialog.open) dialog.close()
    if (!removeTracking(consent)) apply(consent)
  }

  function openPreferences() {
    var consent = readConsent()
    analyticsCheckbox.checked = !!(consent && consent.analytics === true)
    marketingCheckbox.checked = !!(consent && consent.marketing === true)
    dialog.showModal()
  }

  document.addEventListener('click', function (event) {
    var choice = event.target.closest('[data-cookie-choice]')
    if (choice) {
      var all = choice.dataset.cookieChoice === 'all'
      return choose({ analytics: all, marketing: all })
    }
    if (event.target.closest('[data-cookie-save]')) {
      return choose({ analytics: analyticsCheckbox.checked, marketing: marketingCheckbox.checked })
    }
    if (event.target.closest('[data-cookie-preferences]')) {
      event.preventDefault()
      openPreferences()
    }
  })
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close() })
  document.querySelectorAll('.site-footer [data-cookie-preferences]').forEach(function (link) { link.hidden = !enabled })

  var consent = readConsent()
  // Laat eerdere bezoekers een expliciete keuze maken voor de nieuwe categorie.
  banner.hidden = !(enabled && (!consent || (metaPixelId && typeof consent.marketing !== 'boolean')))
  apply(consent)
})()
