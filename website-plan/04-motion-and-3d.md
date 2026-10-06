# Phase 4 — Motion

[Global tracker](main.md) · **Status: Superseded — rebuilt without libraries** · **Estimate: 8 points** · **Dependencies: phase 3**

> **2026-10-07.** GSAP, Three.js and `canvas-confetti` were removed from the website. The tasks below record the original library-based plan and remain as dated history; the motion principles still apply. What ships now is CSS: keyframes and scroll-driven timelines in `src/app/globals.css`, a ~400-byte inline `IntersectionObserver` for section reveals (`revealScript` in `src/lib/inline-scripts.ts`), a CSS glass hero lens (`.lens-glass`) in place of the WebGL scene, an intersection-driven demo walk instead of the pinned scrub, and `SparkBurst.tsx` in place of the confetti canvas. The current rules live in `apps/website/AGENTS.md` and `apps/website/design-system/MASTER.md`.

## User story

As a visitor, I want the page to feel alive and to *show* how the lens works as I scroll, without slowing the page or making me motion-sick.

## Motion principles (from the design system)

- Motion explains the product (focus, highlight, replace). Nothing loops without a reason.
- Animate only `transform`, `opacity`, `clip-path`, and `filter` (with care). No layout-triggering properties.
- Durations and easings come from tokens. Stagger ≤ 60 ms per item. Scroll effects are scrubbed or triggered once, never scroll-jacked.
- `prefers-reduced-motion: reduce` → no pinning, no parallax, no SplitText, and no 3D. Show the final states instantly, or with a ≤150 ms opacity fade.
- The page must be fully readable before JavaScript loads. Animations only run from visible states (`gsap.from` with `immediateRender` guarded by a `.js-motion` class set on `<html>`, so no-JavaScript users never see hidden content).

## Tasks

### GSAP setup

- [ ] `src/components/motion/gsap.ts`: a client module that registers `ScrollTrigger`, `SplitText`, and `useGSAP` once and exports the configured `gsap`. Import it only from client components.
- [ ] `useReducedMotion` hook, and `gsap.matchMedia()` contexts for `(prefers-reduced-motion: no-preference)` and breakpoint-specific timelines.
- [ ] Put all timelines inside `useGSAP` with a `scope` ref so they are reverted on unmount and route change. Refresh ScrollTrigger after fonts load (`document.fonts.ready`) and after images load.
- [ ] RTL: mirror horizontal `x` offsets by `dir` (a helper `dirX(n)`). Check pinned sections in Arabic.

### Choreography

- [ ] **Hero intro:** SplitText by words (not characters, which reads better in Arabic; check that Arabic letters stay joined, and fall back to line-level splitting for `ar`) with a staggered rise. CTA and chips fade after it. Total ≤ 1.2 s, and it never delays LCP.
- [ ] **Header:** becomes compact and gains a shadow after a scroll threshold (a ScrollTrigger toggle class).
- [ ] **Section reveals:** a batched `ScrollTrigger.batch` fade-up for cards and headings, once only.
- [ ] **Features bento:** subtle hover tilt and spotlight on pointer devices only (`(hover: hover)`), with no effect on touch.
- [ ] **Signature demo (pinned scrollytelling, desktop and tablet only):** pin `#demo` for about 150–200% of viewport height and scrub a timeline. (1) The lens slides over the passage. (2) Character names light up in their category colors one by one. (3) A replacement visibly morphs ("Lord Xiao Yan" style → the corrected name; the text is original). (4) The tooltip pops beside one name. (5) The panel settles. On mobile or with reduced motion, fall back to the phase 3 toggle version. Keep the `aria-live` announcements consistent with the visual state.
- [ ] **How it works:** a step connector line draws with `scaleX`/`scaleY` scrub.
- [ ] **Companion:** a small sequence of browser → local app → provider → summary panel appearing, which reinforces "local".
- [ ] **Final CTA:** a gentle background gradient drift, paused when offscreen.

### Three.js hero lens (small, optional, lazy)

- [ ] `src/components/three/LensScene.tsx` (client), loaded through `next/dynamic(..., { ssr: false })`, **only if** all of these are true: WebGL2 is available, reduced motion is off, viewport ≥ 1024 px, `navigator.hardwareConcurrency ≥ 4`, not `saveData`, and the hero is in the viewport (IntersectionObserver). Otherwise keep the static poster (`LensFallback`, the same composition rendered as an optimized image).
- [ ] Scene: a stylized book page plane with a text texture (a canvas texture of the demo passage, or a prerendered image), plus a glass lens using drei `MeshTransmissionMaterial` (low samples and resolution). The lens follows the pointer with damping, and highlighted names appear sharper and colored through the lens. Soft environment lighting uses a small local HDR or `Lightformer`s (no remote HDR fetch).
- [ ] Performance guards: `dpr={[1, 1.75]}`, `frameloop="demand"` or pausing when offscreen or the tab is hidden, drei `PerformanceMonitor` to degrade quality (fewer samples, then a static fallback), `AdaptiveDpr`. Dispose textures and geometries on unmount.
- [ ] Crossfade from poster to canvas only after the first rendered frame, so there is no blank flash. The poster stays the LCP element.
- [ ] Budget: the 3D chunk is ≤ 180 KB gzip, loaded after `load`/idle, and the main-thread cost of the first frame is < 50 ms on a mid-range laptop.
- [ ] Accessibility: the canvas is `aria-hidden="true"` and decorative. All meaning is also in text.

## Acceptance criteria

- [ ] With reduced motion on: no pinned sections, no 3D chunk requested (checked in the network log), and all content is visible.
- [ ] Mobile Lighthouse performance stays ≥ 90 with motion enabled, CLS < 0.05, and INP < 200 ms during scroll.
- [ ] No ScrollTrigger misalignment after locale or theme switches, resize, or font load. Pinned demo tested in `en` and `ar`.
- [ ] No console errors or leaked WebGL contexts after navigating between landing and legal pages 10 times.
- [ ] Profiled on a throttled CPU (4×): scroll stays at about 60 fps on desktop, with no long tasks > 100 ms caused by animation.

## Validation record

2026-09-27: Lazy GSAP useGSAP/ScrollTrigger/SplitText, reveals, header scroll state, desktop pinned staged demo, and desktop-only WebGL lens implemented. Reduced-motion tests pass with no canvas. Renderer chunk ~244KB gzip before ancillary code exceeds the 180KB stretch budget. Continuous 60fps profiling, 10-navigation WebGL leak audit and full scene refinement are not marked complete.

2026-10-07: The library-based implementation above was replaced with hand-written CSS motion. `gsap`, `@gsap/react`, `three`, `@react-three/fiber`, `@react-three/drei` and `canvas-confetti` are no longer dependencies, and `AGENTS.md` forbids adding an animation library. Scroll pinning is gone, so the "no scroll-jacking" and "no leaked WebGL contexts" risks no longer apply. Re-measure the performance acceptance criteria against the new export; the figures recorded above are historical.

Detailed evidence: `apps/website/design-system/validation/README.md`. Checkboxes remain unticked unless every listed condition was verified; implemented core behavior is recorded above.
