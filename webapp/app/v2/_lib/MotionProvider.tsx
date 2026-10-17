'use client';

import { LazyMotion } from 'motion/react';

const loadFeatures = () => import('./motionFeatures').then((mod) => mod.default);

/**
 * Components animate with the light `m` from 'motion/react-m'; the animation engine arrives in its own chunk
 * instead of in each page's critical bundle. Wrap only the surfaces that animate (site page, map, inspection,
 * lightbox): pages without motion, like the Sites list, then load none of it.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}
