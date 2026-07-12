import gsap from 'gsap'

let initialized = false

/** Wire GSAP defaults once; cinematic animations added in Phase 4. */
export function initGsap(): void {
  if (initialized) return
  gsap.defaults({ ease: 'power3.out', duration: 0.6 })
  initialized = true
}

export { gsap }
