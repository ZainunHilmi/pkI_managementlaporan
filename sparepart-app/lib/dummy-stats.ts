// Data DUMMY 7 hari untuk preview grafik dashboard admin.
//
// TODO(preview): ganti dengan agregasi asli dari `stockHistory`
// (group by hari, sum jumlah per type MASUK/KELUAR) saat backend siap.
// Selama masih dummy, label tanggal dibuat dinamis (7 hari terakhir dari
// hari ini) agar preview selalu terlihat seperti "1 minggu terakhir",
// sedangkan ANGKA-nya tetap dari konstanta di bawah.

export type DailyStat = {
  key: string; // "2026-09-04" — untuk key React
  label: string; // "4 Sep" — label sumbu X
  dayName: string; // "Kam" — nama hari singkat
  masuk: number;
  keluar: number;
  total: number; // masuk + keluar (dipakai garis tren)
};

// Angka dummy — bebas diubah untuk mencoba tampilan grafik.
const DUMMY_MASUK = [12, 8, 15, 6, 10, 4, 9];
const DUMMY_KELUAR = [5, 9, 7, 11, 6, 3, 8];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function buildWeek(): DailyStat[] {
  const today = new Date();
  return DUMMY_MASUK.map((masuk, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (DUMMY_MASUK.length - 1 - i));
    const keluar = DUMMY_KELUAR[i] ?? 0;
    return {
      key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      label: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`,
      dayName: DAY_NAMES[d.getDay()],
      masuk,
      keluar,
      total: masuk + keluar,
    };
  });
}

export const dummyWeeklyStats: DailyStat[] = buildWeek();

export const dummyWeeklyTotals = dummyWeeklyStats.reduce(
  (acc, d) => ({
    masuk: acc.masuk + d.masuk,
    keluar: acc.keluar + d.keluar,
    total: acc.total + d.total,
  }),
  { masuk: 0, keluar: 0, total: 0 }
);

export const dummyWeeklyNet = dummyWeeklyTotals.masuk - dummyWeeklyTotals.keluar;
