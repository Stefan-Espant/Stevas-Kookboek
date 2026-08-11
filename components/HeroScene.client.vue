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
  // A Group so multi-mesh pieces (fruit body + stem) fall/rotate/dispose as
  // one unit. Single-mesh pieces (bread, meat, rice) are still wrapped in a
  // Group of one child, purely for structural consistency with the fruit
  // case — it keeps the animation and disposal code uniform for every kind.
  object: THREE.Group
  fallSpeed: number
  rotationSpeed: { x: number; y: number; z: number }
  topBound: number
  bottomBound: number
}

const shapes: FallingShape[] = []

// Per-food-type palettes. Kept separate (rather than one shared palette)
// so bread reads as bread (tan/golden-brown), meat as meat (reddish-brown),
// rice as rice (white/cream), while fruit/veg still spans the wider,
// brand-harmonious range (petrol #125668, coral #ef6a70, orange-coral #ff775c
// plus yellow/green/red).
const FRUIT_COLORS = [0xef6a70, 0xff775c, 0x125668, 0xf4b942, 0x8a9b4f, 0xd94f4f]
const BREAD_COLORS = [0xd7a25c, 0xc98a3f, 0xa9652e, 0xe0b96a]
const MEAT_COLORS = [0xa9652e, 0x8b3a3a, 0x7a3b2e, 0xb5533f]
const RICE_COLORS = [0xf3e1c4, 0xfaf6ec, 0xf7f0e3]
const STEM_COLORS = [0x4a3520, 0x5a6b3a]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function standardMaterial(three: typeof THREE, color: number, roughnessRange: [number, number], metalness = 0.05) {
  return new three.MeshStandardMaterial({
    color,
    roughness: randomBetween(roughnessRange[0], roughnessRange[1]),
    metalness
  })
}

function createFoodPiece(three: typeof THREE): THREE.Group {
  const kind = Math.random()
  const group = new three.Group()

  if (kind < 0.35) {
    // Fruit / vegetable: sphere body, slightly squashed (not a perfect
    // ball) + a small stem on top so it reads as produce, not candy.
    const radius = randomBetween(0.35, 0.7)
    const squashY = 0.82 + Math.random() * 0.16

    const body = new three.Mesh(
      new three.SphereGeometry(radius, 16, 12),
      standardMaterial(three, pick(FRUIT_COLORS), [0.6, 0.9])
    )
    body.scale.set(1, squashY, 1)
    group.add(body)

    const stemRadius = randomBetween(0.05, 0.08)
    const stemHeight = randomBetween(0.15, 0.2)
    const stem = new three.Mesh(
      new three.CylinderGeometry(stemRadius, stemRadius, stemHeight, 6),
      standardMaterial(three, pick(STEM_COLORS), [0.7, 0.9], 0.02)
    )
    stem.position.y = radius * squashY + stemHeight / 2
    group.add(stem)
  } else if (kind < 0.55) {
    // Bread roll: a dome/cap cut from a sphere (thetaLength < PI) so it
    // reads as a rounded bun silhouette instead of a full ball or a pill.
    const radius = randomBetween(0.35, 0.55)
    const thetaLength = Math.PI * randomBetween(0.55, 0.7)
    const bread = new three.Mesh(
      new three.SphereGeometry(radius, 16, 12, 0, Math.PI * 2, 0, thetaLength),
      standardMaterial(three, pick(BREAD_COLORS), [0.7, 0.95], 0.02)
    )
    group.add(bread)
  } else if (kind < 0.75) {
    // Meat chunk: irregular icosahedron, flattened so it reads as a cut of
    // meat rather than a gem-like faceted ball.
    const radius = randomBetween(0.35, 0.65)
    const meat = new three.Mesh(
      new three.IcosahedronGeometry(radius, 0),
      standardMaterial(three, pick(MEAT_COLORS), [0.55, 0.8])
    )
    meat.scale.set(1, 0.55, 0.85)
    group.add(meat)
  } else {
    // Rice grain: small sphere stretched along one axis into a grain shape.
    const radius = randomBetween(0.08, 0.16)
    const rice = new three.Mesh(
      new three.SphereGeometry(radius, 8, 6),
      standardMaterial(three, pick(RICE_COLORS), [0.5, 0.7], 0.02)
    )
    rice.scale.set(1.8, 0.6, 0.6)
    group.add(rice)
  }

  return group
}

function disposeFoodPiece(object: THREE.Group) {
  // Walk every descendant (traverse visits the object itself plus all
  // children exactly once each) and dispose any mesh's geometry/material.
  // Groups/plain Object3D nodes have no geometry/material so the optional
  // chaining below is a no-op for them — nothing is skipped, nothing is
  // disposed twice.
  object.traverse((child) => {
    const maybeMesh = child as Partial<THREE.Mesh>
    maybeMesh.geometry?.dispose()
    const material = maybeMesh.material
    if (Array.isArray(material)) {
      material.forEach(m => m.dispose())
    } else {
      material?.dispose()
    }
  })
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
    const object = createFoodPiece(three)
    object.position.set(
      randomBetween(bounds.left, bounds.right),
      randomBetween(bounds.bottom, bounds.top),
      randomBetween(-4, 2)
    )
    object.rotation.set(
      randomBetween(0, Math.PI * 2),
      randomBetween(0, Math.PI * 2),
      randomBetween(0, Math.PI * 2)
    )
    scene.add(object)

    shapes.push({
      object,
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
      // Moving/rotating the Group as a whole keeps multi-mesh pieces (e.g.
      // fruit body + stem) rigidly attached to each other.
      shape.object.position.y -= shape.fallSpeed
      shape.object.rotation.x += shape.rotationSpeed.x
      shape.object.rotation.y += shape.rotationSpeed.y
      shape.object.rotation.z += shape.rotationSpeed.z

      if (shape.object.position.y < shape.bottomBound) {
        shape.object.position.y = shape.topBound
        shape.object.position.x = randomBetween(bounds.left, bounds.right)
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
    disposeFoodPiece(shape.object)
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
