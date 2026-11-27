"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Anime la portion numérique d'une valeur (0 → cible) au montage.
 * Préserve le préfixe (+, $) et le suffixe (R, %, …) et le nombre de décimales.
 * Valeurs non numériques (ex : "∞") affichées telles quelles.
 * Respecte prefers-reduced-motion.
 */
export function CountUp({ value, duration = 850, delay = 0, className }: { value: string; duration?: number; delay?: number; className?: string }) {
  const match = value.match(/^([^\d-]*)(-?\d[\d.]*)(.*)$/s);
  const [display, setDisplay] = useState<string>(() => (match ? `${match[1]}0${match[3]}` : value));
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!match) { setDisplay(value); return; }
    const pre = match[1], post = match[3];
    const target = parseFloat(match[2]);
    const decimals = (match[2].split(".")[1] ?? "").length;

    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !Number.isFinite(target)) { setDisplay(value); return; }

    let start: number | null = null;
    const startDelay = delay;

    function tick(now: number) {
      if (start === null) start = now + startDelay;
      const elapsed = now - start;
      if (elapsed < 0) { raf.current = requestAnimationFrame(tick); return; }
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      const current = target * eased;
      setDisplay(`${pre}${current.toFixed(decimals)}${post}`);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setDisplay(value);
    }
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration, delay]); // eslint-disable-line react-hooks/exhaustive-deps

  return <span className={className}>{display}</span>;
}
