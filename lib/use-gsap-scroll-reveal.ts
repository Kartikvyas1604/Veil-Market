"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealOptions {
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  trigger?: gsap.DOMTarget;
  start?: string;
  end?: string;
  stagger?: number;
  toggleActions?: string;
  markers?: boolean;
}

export function useGsapScrollReveal<T extends HTMLElement>(
  options: ScrollRevealOptions = {}
) {
  const ref = useRef<T>(null);
  const {
    from = { opacity: 0, y: 24 },
    to = { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
    start = "top 85%",
    end = "top 65%",
    stagger,
    toggleActions = "play none none reverse",
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = stagger
      ? Array.from(el.children).filter((c) => c instanceof HTMLElement)
      : el;

    const tl = gsap.fromTo(targets, from, {
      ...to,
      stagger,
      scrollTrigger: {
        trigger: el,
        start,
        end,
        toggleActions,
      },
    });

    return () => {
      tl.kill();
    };
  }, []);

  return ref;
}
