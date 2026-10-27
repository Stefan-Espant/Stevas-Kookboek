// Vleermuizen op /inspiratie/halloween (alleen op een pagina met data-season-effect="halloween",
// geladen door motion.js na "load"). Om de paar seconden fladdert er een vleermuis (soms een klein
// groepje) in een golvende baan over het scherm. Klikken gaan erdoor (pointer-events: none).
// Niet bij "minder beweging" of Save-Data; geen nieuwe vleermuizen als het tabblad verborgen is.
;(function () {
  if (!document.querySelector('[data-season-effect="halloween"]')) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (navigator.connection && navigator.connection.saveData) return
  var gsap = window.gsap
  if (!gsap) return
  var random = gsap.utils.random

  var style = document.createElement('style')
  style.textContent =
    '.hw-bats{position:fixed;inset:0;z-index:5;overflow:hidden;pointer-events:none}' +
    '.hw-bat{position:absolute;left:0;top:0;color:#0d0201;filter:drop-shadow(0 0 4px rgba(255,120,20,.35))}' +
    '.hw-bat .vleugel{transform-box:fill-box;animation:hw-fladder .14s ease-in-out infinite alternate}' +
    '.hw-bat .vleugel--l{transform-origin:100% 40%}.hw-bat .vleugel--r{transform-origin:0 40%}' +
    '@keyframes hw-fladder{to{transform:scaleY(.2)}}'
  document.head.appendChild(style)

  var layer = document.createElement('div')
  layer.className = 'hw-bats'
  layer.setAttribute('aria-hidden', 'true')
  document.body.appendChild(layer)

  var BAT = '<svg viewBox="0 0 120 50" fill="currentColor">' +
    '<path class="vleugel vleugel--l" d="M52 22 Q34 2 2 10 Q14 16 12 26 Q22 20 28 30 Q36 22 44 32 Q48 26 52 28 Z"/>' +
    '<path class="vleugel vleugel--r" d="M68 22 Q86 2 118 10 Q106 16 108 26 Q98 20 92 30 Q84 22 76 32 Q72 26 68 28 Z"/>' +
    '<ellipse cx="60" cy="26" rx="9" ry="13"/><path d="M53 15 L55 6 L58 14 Z M67 15 L65 6 L62 14 Z"/></svg>'

  function bat(delay) {
    var el = document.createElement('div')
    el.className = 'hw-bat'
    var size = random(34, 78)
    el.style.width = size + 'px'
    el.innerHTML = BAT
    layer.appendChild(el)
    var fromLeft = Math.random() < 0.5
    var w = innerWidth, h = innerHeight
    var y = random(0.08, 0.6) * h
    var duration = random(3.2, 5.5)
    gsap.set(el, { x: fromLeft ? -size - 20 : w + 20, y: y, scaleX: fromLeft ? 1 : -1 })
    gsap.to(el, { x: fromLeft ? w + 20 : -size - 20, duration: duration, delay: delay, ease: 'none', onComplete: function () { el.remove() } })
    // Golvende, onrustige vlucht.
    gsap.to(el, { y: y + random(-120, 120), duration: duration / random(2, 4), delay: delay, ease: 'sine.inOut', yoyo: true, repeat: 5 })
  }

  function next() {
    setTimeout(function () {
      if (!document.hidden) {
        var groep = Math.random() < 0.3 ? Math.round(random(2, 4)) : 1
        for (var i = 0; i < groep; i++) bat(i * random(0.15, 0.5))
      }
      next()
    }, random(3500, 9000))
  }
  setTimeout(function () { bat(0); next() }, 1200)
})()
