import gsap from 'gsap'

let initialized = false

export function initGsap(): void {
  if (initialized) return
  gsap.defaults({ ease: 'power3.out', duration: 0.6 })
  initialized = true
}

/** Cinematic wallet balance reveal — scale + glow pulse on mount. */
export function animateBalanceReveal(element: HTMLElement): gsap.core.Timeline {
  const timeline = gsap.timeline()
  timeline
    .from(element, {
      opacity: 0,
      y: 28,
      scale: 0.88,
      duration: 0.9,
      ease: 'power4.out',
    })
    .to(
      element,
      {
        textShadow: '0 0 24px color-mix(in srgb, var(--color-primary) 60%, transparent)',
        duration: 0.4,
        ease: 'power2.out',
      },
      '-=0.3',
    )
    .to(element, {
      textShadow: '0 0 0px transparent',
      duration: 0.6,
      ease: 'power2.inOut',
    })
  return timeline
}

/** Subtle page-enter stagger for child elements. */
export function animatePageEnter(container: HTMLElement): gsap.core.Tween | gsap.core.Timeline {
  const children = container.querySelectorAll('[data-animate-enter]')
  if (children.length === 0) return gsap.timeline()

  return gsap.from(children, {
    opacity: 0,
    y: 16,
    stagger: 0.08,
    duration: 0.55,
    ease: 'power3.out',
  })
}

export { gsap }
