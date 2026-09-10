/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Host gambar publik: ImgBB lama (i.ibb.co, baris lama) + ImageKit
    // (host aktif: ik.imagekit.io).
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
