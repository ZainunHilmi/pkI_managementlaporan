import { Badge } from "@/components/ui";

// Badge status stok: merah jika di bawah threshold (SRS §7).
export default function StockBadge({
  jumlahStock,
  threshold,
}: {
  jumlahStock: number;
  threshold: number;
}) {
  const menipis = jumlahStock < threshold;
  const habis = jumlahStock === 0;
  return (
    <Badge tone={habis ? "rose" : menipis ? "amber" : "emerald"}>
      {habis ? "Habis" : menipis ? "Menipis" : "Aman"} · {jumlahStock}
    </Badge>
  );
}
