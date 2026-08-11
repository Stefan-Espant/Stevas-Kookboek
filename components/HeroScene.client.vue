<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type * as THREE from 'three'

const canvasRef = ref<HTMLCanvasElement | null>(null)

// Everything below is populated only on the client, only when motion is allowed.
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let animationFrameId: number | null = null
let isUnmounted = false

interface FallingShape {
  mesh: THREE.Mesh
  fallSpeed: number
  rotationSpeed: { x: number; y: number; z: number }
  topBound: number
  bottomBound: number
}

const shapes: FallingShape[] = []

// Warm, food-appropriate palette that stays harmonious with the brand colours
// (petrol #125668, coral #ef6a70, orange-coral #ff775c) plus a few extra
// food-plausible hues (yellow, green, brown, cream).
const PALETTE = [
  0xef6a70, // coral (tomato/apple)
  0xff775c, // orange-coral (orange/carrot)
  0x125668, // petrol (accent, e.g. unripe fruit)
  0xf4b942, // warm yellow (banana/bread crust)
  0x8a9b4f, // olive green (herbs/vegetable)
  0xa9652e, // brown (bread crust/meat)
  0xf3e1c4, // cream (rice/bread crumb)
  0xd94f4f  // deeper red (berries/meat)
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function createShapeMesh(three: typeof THREE): THREE.Mesh {
  const kind = Math.random()
  let geometry: THREE.BufferGeometry

  if (kind < 0.35) {
    // Fruit / vegetable: sphere
    const radius = randomBetween(0.35, 0.7)
    geometry = new three.SphereGeometry(radius, 16, 12)
  } else if (kind < 0.55) {
    // Bread loaf: elongated capsule
    const radius = randomBetween(0.25, 0.4)
    const height = randomBetween(0.5, 0.9)
    geometry = new three.CapsuleGeometry(radius, height, 4, 8)
  } else if (kind < 0.75) {
    // Meat chunk: irregular icosahedron
    const radius = randomBetween(0.35, 0.65)
    geometry = new three.IcosahedronGeometry(radius, 0)
  } else {
    // Rice grain: small sphere, higher quantity feel via small scale
    const radius = randomBetween(0.08, 0.16)
    geometry = new three.SphereGeometry(radius, 8, 6)
  }

  const material = new three.MeshStandardMaterial({
    color: pick(PALETTE),
    roughness: randomBetween(0.6, 0.9),
    metalness: 0.05
  })

  return new three.Mesh(geometry, material)
}

function layoutBounds() {
  // Roughly match the visible viewport at the camera's working distance.
  return { top: 8, bottom: -8, left: -8, right: 8 }
}

async function setupScene() {
  const canvas = canvasRef.value
  if (!canvas) return

  const three = await import('three')

  // The component may have unmounted while the dynamic import was in
  // flight (e.g. fast navigation on a slow connection). Bail out so we
  // never create a renderer/rAF loop that teardownScene() has no way to
  // reach anymore.
  if (isUnmounted || !canvasRef.value) return

  const width = canvas.clientWidth || window.innerWidth
  const height = canvas.clientHeight || window.innerHeight

  scene = new three.Scene()

  camera = new three.PerspectiveCamera(50, width / height, 0.1, 100)
  camera.position.set(0, 0, 12)

  try {
    renderer = new three.WebGLRenderer({ canvas, alpha: true, antialias: true })
  } catch {
    // Genuinely no WebGL support (not the reduced-motion case, which never
    // gets here). Fail silently: the canvas stays empty and the CSS
    // gradient on .home-hero remains the visible result.
    scene = null
    camera = null
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height, false)

  const ambientLight = new three.AmbientLight(0xffffff, 0.7)
  const directionalLight = new three.DirectionalLight(0xffffff, 1.1)
  directionalLight.position.set(4, 6, 8)
  scene.add(ambientLight, directionalLight)

  const bounds = layoutBounds()
  const shapeCount = 23

  for (let i = 0; i < shapeCount; i++) {
    const mesh = createShapeMesh(three)
    mesh.position.set(
      randomBetween(bounds.left, bounds.right),
      randomBetween(bounds.bottom, bounds.top),
      randomBetween(-4, 2)
    )
    mesh.rotation.set(
      randomBetween(0, Math.PI * 2),
      randomBetween(0, Math.PI * 2),
      randomBetween(0, Math.PI * 2)
    )
    scene.add(mesh)

    shapes.push({
      mesh,
      fallSpeed: randomBetween(0.015, 0.045),
      rotationSpeed: {
        x: randomBetween(-0.01, 0.01),
        y: randomBetween(-0.01, 0.01),
        z: randomBetween(-0.01, 0.01)
      },
      topBound: bounds.top,
      bottomBound: bounds.bottom
    })
  }

  const tick = () => {
    for (const shape of shapes) {
      shape.mesh.position.y -= shape.fallSpeed
      shape.mesh.rotation.x += shape.rotationSpeed.x
      shape.mesh.rotation.y += shape.rotationSpeed.y
      shape.mesh.rotation.z += shape.rotationSpeed.z

      if (shape.mesh.position.y < shape.bottomBound) {
        shape.mesh.position.y = shape.topBound
        shape.mesh.position.x = randomBetween(bounds.left, bounds.right)
      }
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
    animationFrameId = requestAnimationFrame(tick)
  }

  animationFrameId = requestAnimationFrame(tick)

  window.addEventListener('resize', handleResize)
}

function handleResize() {
  const canvas = canvasRef.value
  if (!canvas || !renderer || !camera) return

  const width = canvas.clientWidth || window.innerWidth
  const height = canvas.clientHeight || window.innerHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
}

function teardownScene() {
  isUnmounted = true
  window.removeEventListener('resize', handleResize)

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  for (const shape of shapes) {
    shape.mesh.geometry.dispose()
    const material = shape.mesh.material
    if (Array.isArray(material)) {
      material.forEach(m => m.dispose())
    } else {
      material.dispose()
    }
  }
  shapes.length = 0

  renderer?.dispose()
  renderer = null
  scene = null
  camera = null
}

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    // Do nothing at all: canvas stays empty/transparent and the CSS gradient
    // on the parent .home-hero section shows through as the fallback.
    return
  }

  void setupScene()
})

onBeforeUnmount(() => {
  teardownScene()
})
</script>

<template>
  <canvas ref="canvasRef" class="hero-scene" aria-hidden="true" />
</template>

<style scoped>
.hero-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
