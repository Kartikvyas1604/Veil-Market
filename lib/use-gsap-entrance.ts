"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface EntranceOptions {
  stagger?: number;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
}

export function useGsapEntrance<T extends HTMLElement>(
  options: EntranceOptions = {}
) {
  const ref = useRef<T>(null);
  const { stagger = 0.08, from, to } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const children = Array.from(el.children).filter(
      (c) => c instanceof HTMLElement
    );

    if (children.length > 0) {
      gsap.fromTo(
        children,
        { opacity: 0, y: 16, ...from },
        {
          opacity: 1,
          y: 0,
          stagger,
          duration: 0.7,
          ease: "power2.out",
          ...to,
        }
      );
    } else {
      gsap.fromTo(
        el,
        { opacity: 0, y: 16, ...from },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", ...to }
      );
    }
  }, [from, stagger, to]);

  return ref;
}
