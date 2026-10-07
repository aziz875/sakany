export const MOTION = {
  duration: {
    fast: 150,
    base: 220,
    slow: 320,
    shimmer: 1500,
  },
  easing: {
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  stagger: {
    card: 70,
    gentle: 90,
  },
} as const;

