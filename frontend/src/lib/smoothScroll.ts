import Lenis from "lenis";
import { useEffect } from "react";

let lenis: Lenis | null = null;

export function useLenis(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis = instance;
    let rafId = 0;
    const raf = (time: number) => {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      instance.destroy();
      if (lenis === instance) lenis = null;
    };
  }, [enabled]);
}

export function scrollToId(hash: string) {
  if (lenis) {
    lenis.scrollTo(hash, { offset: -76, duration: 1.4 });
  } else {
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  }
}
