"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

function touchDist(a: React.Touch, b: React.Touch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

// Gesture sentuh (Android/iOS): cubit = zoom, 1 jari = seret saat zoom,
// ketuk 2x = toggle zoom, usap kiri/kanan = pindah gambar saat belum zoom.
type TouchGesture =
  | {
      kind: "pan";
      startX: number;
      startY: number;
      baseX: number;
      baseY: number;
      startT: number;
      moved: boolean;
    }
  | { kind: "pinch"; startDist: number; startScale: number };

// Lightbox ala media sosial: klik backdrop / ✕ / Esc untuk tutup,
// DOUBLE-CLICK untuk zoom 1x ↔ 2,5x, scroll untuk zoom 1–4x,
// seret untuk menggeser saat zoom, tombol ‹ › untuk pindah gambar.
// `unoptimized`: gambar remote dimuat langsung browser (tanpa lewat
// optimizer server) + fallback ramah bila host gambar diblokir jaringan.
export default function ImageLightbox({
  images,
  index,
  alt = "Foto sparepart",
  onIndex,
  onClose,
}: {
  images: string[];
  index: number;
  alt?: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [failed, setFailed] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const gesture = useRef<TouchGesture | null>(null);
  const lastTap = useRef(0);

  const total = images.length;
  const src = images[index];
  const canNav = total > 1;

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
    setFailed(false);
  }, []);

  // Ganti gambar → reset zoom. Kunci scroll body selama terbuka.
  useEffect(() => {
    reset();
  }, [index, reset]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Keyboard: Esc tutup, ← → navigasi, + − zoom.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && canNav) onIndex((index + 1) % total);
      else if (e.key === "ArrowLeft" && canNav) onIndex((index - 1 + total) % total);
      else if (e.key === "+" || e.key === "=") setScale((s) => Math.min(4, +(s + 0.5).toFixed(2)));
      else if (e.key === "-") setScale((s) => (s - 0.5 <= 1 ? 1 : +(s - 0.5).toFixed(2)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total, canNav, onIndex, onClose]);

  const zoomAt = (next: number) => {
    const s = Math.min(4, Math.max(1, +next.toFixed(2)));
    setScale(s);
    if (s === 1) setPos({ x: 0, y: 0 });
  };

  // ——— Gesture sentuh ———
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      gesture.current = {
        kind: "pinch",
        startDist: touchDist(e.touches[0], e.touches[1]),
        startScale: scale,
      };
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      gesture.current = {
        kind: "pan",
        startX: t.clientX,
        startY: t.clientY,
        baseX: pos.x,
        baseY: pos.y,
        startT: Date.now(),
        moved: false,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pinch" && e.touches.length === 2) {
      const d = touchDist(e.touches[0], e.touches[1]);
      if (g.startDist > 0) zoomAt((g.startScale * d) / g.startDist);
    } else if (g.kind === "pan" && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - g.startX;
      const dy = t.clientY - g.startY;
      if (Math.abs(dx) + Math.abs(dy) > 10) g.moved = true;
      if (scale > 1) setPos({ x: g.baseX + dx, y: g.baseY + dy });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pinch") {
      if (e.touches.length < 2) gesture.current = null;
      return;
    }
    const dt = Date.now() - g.startT;
    if (!g.moved && dt < 300) {
      // Ketukan: cek ketuk 2x untuk toggle zoom.
      const now = Date.now();
      if (now - lastTap.current < 300) {
        zoomAt(scale === 1 ? 2.5 : 1);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    } else if (g.moved && scale === 1 && canNav) {
      // Usap horizontal saat belum zoom = pindah gambar.
      const t = e.changedTouches[0];
      const dx = t.clientX - g.startX;
      if (Math.abs(dx) > 60) {
        onIndex(dx < 0 ? (index + 1) % total : (index - 1 + total) % total);
      }
    }
    gesture.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Penampil gambar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Bar atas: counter + tutup (z-10 agar selalu di atas gambar) */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm tabular-nums text-white">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/25"
        >
          ✕
        </button>
      </div>

      {/* Navigasi */}
      {canNav && (
        <>
          <button
            type="button"
            aria-label="Gambar sebelumnya"
            onClick={() => onIndex((index - 1 + total) % total)}
            className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Gambar berikutnya"
            onClick={() => onIndex((index + 1) % total)}
            className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/25"
          >
            ›
          </button>
        </>
      )}

      {/* Gambar — touch-none agar gesture jari tidak scroll halaman */}
      <div
        className={`relative h-[76vh] w-[92vw] max-w-5xl touch-none overflow-hidden rounded-xl ${
          scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
        }`}
        onDoubleClick={() => zoomAt(scale === 1 ? 2.5 : 1)}
        onWheel={(e) => zoomAt(scale - e.deltaY * 0.003)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={(e) => {
          if (scale === 1) return;
          drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
        }}
        onMouseMove={(e) => {
          if (!drag.current) return;
          setPos({
            x: drag.current.px + (e.clientX - drag.current.x),
            y: drag.current.py + (e.clientY - drag.current.y),
          });
        }}
        onMouseUp={() => (drag.current = null)}
        onMouseLeave={() => (drag.current = null)}
      >
        {failed ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="text-4xl">🖼️</span>
            <p className="max-w-xs text-sm text-white/80">
              Gambar tidak dapat dimuat. Host gambar ini kemungkinan diblokir jaringan kamu.
            </p>
          </div>
        ) : (
          <div
            className="relative h-full w-full transition-transform duration-200 ease-out"
            style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
          >
            <Image
              key={src}
              src={src}
              alt={alt}
              fill
              unoptimized
              draggable={false}
              className="select-none object-contain"
              sizes="92vw"
              onError={() => setFailed(true)}
            />
          </div>
        )}
      </div>

      {/* Bar bawah: kontrol zoom */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur">
        <button
          type="button"
          aria-label="Perkecil"
          onClick={() => zoomAt(scale - 0.5)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white transition hover:bg-white/20"
        >
          −
        </button>
        <span className="min-w-14 text-center text-sm tabular-nums text-white">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          aria-label="Perbesar"
          onClick={() => zoomAt(scale + 0.5)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white transition hover:bg-white/20"
        >
          +
        </button>
        <span className="hidden text-xs text-white/60 sm:inline">double-click untuk zoom • seret untuk geser</span>
        <span className="text-xs text-white/60 sm:hidden">ketuk 2x / cubit untuk zoom</span>
      </div>
    </div>
  );
}
