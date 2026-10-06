// Achtergrondeffecten als shader op een <canvas data-effect="…">; nu alleen "stoom" (boven aan
// elke pagina, zie Layout.wald). Met WebGPU, anders WebGL2, anders niets (de gewone achtergrond blijft).
// Puur decoratief (zet aria-hidden op de canvas): niet bij "minder beweging", alleen renderen als
// de canvas in beeld en het tabblad zichtbaar is, op halve resolutie (max. 1× pixeldichtheid).
// Geladen door motion.js, alleen op pagina's met zo'n canvas. De canvas krijgt .is-on zodra hij
// tekent (gebruik dat om hem in te laten faden).
;(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // ── Shaders ─────────────────────────────────────────────────────────────────────────────
  // Elk effect is een functie effect(uv, t, aspect) → kleur met alpha (premultiplied), in WGSL en
  // GLSL. uv loopt van (0,0) linksonder tot (1,1) rechtsboven.
  var WGSL_PRELUDE = [
    'struct U { time: f32, aspect: f32 }',
    '@group(0) @binding(0) var<uniform> u: U;',
    'struct VO { @builtin(position) pos: vec4f, @location(0) uv: vec2f }',
    '@vertex fn vs(@builtin(vertex_index) i: u32) -> VO {',
    '  var p = array<vec2f, 3>(vec2f(-1.0, -3.0), vec2f(-1.0, 1.0), vec2f(3.0, 1.0));',
    '  var o: VO; o.pos = vec4f(p[i], 0.0, 1.0); o.uv = p[i] * 0.5 + 0.5; return o;',
    '}',
    'fn h(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453); }',
    'fn n(p: vec2f) -> f32 { let i = floor(p); let f = fract(p); let s = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h(i), h(i + vec2f(1.0, 0.0)), s.x), mix(h(i + vec2f(0.0, 1.0)), h(i + vec2f(1.0, 1.0)), s.x), s.y); }',
    'fn fbm(p0: vec2f) -> f32 { var p = p0; var v = 0.0; var a = 0.5;',
    '  for (var k = 0; k < 5; k++) { v += a * n(p); p = p * 2.03 + vec2f(1.7, 9.2); a *= 0.5; } return v; }',
    '@fragment fn fs(in: VO) -> @location(0) vec4f { return effect(in.uv, u.time, u.aspect); }'
  ].join('\n')

  var GLSL_PRELUDE = [
    '#version 300 es',
    'precision mediump float;',
    'uniform float u_time; uniform float u_aspect; in vec2 uv; out vec4 color;',
    'float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float n(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); vec2 s = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), s.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), s.x), s.y); }',
    'float fbm(vec2 p) { float v = 0.0; float a = 0.5;',
    '  for (int k = 0; k < 5; k++) { v += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }'
  ].join('\n')
  var GLSL_MAIN = 'void main() { color = effect(uv, u_time, u_aspect); }'
  var GLSL_VERTEX = '#version 300 es\nout vec2 uv;\nvoid main() { vec2 p = vec2(gl_VertexID == 2 ? 3.0 : -1.0, gl_VertexID == 0 ? -3.0 : 1.0); uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }'

  var EFFECTS = {
    // Stoom boven de pan: opstijgende, kronkelende ruis (domein vervormd door een tweede
    // ruislaag), het dichtst onderin het midden, uitwaaierend en vervagend naar boven.
    stoom: {
      wgsl: [
        'fn effect(uv: vec2f, time: f32, aspect: f32) -> vec4f {',
        '  let t = time * 0.07;',
        '  let p = vec2f(uv.x * aspect, uv.y) * 2.4;',
        '  let warp = vec2f(fbm(p + vec2f(0.0, -t * 3.0)), fbm(p + vec2f(5.2, -t * 2.2)));',
        '  let d = fbm(p * 1.3 + warp * 2.0 + vec2f(t * 0.6, -t * 4.5));',
        '  let column = 1.0 - smoothstep(0.1, 1.05, abs(uv.x - 0.5) * 2.0 + uv.y * 0.3);',
        '  let fade = (1.0 - smoothstep(0.35, 1.0, uv.y)) * smoothstep(0.0, 0.25, uv.y);',
        '  let a = smoothstep(0.38, 0.82, d) * column * fade * 0.55;',
        '  return vec4f(vec3f(0.99, 0.94, 0.86) * a, a);',
        '}'
      ].join('\n'),
      glsl: [
        'vec4 effect(vec2 uv, float time, float aspect) {',
        '  float t = time * 0.07;',
        '  vec2 p = vec2(uv.x * aspect, uv.y) * 2.4;',
        '  vec2 warp = vec2(fbm(p + vec2(0.0, -t * 3.0)), fbm(p + vec2(5.2, -t * 2.2)));',
        '  float d = fbm(p * 1.3 + warp * 2.0 + vec2(t * 0.6, -t * 4.5));',
        '  float column = 1.0 - smoothstep(0.1, 1.05, abs(uv.x - 0.5) * 2.0 + uv.y * 0.3);',
        '  float fade = (1.0 - smoothstep(0.35, 1.0, uv.y)) * smoothstep(0.0, 0.25, uv.y);',
        '  float a = smoothstep(0.38, 0.82, d) * column * fade * 0.55;',
        '  return vec4(vec3(0.99, 0.94, 0.86) * a, a);',
        '}'
      ].join('\n')
    }
  }

  // ── Renderen ────────────────────────────────────────────────────────────────────────────
  function run(canvas, render) {
    function resize() {
      var scale = Math.min(window.devicePixelRatio || 1, 1) * 0.5
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale))
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale))
    }
    resize()
    new ResizeObserver(resize).observe(canvas)
    var visible = true
    var frame = 0
    var start = performance.now()
    function draw(now) {
      frame = 0
      if (!visible || document.hidden) return
      render((now - start) / 1000, canvas.width / canvas.height)
      frame = requestAnimationFrame(draw)
    }
    function wake() { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw) }
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; wake() }).observe(canvas)
    document.addEventListener('visibilitychange', wake)
    canvas.classList.add('is-on')
    wake()
  }

  async function webgpu(canvas, effect) {
    var adapter = await navigator.gpu.requestAdapter({ powerPreference: 'low-power' })
    if (!adapter) return false
    var device = await adapter.requestDevice()
    var context = canvas.getContext('webgpu')
    if (!context) return false
    var format = navigator.gpu.getPreferredCanvasFormat()
    context.configure({ device: device, format: format, alphaMode: 'premultiplied' })
    // Effect vóór de prelude: de fragment-shader in de prelude roept effect() aan.
    var module = device.createShaderModule({ code: effect.wgsl + '\n' + WGSL_PRELUDE })
    var info = await module.getCompilationInfo()
    if (info.messages.some(function (m) { return m.type === 'error' })) return false
    var blend = { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' }
    var pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: module, entryPoint: 'vs' },
      fragment: { module: module, entryPoint: 'fs', targets: [{ format: format, blend: { color: blend, alpha: blend } }] }
    })
    var uniforms = device.createBuffer({ size: 8, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
    var bindGroup = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: uniforms } }] })
    run(canvas, function (time, aspect) {
      device.queue.writeBuffer(uniforms, 0, new Float32Array([time, aspect]))
      var encoder = device.createCommandEncoder()
      var pass = encoder.beginRenderPass({ colorAttachments: [{
        view: context.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 0 }
      }] })
      pass.setPipeline(pipeline)
      pass.setBindGroup(0, bindGroup)
      pass.draw(3)
      pass.end()
      device.queue.submit([encoder.finish()])
    })
    return true
  }

  function webgl(canvas, effect) {
    var gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' })
    if (!gl) return false
    function shader(type, source) {
      var sh = gl.createShader(type)
      gl.shaderSource(sh, source)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh))
      return sh
    }
    var program = gl.createProgram()
    gl.attachShader(program, shader(gl.VERTEX_SHADER, GLSL_VERTEX))
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, [GLSL_PRELUDE, effect.glsl, GLSL_MAIN].join('\n')))
    gl.linkProgram(program)
    gl.useProgram(program)
    var uTime = gl.getUniformLocation(program, 'u_time')
    var uAspect = gl.getUniformLocation(program, 'u_aspect')
    run(canvas, function (time, aspect) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(uTime, time)
      gl.uniform1f(uAspect, aspect)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    })
    return true
  }

  document.querySelectorAll('canvas[data-effect]').forEach(function (canvas) {
    var effect = EFFECTS[canvas.dataset.effect]
    if (!effect) return
    // Eerst WebGPU; lukt dat niet (geen ondersteuning, geen adapter, fout), dan WebGL2.
    ;(navigator.gpu ? webgpu(canvas, effect) : Promise.resolve(false))
      .catch(function () { return false })
      .then(function (ok) { if (!ok) { try { webgl(canvas, effect) } catch (e) { /* gewone achtergrond */ } } })
  })
})()
