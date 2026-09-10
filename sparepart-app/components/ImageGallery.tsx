import ZoomableThumb from "@/components/ZoomableThumb";

// Galeri halaman detail: grid foto + klik untuk lightbox (zoom, geser, navigasi).
export default function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  if (images.length === 0) {
    return (
      <p className="flex h-60 items-center justify-center text-sm text-slate-300">
        Tanpa gambar
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {images.map((src, i) => (
        <ZoomableThumb
          key={src}
          images={images}
          startIndex={i}
          alt={alt}
          boxClassName="relative block h-60 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-50"
          imgClassName="object-contain"
          sizes="(max-width: 1024px) 100vw, 40vw"
        />
      ))}
    </div>
  );
}
