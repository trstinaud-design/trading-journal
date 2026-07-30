"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { X, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ImageKind } from "@/types/database";

type Props = {
  kind: ImageKind;
  label: string;
  value: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
};

export function ImageDropzone({ kind, label, value, existingUrl, onChange }: Props) {
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);

  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    onChange(f);
    setPreview(URL.createObjectURL(f));
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  function clear() {
    onChange(null);
    setPreview(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
        {preview && (
          <button type="button" onClick={clear} className="text-xs text-destructive hover:underline">
            <X className="inline h-3 w-3" /> retirer
          </button>
        )}
      </div>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed transition-colors",
          isDragActive ? "border-primary bg-accent" : "border-input hover:bg-accent/50",
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={kind} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
            <span className="mt-1 text-xs">{isDragActive ? "Lâche l'image" : "Glisser / cliquer"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
