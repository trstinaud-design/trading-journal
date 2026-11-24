"use client";
import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxImage = { url: string; kind?: string; label?: string };

/**
 * Visionneuse plein écran (lightbox). Flèches clavier ← → et Échap.
 * `index` = image affichée ; `onIndex` pour naviguer ; `onClose` pour fermer.
 */
export function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: LightboxImage[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const prev = useCallback(() => onIndex((index - 1 + images.length) % images.length), [index, images.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % images.length), [index, images.length, onIndex]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [prev, next, onClose]);

  const img = images[index];
  if (!img) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Fermer">
        <X className="h-5 w-5" />
      </button>

      {images.length > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Précédent">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Suivant">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="flex max-h-[90vh] max-w-[92vw] flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.url} alt={img.label ?? img.kind ?? ""} className="max-h-[82vh] max-w-full rounded-lg object-contain shadow-2xl" />
        <div className="flex items-center gap-3 text-sm text-white/80">
          {img.label && <span className="font-medium">{img.label}</span>}
          {img.kind && <span className="rounded bg-white/10 px-2 py-0.5 text-xs uppercase">{img.kind}</span>}
          {images.length > 1 && <span className="text-white/50">{index + 1} / {images.length}</span>}
        </div>
      </div>
    </div>
  );
}
