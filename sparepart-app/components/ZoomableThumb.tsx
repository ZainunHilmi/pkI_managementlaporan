"use client";

import { useState } from "react";
import Image from "next/image";
import ImageLightbox from "@/components/ImageLightbox";

// Thumbnail yang bisa diklik untuk membuka lightbox. Aman dipakai di dalam
// <Link> (klik di-cegat agar tidak navigasi). `unoptimized` + fallback bila
// host gambar tidak bisa dijangkau.
export default function ZoomableThumb({
  images,
  startIndex = 0,
  alt,
  boxClassName = "relative h-44 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50",
  imgClassName = "object-cover",
  sizes = "33vw",
}: {
  images: string[];
  startIndex?: number;
  alt: string;
  boxClassName?: string;
  imgClassName?: string;
  sizes?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const src = images[startIndex];

  return (
    <>
      <div
        className={`group/zoom cursor-zoom-in ${boxClassName}`}
        role="button"
        tabIndex={0}
        aria-label={`Perbesar gambar ${alt}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (src && !failed) setOpenIndex(startIndex);
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && src && !failed) {
            e.preventDefault();
            setOpenIndex(startIndex);
          }
        }}
      >
        {src && !failed ? (
          <Image
            src={src}
            alt={alt}
            fill
            unoptimized
            sizes={sizes}
            className={`${imgClassName} transition-transform duration-500 group-hover/zoom:scale-105`}
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
            <span className="text-xl">🖼️</span>
            <span className="text-xs text-slate-400">
              {src ? "Gambar tidak dapat dimuat" : "Tanpa gambar"}
            </span>
          </span>
        )}
        {src && !failed && (
          <span
            aria-hidden
            className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white opacity-100 transition lg:opacity-0 lg:group-hover/zoom:opacity-100"
          >
            🔍 Perbesar
          </span>
        )}
      </div>
      {openIndex !== null && (
        <ImageLightbox
          images={images}
          index={openIndex}
          alt={alt}
          onIndex={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
