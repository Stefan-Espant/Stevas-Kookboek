// Vallende herfstbladeren (alleen op een pagina met data-season-effect="herfst", geladen door
// motion.js na "load"). Zo echt mogelijk, zonder WebGL:
// - vorm: esdoorn, eik en beuk met kartelranden; elk blad krijgt iets andere maten;
// - huid: kleurverloop van de nerf naar de punt, donkere randen, nerven, korrel en vlekken
//   (SVG-ruis, één keer gerasterd);
// - volume: het blad is langs de middennerf licht gevouwen (twee helften in 3D), met een
//   doffere achterkant;
// - licht: elke helft wordt lichter of donkerder naar hoe hij naar het licht (linksboven) staat;
// - beweging: vallen als een slinger (zijwaartse boog die aan de uiteinden even optilt en
//   kantelt), sommige bladeren tollen, en windvlagen (GSAP) duwen alle bladeren tegelijk.
// Twee lagen voor diepte: kleine, vage bladeren achter de inhoud, een paar grote ervoor (klikken
// gaan erdoor). Niet bij "minder beweging" of Save-Data; gsap.ticker stopt vanzelf als het
// tabblad verborgen is.
;(function () {
  if (!document.querySelector('[data-season-effect="herfst"]')) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (navigator.connection && navigator.connection.saveData) return
  var gsap = window.gsap
  if (!gsap) return

  var NS = 'http://www.w3.org/2000/svg'
  var small = matchMedia('(max-width: 639px)').matches
  var random = gsap.utils.random
  var DEG = Math.PI / 180

  // ── Vormen (viewBox 0 0 100 100, steel onderaan op 50,84) ───────────────────────────────
  var MAPLE = [[50, 84], [44, 78], [34, 80], [30, 74], [20, 76], [24, 70], [9, 66], [18, 60], [14, 54], [22, 54], [5, 40], [20, 40], [17, 32], [26, 36], [25, 25], [34, 32], [35, 21], [40, 29], [44, 25], [45, 13], [50, 3], [55, 13], [56, 25], [60, 29], [65, 21], [66, 32], [75, 25], [74, 36], [83, 32], [80, 40], [95, 40], [78, 54], [86, 54], [82, 60], [91, 66], [76, 70], [80, 76], [70, 74], [66, 80], [56, 78]]
  var MAPLE_VEINS = 'M50 84 L50 6 M50 72 L9 66 M50 72 L91 66 M50 68 L6 41 M50 68 L94 41 M50 64 L26 26 M50 64 L74 26 M36 53 L22 54 M64 53 L78 54 M30 47 L20 40 M70 47 L80 40'
  function jitter(points, amount) {
    return points.map(function (p, i) { return i === 0 ? p : [p[0] + random(-amount, amount), p[1] + random(-amount, amount)] })
  }
  function polygon(points) {
    return 'M' + points.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1) }).join(' L') + ' Z'
  }
  // Beuk/berk: ovaal met fijne tandjes en schuin oplopende zijnerven.
  function beech() {
    var right = [], left = [], veins = 'M50 86 L50 8'
    var width = random(19, 25)
    var shape = function (s) { return width * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.8)), 0.85) }
    for (var i = 0; i <= 24; i++) {
      var s = i / 24
      var y = 86 - s * 80
      var w = shape(s) + (i % 2 && i < 23 ? 1.4 : 0)
      right.push([50 + w, y])
      left.unshift([50 - w, y])
    }
    for (var v = 0.16; v < 0.85; v += 0.11) {
      var y0 = 86 - v * 80, y1 = 86 - (v + 0.1) * 80, w1 = shape(v + 0.1) * 0.9
      veins += ' M50 ' + y0.toFixed(1) + ' Q' + (50 + w1 * 0.5).toFixed(1) + ' ' + (y0 - 3).toFixed(1) + ' ' + (50 + w1).toFixed(1) + ' ' + y1.toFixed(1)
      veins += ' M50 ' + y0.toFixed(1) + ' Q' + (50 - w1 * 0.5).toFixed(1) + ' ' + (y0 - 3).toFixed(1) + ' ' + (50 - w1).toFixed(1) + ' ' + y1.toFixed(1)
    }
    return { outline: polygon([[50, 86]].concat(right, left)), veins: veins }
  }
  var OAK = 'M50 86 C42 84 40 78 42 74 C34 76 30 70 34 64 C26 64 24 56 30 52 C22 50 22 42 30 40 C24 36 26 28 34 28 C32 20 40 16 44 20 C44 12 48 8 50 6 C52 8 56 12 56 20 C60 16 68 20 66 28 C74 28 76 36 70 40 C78 42 78 50 70 52 C76 56 74 64 66 64 C70 70 66 76 58 74 C60 78 58 84 50 86 Z'
  var OAK_VEINS = 'M50 86 L50 8 M50 74 Q44 72 38 70 M50 74 Q56 72 62 70 M50 62 Q40 60 30 56 M50 62 Q60 60 70 56 M50 50 Q40 46 28 44 M50 50 Q60 46 72 44 M50 38 Q44 32 36 28 M50 38 Q56 32 64 28 M50 26 Q47 22 45 19 M50 26 Q53 22 55 19'
  function shape() {
    var kind = Math.random()
    if (kind < 0.45) return { outline: polygon(jitter(MAPLE, 1.6)), veins: MAPLE_VEINS }
    if (kind < 0.75) return { outline: OAK.replace(/\d+(\.\d+)?/g, function (n) { return (Number(n) + random(-1.2, 1.2)).toFixed(1) }), veins: OAK_VEINS }
    return beech()
  }

  // Herfstkleuren: [bij de nerf, naar de punt, rand/nerf]. Soms nog wat groen-geel bij de steel.
  var COLORS = [
    ['#f4a23a', '#c8361a', '#6e1608'],
    ['#f7c64a', '#e0661f', '#7a2c0a'],
    ['#ffd968', '#e3a12b', '#8a5a14'],
    ['#c9b54a', '#d9792a', '#6b3510'],
    ['#e86a2c', '#a51f12', '#4f0d05'],
    ['#d7a457', '#94582a', '#4a2a10'],
    ['#b9c25a', '#e7a83a', '#7a4a12']
  ]

  var count = 0
  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name)
    for (var key in attrs) node.setAttribute(key, attrs[key])
    if (parent) parent.appendChild(node)
    return node
  }

  // Eén helft (links of rechts) van één kant (voor of achter) van een blad.
  function face(leaf, colors, side, back) {
    var id = 'blad' + (++count)
    var svg = el('svg', { viewBox: '0 0 100 100', class: 'leaf__face' + (back ? ' leaf__face--back' : ''), 'aria-hidden': 'true' })
    var defs = el('defs', {}, svg)
    var skin = el('radialGradient', { id: id + 'v', cx: '50', cy: '84', r: '82', gradientUnits: 'userSpaceOnUse' }, defs)
    el('stop', { offset: '0', 'stop-color': colors[0] }, skin)
    el('stop', { offset: '0.75', 'stop-color': colors[1] }, skin)
    el('stop', { offset: '1', 'stop-color': colors[2] }, skin)
    var light = el('radialGradient', { id: id + 'l', cx: '0.3', cy: '0.25', r: '0.7' }, defs)
    el('stop', { offset: '0', 'stop-color': '#fff3d6', 'stop-opacity': back ? '0.08' : '0.2' }, light)
    el('stop', { offset: '1', 'stop-color': '#fff3d6', 'stop-opacity': '0' }, light)
    var clip = el('clipPath', { id: id + 'c' }, defs)
    el('path', { d: leaf.outline }, clip)
    var half = el('clipPath', { id: id + 'h' }, defs)
    el('rect', { x: side < 0 ? -10 : 49.6, y: -10, width: 60.4, height: 120 }, half)
    // Fijne korrel en grote verkleurde vlekken (bruin), plus zachte donkere randen.
    var grain = el('filter', { id: id + 'g', x: '0', y: '0', width: '1', height: '1' }, defs)
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: '2', seed: String(count) }, grain)
    el('feColorMatrix', { values: '0 0 0 0 0.25  0 0 0 0 0.1  0 0 0 0 0.02  1.6 0 0 0 -0.55' }, grain)
    var blotch = el('filter', { id: id + 'b', x: '0', y: '0', width: '1', height: '1' }, defs)
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.05', numOctaves: '3', seed: String(count * 7) }, blotch)
    el('feColorMatrix', { values: '0 0 0 0 0.32  0 0 0 0 0.14  0 0 0 0 0.03  3.2 0 0 0 -1.75' }, blotch)
    var soft = el('filter', { id: id + 's' }, defs)
    el('feGaussianBlur', { stdDeviation: '1.6' }, soft)

    // De achterkant is gespiegeld (hij zit achterstevoren), lichter en doffer.
    var g = el('g', back ? { transform: 'translate(100 0) scale(-1 1)' } : {}, svg)
    var part = el('g', { 'clip-path': 'url(#' + id + 'h)' }, g)
    el('path', { d: 'M50 82 Q52 92 47 99', fill: 'none', stroke: colors[2], 'stroke-width': '2.2', 'stroke-linecap': 'round' }, part)
    el('path', { d: leaf.outline, fill: 'url(#' + id + 'v)' }, part)
    var inside = el('g', { 'clip-path': 'url(#' + id + 'c)' }, part)
    if (back) el('rect', { width: 100, height: 100, fill: '#ead6ad', opacity: '0.32' }, inside)
    el('rect', { width: 100, height: 100, filter: 'url(#' + id + 'b)', opacity: '0.55' }, inside)
    el('rect', { width: 100, height: 100, filter: 'url(#' + id + 'g)', opacity: '0.5' }, inside)
    el('path', { d: leaf.outline, fill: 'none', stroke: colors[2], 'stroke-width': '5', opacity: '0.5', filter: 'url(#' + id + 's)' }, inside)
    // Nerven: licht op de voorkant (verkleuren als laatste), duidelijk en bol op de achterkant.
    el('path', { d: leaf.veins, fill: 'none', stroke: back ? '#f3e2bf' : '#ffe1a0', 'stroke-width': back ? '1.3' : '0.8', 'stroke-linecap': 'round', opacity: back ? '0.7' : '0.35' }, inside)
    el('path', { d: leaf.outline, fill: 'url(#' + id + 'l)' }, inside)
    el('path', { d: leaf.outline, fill: 'none', stroke: colors[2], 'stroke-width': '0.7', opacity: '0.8' }, part)
    return svg
  }

  var style = document.createElement('style')
  style.textContent =
    '.leaves{position:fixed;inset:0;overflow:hidden;pointer-events:none;perspective:800px}' +
    '.leaves--back{z-index:-1}.leaves--front{z-index:40}' +
    '.leaf{position:absolute;top:0;left:0;will-change:transform}' +
    '.leaf__body,.leaf__half{position:absolute;inset:0;transform-style:preserve-3d}' +
    '.leaf__body{will-change:transform}' +
    '.leaf__face{position:absolute;inset:0;width:100%;height:100%;overflow:visible;backface-visibility:hidden;-webkit-backface-visibility:hidden;will-change:filter}' +
    '.leaf__face--back{transform:rotateY(180deg)}' +
    '@media print{.leaves{display:none}}'
  document.head.appendChild(style)

  function layer(name) {
    var node = document.createElement('div')
    node.className = 'leaves leaves--' + name
    node.setAttribute('aria-hidden', 'true')
    document.body.appendChild(node)
    return node
  }
  var backLayer = layer('back')
  var frontLayer = layer('front')
  var leaves = []
  var vw = window.innerWidth
  var vh = window.innerHeight

  // depth: 0 = ver weg (klein, vaag, traag), 1 = vlakbij (groot, snel).
  function makeLeaf(parent, depth) {
    var leaf = shape()
    var colors = COLORS[Math.floor(Math.random() * COLORS.length)]
    var size = Math.round((small ? 24 : 30) + depth * (small ? 44 : 74) + random(0, 12))
    var node = document.createElement('div')
    node.className = 'leaf'
    node.style.width = node.style.height = size + 'px'
    var body = document.createElement('div')
    body.className = 'leaf__body'
    var fold = random(14, 30)
    var faces = []
    ;[-1, 1].forEach(function (side) {
      var half = document.createElement('div')
      half.className = 'leaf__half'
      // Vouw langs de middennerf: beide helften iets omhoog, als een open boek.
      half.style.transform = 'rotateY(' + (side * fold) + 'deg)'
      var front = face(leaf, colors, side, false)
      var back = face(leaf, colors, side, true)
      half.appendChild(front)
      half.appendChild(back)
      body.appendChild(half)
      faces.push({ side: side, els: [front, back], lit: -1 })
    })
    node.appendChild(body)
    // Ver weg: wat vaag en doorschijnend (luchtperspectief).
    if (depth < 0.35) {
      node.style.opacity = String(0.5 + depth * 1.2)
      node.style.filter = 'blur(' + (1.3 - depth * 2.5).toFixed(1) + 'px)'
    }
    parent.appendChild(node)

    var state = {
      node: node, body: body, faces: faces, size: size, depth: depth, fold: fold,
      parallax: 0.1 + depth * 0.55,
      wind: 30 + depth * 70
    }
    respawn(state, true)
    leaves.push(state)
  }

  // Nieuwe val: andere plek, snelheid, slinger en houding. Bij de start verspreid over het scherm.
  function respawn(l, anywhere) {
    l.x = random(-0.1, 1.1) * vw
    l.y = anywhere ? random(-l.size, vh) : -l.size * 2 - random(0, 200)
    l.vy = random(38, 62) + l.depth * 45
    l.phase = random(0, Math.PI * 2)
    l.omega = random(1.3, 2.3) - l.depth * 0.3
    l.swing = random(25, 60) + l.depth * 40
    l.lift = l.swing * random(0.2, 0.35)
    l.tilt = random(25, 45)
    l.pitch = random(25, 50)
    l.tumbler = Math.random() < 0.3
    l.spin = random(140, 320) * (Math.random() < 0.5 ? -1 : 1)
    l.ry = random(-40, 40)
    l.turn = random(-40, 40)
  }

  // Licht van linksboven-voor. Normaal van een helft na de 3D-draaiing, als benadering.
  var LIGHT = [-0.35, -0.6, 0.72]
  function shade(l, rx, ry, rz) {
    var cx = Math.cos(rx * DEG), sx = Math.sin(rx * DEG), cz = Math.cos(rz * DEG), sz = Math.sin(rz * DEG)
    l.faces.forEach(function (f) {
      var a = (ry + f.side * -l.fold) * DEG
      var nx = Math.sin(a), ny = -Math.cos(a) * sx, nz = Math.cos(a) * cx
      var x = nx * cz - ny * sz, y = nx * sz + ny * cz
      var facing = nz >= 0 ? 1 : -1
      var d = (x * LIGHT[0] + y * LIGHT[1] + nz * LIGHT[2]) * facing
      var lit = Math.round((0.55 + Math.max(0, d) * 0.6 + (d > 0.92 ? 0.12 : 0)) * 50) / 50
      if (lit === f.lit) return
      f.lit = lit
      f.els[0].style.filter = f.els[1].style.filter = 'brightness(' + lit + ')'
    })
  }

  // Windvlagen: een gedeelde waarde die GSAP steeds naar een nieuwe richting en kracht laat lopen.
  var wind = { value: 0.3 }
  function gust() {
    var strong = Math.random() < 0.25
    gsap.to(wind, { value: random(-0.5, 1) * (strong ? 2.2 : 1), duration: strong ? random(1.5, 2.5) : random(3, 6), ease: 'sine.inOut', onComplete: gust })
  }
  gust()

  function tick(time, deltaMs) {
    var dt = Math.min(deltaMs, 50) / 1000
    for (var i = 0; i < leaves.length; i++) {
      var l = leaves[i]
      l.phase += l.omega * dt
      l.y += l.vy * dt
      l.x += wind.value * l.wind * dt
      var s = Math.sin(l.phase), c = Math.cos(l.phase)
      // Slinger: zijwaarts heen en weer, aan de uiteinden even optillen en kantelen.
      var px = l.x + l.swing * s
      var py = l.y - l.lift * s * s
      var rz, rx, ry
      if (l.tumbler) {
        l.ry += l.spin * dt
        ry = l.ry
        rx = 25 * Math.sin(l.phase * 0.8)
        rz = 15 * s + wind.value * 8
      } else {
        rz = l.tilt * s + wind.value * 12
        rx = l.pitch * c + 8 * Math.sin(l.phase * 3.3)
        ry = l.turn + 30 * Math.sin(l.phase * 0.45)
      }
      l.node.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)'
      l.body.style.transform = 'rotateZ(' + rz.toFixed(1) + 'deg) rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg)'
      shade(l, rx, ry, rz)
      if (py > vh + l.size * 2) respawn(l, false)
      else if (px < -l.size * 3 - l.swing) l.x += vw + l.size * 4
      else if (px > vw + l.size * 3 + l.swing) l.x -= vw + l.size * 4
    }
  }

  var backCount = small ? 6 : 11
  var frontCount = small ? 2 : 4
  for (var i = 0; i < backCount; i++) makeLeaf(backLayer, Math.random() * 0.45)
  for (var j = 0; j < frontCount; j++) makeLeaf(frontLayer, 0.65 + Math.random() * 0.35)
  gsap.ticker.add(tick)

  // Scrollen: de bladeren bewegen deels mee, de voorste het meest (diepte).
  var lastScroll = window.scrollY
  window.addEventListener('scroll', function () {
    var delta = window.scrollY - lastScroll
    lastScroll = window.scrollY
    for (var i = 0; i < leaves.length; i++) leaves[i].y -= delta * leaves[i].parallax
  }, { passive: true })
  window.addEventListener('resize', function () { vw = window.innerWidth; vh = window.innerHeight })

  gsap.from([backLayer, frontLayer], { autoAlpha: 0, duration: 2.5, ease: 'power1.out' })
})()
