// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'

const maxFrame = 250
const maxMove = 2
const maxRotate = 0.5
const easing = 0.2
const hoverScale = 1.03
const pressScale = 0.97
const tolerance = 0.01
const springStiffness = 300
const springDampingRatio = 0.7
const springDamping = 2 * springDampingRatio * Math.sqrt(springStiffness)

interface TiltState {
  x: number
  y: number
  tx: number
  ty: number
  rx: number
  ry: number
  trx: number
  try_: number
  scale: number
  scaleVel: number
  lastT: number
  hovered: boolean
  pressed: boolean
}

const tiltStates = new WeakMap<HTMLElement, TiltState>()

function animateTilt(el: HTMLElement, now = performance.now()) {
  const state = tiltStates.get(el)
  if (!state) {
    tiltStates.delete(el)
    return
  }

  const dt = Math.min(0.033, Math.max(0, (now - state.lastT) / 1000))
  state.lastT = now

  const {
    x,
    y,
    tx,
    ty,
    rx,
    ry,
    trx,
    try_,
    scale,
    scaleVel,
    hovered,
    pressed
  } = state

  const targetScale = hovered ? (pressed ? pressScale : hoverScale) : 1

  if (
    !hovered &&
    !x &&
    !y &&
    !rx &&
    !ry &&
    Math.abs(scale - 1) < tolerance &&
    Math.abs(scaleVel) < tolerance
  ) {
    el.style.transform = ''
    tiltStates.delete(el)
    return
  }

  const nextX = Math.abs(tx - x) < tolerance ? tx : x + (tx - x) * easing
  const nextY = Math.abs(ty - y) < tolerance ? ty : y + (ty - y) * easing
  const nextRX = Math.abs(trx - rx) < tolerance ? trx : rx + (trx - rx) * easing
  const nextRY =
    Math.abs(try_ - ry) < tolerance ? try_ : ry + (try_ - ry) * easing

  const accel =
    (targetScale - scale) * springStiffness - scaleVel * springDamping
  const nextVel = scaleVel + accel * dt
  const nextScale = scale + nextVel * dt

  el.style.transform = `
    perspective(1000px)
    translate(${nextX}px, ${nextY}px)
    rotateX(${nextRX}deg)
    rotateY(${nextRY}deg)
    scale(${nextScale})
    translateZ(0)
  `
  el.style.transformStyle = 'preserve-3d'
  el.style.willChange = 'transform'

  state.x = nextX
  state.y = nextY
  state.rx = nextRX
  state.ry = nextRY
  state.scale = nextScale
  state.scaleVel = nextVel

  requestAnimationFrame(() => animateTilt(el))
}

let unbindTilt: (() => void) | undefined

const canHover =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches

function bindTilt() {
  unbindTilt?.()
  if (!canHover) return
  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('.VPButton')
  )
  const unbinders: Array<() => void> = []

  for (const el of targets) {
    let lastTime = 0

    const onEnter = () => {
      const state = tiltStates.get(el)
      el.style.zIndex = '9'
      if (state) {
        state.hovered = true
        state.pressed = false
      } else {
        tiltStates.set(el, {
          x: 0,
          y: 0,
          tx: 0,
          ty: 0,
          rx: 0,
          ry: 0,
          trx: 0,
          try_: 0,
          scale: 1,
          scaleVel: 0,
          lastT: performance.now(),
          hovered: true,
          pressed: false
        })
        animateTilt(el)
      }
    }

    const onMove = (e: MouseEvent) => {
      const time = performance.now()
      if (time - lastTime < 1000 / maxFrame) return
      lastTime = time

      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const state = tiltStates.get(el)
      if (!state) return

      state.tx = ((x - centerX) / centerX) * maxMove
      state.ty = ((y - centerY) / centerY) * maxMove
      state.try_ = ((x - centerX) / centerX) * maxRotate
      state.trx = -((y - centerY) / centerY) * maxRotate

      el.style.setProperty('--tilt-x', `${(x - centerX).toFixed(2)}px`)
      el.style.setProperty('--tilt-y', `${(y - centerY).toFixed(2)}px`)
    }

    const onLeave = () => {
      el.style.zIndex = ''
      const state = tiltStates.get(el)
      if (!state) return
      state.tx = 0
      state.ty = 0
      state.trx = 0
      state.try_ = 0
      state.hovered = false
      state.pressed = false
    }

    const onDown = () => {
      const state = tiltStates.get(el)
      if (state) state.pressed = true
    }

    const onUp = () => {
      const state = tiltStates.get(el)
      if (state) state.pressed = false
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    el.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)

    unbinders.push(() => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      el.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    })
  }
  unbindTilt = () => unbinders.forEach((fn) => fn())
}

let homeEnterPlayed = false

function playHomeEnter() {
  if (homeEnterPlayed) return
  homeEnterPlayed = true
  let tries = 0
  const tryPlay = () => {
    const home = document.querySelector<HTMLElement>('.VPHome')
    if (!home) {
      if (tries++ < 60) {
        requestAnimationFrame(tryPlay)
      } else {
        homeEnterPlayed = false
      }
      return
    }

    home.classList.add('home-enter')
    const done = () => home.classList.remove('home-enter')
    const onHomeEnd = (e: AnimationEvent) => {
      if (e.animationName !== 'home-fade-up') return
      home.removeEventListener('animationend', onHomeEnd)
      done()
    }
    home.addEventListener('animationend', onHomeEnd)
    window.setTimeout(done, 2500)

    const nav = document.querySelector<HTMLElement>('.VPNav')
    if (nav) {
      nav.classList.add('nav-enter')
      const navDone = () => nav.classList.remove('nav-enter')
      const onNavEnd = (e: AnimationEvent) => {
        if (e.animationName !== 'nav-fade-in') return
        nav.removeEventListener('animationend', onNavEnd)
        navDone()
      }
      nav.addEventListener('animationend', onNavEnd)
      window.setTimeout(navDone, 2500)
    }
  }
  requestAnimationFrame(tryPlay)
}

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ router }) {
    if (typeof window !== 'undefined') {
      router.onAfterRouteChange = (to) => {
        window.setTimeout(bindTilt, 0)
        if (to === '/' || to === '/index.html') playHomeEnter()
      }
      const path = window.location.pathname
      if (path === '/' || path === '/index.html') playHomeEnter()
    }
  }
} satisfies Theme
