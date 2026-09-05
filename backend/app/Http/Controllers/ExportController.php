<?php

namespace App\Http\Controllers;

use App\Models\Sparepart;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ExportController extends Controller
{
    // Palet warna laporan (ARGB). Header navy, aksen oranye mengikuti tema aplikasi (#D97757).
    private const NAVY = 'FF1F3864';
    private const ORANGE = 'FFD97757';
    private const ORANGE_DARK = 'FFB85C38';
    private const WHITE = 'FFFFFFFF';
    private const ZEBRA = 'FFF2F4F7';
    private const GRID = 'FFD9D9D9';
    private const GREEN_BG = 'FFE8F5E9';
    private const GREEN_TX = 'FF2E7D32';
    private const RED_BG = 'FFFFEBEE';
    private const RED_TX = 'FFC62828';
    private const AMBER_BG = 'FFFFF8E1';
    private const AMBER_TX = 'FFF57F17';
    private const BLUE_BG = 'FFEAF1FB';
    private const BLUE_TX = 'FF1F3864';
    private const GRAY_TX = 'FF7D7461';
    private const LINK = 'FF2563EB';

    private const MAX_ROWS_WITH_IMAGES = 1000;
    private const MAX_ROWS_NO_IMAGES = 5000;

    /**
     * GET /api/exports/preview?preset=today|week|month|custom|all&from=&to=&type=
     * Ringan: hanya hitung jumlah baris agar UI bisa memperingatkan sebelum unduh.
     */
    public function preview(Request $request)
    {
        $filter = $this->resolveFilter($request);

        return response()->json([
            'transactions' => $filter['txQuery']->count(),
            'parts' => Sparepart::count(),
            'from' => $filter['from']?->toDateString(),
            'to' => $filter['to']?->toDateString(),
            'preset' => $filter['preset'],
            'type' => $filter['type'],
            'limit_with_images' => self::MAX_ROWS_WITH_IMAGES,
            'limit_no_images' => self::MAX_ROWS_NO_IMAGES,
        ]);
    }

    /**
     * GET /api/exports/excel?preset=...&from=&to=&type=all|in|out&include_images=1&sheets=both
     * Unduh laporan .xlsx: Ringkasan + Detail Transaksi + Stok Terkini (dengan thumbnail foto).
     */
    public function excel(Request $request)
    {
        $request->validate([
            'preset' => 'nullable|in:today,week,month,custom,all',
            'from' => 'required_if:preset,custom|nullable|date_format:Y-m-d',
            'to' => 'required_if:preset,custom|nullable|date_format:Y-m-d|after_or_equal:from',
            'type' => 'nullable|in:all,in,out',
            'include_images' => 'nullable|boolean',
            'sheets' => 'nullable|in:both,transactions,stock',
        ]);

        $filter = $this->resolveFilter($request);
        $includeImages = $request->boolean('include_images', true);
        $sheets = $request->string('sheets', 'both')->toString();

        $transactions = $sheets === 'stock'
            ? collect()
            : $filter['txQuery']->orderBy('created_at')->get();
        $parts = $sheets === 'transactions'
            ? collect()
            : Sparepart::orderBy('part_id')->get();

        $limit = $includeImages ? self::MAX_ROWS_WITH_IMAGES : self::MAX_ROWS_NO_IMAGES;
        if ($transactions->count() > $limit) {
            return response()->json([
                'message' => "Data terlalu banyak ({$transactions->count()} baris, maks {$limit}). Persempit rentang tanggal, filter tipe, atau matikan opsi gambar.",
            ], 422);
        }

        @set_time_limit(180);
        @ini_set('memory_limit', '512M');

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()
            ->setCreator('Sistem Manajemen Sparepart')
            ->setTitle('Laporan Sparepart')
            ->setDescription("Laporan sparepart periode {$filter['periodLabel']}");

        $tmpFiles = [];
        try {
            $sheetIndex = 0;

            if ($sheets !== 'stock') {
                $this->buildSummarySheet(
                    $spreadsheet->getActiveSheet(), $filter, $transactions, $parts, $request->user()->name ?? '-'
                );
                $sheetIndex++;
            }

            if ($sheets !== 'stock') {
                $sheet = $sheetIndex === 0
                    ? $spreadsheet->getActiveSheet()
                    : $spreadsheet->createSheet($sheetIndex);
                $this->buildTransactionSheet($sheet, $filter, $transactions, $includeImages, $tmpFiles);
                $sheetIndex++;
            }

            if ($sheets !== 'transactions') {
                $sheet = $sheetIndex === 0
                    ? $spreadsheet->getActiveSheet()
                    : $spreadsheet->createSheet($sheetIndex);
                $this->buildStockSheet($sheet, $parts, $includeImages, $tmpFiles);
            }

            $spreadsheet->setActiveSheetIndex(0);

            $fileName = "Laporan-Sparepart_{$filter['fileLabel']}.xlsx";

            return response()->streamDownload(function () use ($spreadsheet, &$tmpFiles) {
                try {
                    (new Xlsx($spreadsheet))->save('php://output');
                } finally {
                    $spreadsheet->disconnectWorksheets();
                    foreach ($tmpFiles as $f) {
                        @unlink($f);
                    }
                }
            }, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Cache-Control' => 'max-age=0',
            ]);
        } catch (\Throwable $e) {
            foreach ($tmpFiles as $f) {
                @unlink($f);
            }
            report($e);

            return response()->json(['message' => 'Gagal menyusun file Excel. Coba lagi atau matikan opsi gambar.'], 500);
        }
    }

    // ---------- Filter rentang waktu ----------

    private function resolveFilter(Request $request): array
    {
        $preset = $request->string('preset', 'week')->toString();
        $type = $request->string('type', 'all')->toString();
        if (! in_array($preset, ['today', 'week', 'month', 'custom', 'all'], true)) {
            $preset = 'week';
        }
        if (! in_array($type, ['all', 'in', 'out'], true)) {
            $type = 'all';
        }

        $from = null;
        $to = null;
        $periodLabel = 'Semua Data';
        $fileLabel = 'semua-data';

        if ($preset === 'today') {
            $from = Carbon::today()->startOfDay();
            $to = Carbon::today()->endOfDay();
        } elseif ($preset === 'week') {
            $from = Carbon::today()->subDays(6)->startOfDay();
            $to = Carbon::today()->endOfDay();
        } elseif ($preset === 'month') {
            $from = Carbon::today()->subDays(29)->startOfDay();
            $to = Carbon::today()->endOfDay();
        } elseif ($preset === 'custom') {
            $from = Carbon::parse($request->string('from')->toString())->startOfDay();
            $to = Carbon::parse($request->string('to')->toString())->endOfDay();
        }

        if ($from && $to) {
            $fmt = fn (Carbon $d) => $d->translatedFormat('d M Y');
            $periodLabel = $from->isSameDay($to) ? $fmt($from) : $fmt($from).' – '.$fmt($to);
            $fileLabel = $from->format('Ymd').'-sd-'.$to->format('Ymd');
        }

        $txQuery = Transaction::with(['sparepart', 'user']);
        if ($from && $to) {
            $txQuery->whereBetween('created_at', [$from, $to]);
        }
        if ($type !== 'all') {
            $txQuery->where('type', $type);
        }

        return compact('preset', 'type', 'from', 'to', 'periodLabel', 'fileLabel', 'txQuery');
    }

    // ---------- Sheet 1: Ringkasan ----------

    private function buildSummarySheet($sheet, array $filter, $transactions, $parts, string $printedBy): void
    {
        $sheet->setTitle('Ringkasan');
        $sheet->setShowGridLines(false);

        $countIn = $transactions->where('type', 'in')->count();
        $countOut = $transactions->where('type', 'out')->count();
        $qtyIn = (int) $transactions->where('type', 'in')->sum('quantity');
        $qtyOut = (int) $transactions->where('type', 'out')->sum('quantity');
        $lowStock = $parts->where('current_stock', '<=', 3)->count();

        $topOut = $transactions->where('type', 'out')
            ->groupBy('part_id')
            ->map(fn ($g) => ['qty' => $g->sum('quantity'), 'name' => $g->first()->sparepart->name ?? $g->first()->part_id,
                'location' => $g->first()->sparepart->location ?? '-'])
            ->sortByDesc('qty')->take(5);

        // Pita judul
        $sheet->mergeCells('A1:D1');
        $sheet->setCellValue('A1', 'LAPORAN SPAREPART');
        $this->band($sheet, 'A1:D1', self::NAVY, self::WHITE, 16, true);
        $sheet->getRowDimension(1)->setRowHeight(30);

        $sheet->mergeCells('A2:D2');
        $typeLabel = $filter['type'] === 'all' ? 'Semua Tipe' : ($filter['type'] === 'in' ? 'Barang Masuk' : 'Barang Keluar');
        $sheet->setCellValue('A2', "Periode: {$filter['periodLabel']}  •  {$typeLabel}  •  Dicetak: ".now()->translatedFormat('d M Y H:i')." oleh {$printedBy}");
        $this->band($sheet, 'A2:D2', self::ORANGE, self::WHITE, 10, true);
        $sheet->getRowDimension(2)->setRowHeight(22);
        $sheet->getRowDimension(3)->setRowHeight(8);

        // Kartu KPI (2 kolom berdampingan, value berwarna)
        $kpis = [
            ['Total Transaksi', number_format($transactions->count(), 0, ',', '.'), self::BLUE_BG, self::BLUE_TX],
            ['Jenis Part', number_format($parts->count(), 0, ',', '.'), self::BLUE_BG, self::BLUE_TX],
            ['Transaksi Masuk', number_format($countIn, 0, ',', '.')."  ({$qtyIn} unit)", self::GREEN_BG, self::GREEN_TX],
            ['Transaksi Keluar', number_format($countOut, 0, ',', '.')."  ({$qtyOut} unit)", self::RED_BG, self::RED_TX],
            ['Total Stok Saat Ini', number_format((int) $parts->sum('current_stock'), 0, ',', '.').' unit', self::GREEN_BG, self::GREEN_TX],
            ['Part Stok Menipis (≤3)', number_format($lowStock, 0, ',', '.'), $lowStock > 0 ? self::AMBER_BG : self::GREEN_BG, $lowStock > 0 ? self::AMBER_TX : self::GREEN_TX],
        ];

        $row = 4;
        foreach (array_chunk($kpis, 2) as $pair) {
            $sheet->setCellValue("A{$row}", $pair[0][0]);
            $sheet->setCellValue("B{$row}", $pair[0][1]);
            $this->band($sheet, "B{$row}", $pair[0][2], $pair[0][3], 12, true);
            if (isset($pair[1])) {
                $sheet->setCellValue("C{$row}", $pair[1][0]);
                $sheet->setCellValue("D{$row}", $pair[1][1]);
                $this->band($sheet, "D{$row}", $pair[1][2], $pair[1][3], 12, true);
            }
            $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(10)->getColor()->setARGB(self::GRAY_TX);
            $sheet->getStyle("C{$row}")->getFont()->setBold(true)->setSize(10)->getColor()->setARGB(self::GRAY_TX);
            $sheet->getRowDimension($row)->setRowHeight(26);
            $row++;
        }
        $sheet->getStyle("A4:D".($row - 1))->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::GRID);

        // Tabel Top 5
        $row += 1;
        $sheet->mergeCells("A{$row}:D{$row}");
        $sheet->setCellValue("A{$row}", 'TOP 5 PART PALING SERING KELUAR');
        $this->band($sheet, "A{$row}:D{$row}", self::NAVY, self::WHITE, 11, true);
        $sheet->getRowDimension($row)->setRowHeight(24);
        $row++;

        $headers = ['No', 'ID Part', 'Nama Sparepart', 'Total Keluar'];
        foreach ($headers as $i => $h) {
            $col = Coordinate::stringFromColumnIndex($i + 1);
            $sheet->setCellValue("{$col}{$row}", $h);
        }
        $this->band($sheet, "A{$row}:D{$row}", self::ORANGE, self::WHITE, 10, true);
        $headerRow = $row;
        $row++;

        $no = 1;
        $startData = $row;
        foreach ($topOut as $partId => $t) {
            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", $partId);
            $sheet->setCellValue("C{$row}", $t['name']);
            $sheet->setCellValue("D{$row}", $t['qty']);
            if ($no % 2 === 0) {
                $sheet->getStyle("A{$row}:D{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::ZEBRA);
            }
            $sheet->getRowDimension($row)->setRowHeight(20);
            $row++;
        }
        if ($topOut->isEmpty()) {
            $sheet->mergeCells("A{$row}:D{$row}");
            $sheet->setCellValue("A{$row}", 'Belum ada transaksi keluar pada periode ini.');
            $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->getColor()->setARGB(self::GRAY_TX);
            $sheet->getRowDimension($row)->setRowHeight(20);
            $row++;
        }
        $sheet->getStyle("A{$headerRow}:D".($row - 1))->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::GRID);
        $sheet->getStyle("A{$startData}:A".($row - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("D{$startData}:D".($row - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $row += 1;
        $sheet->mergeCells("A{$row}:D{$row}");
        $sheet->setCellValue("A{$row}", 'Diekspor dari Sistem Manajemen Sparepart (.xlsx)  •  Sheet Detail Transaksi & Stok Terkini tersedia di tab berikut.');
        $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->setSize(9)->getColor()->setARGB(self::GRAY_TX);

        $sheet->getColumnDimension('A')->setWidth(26);
        $sheet->getColumnDimension('B')->setWidth(24);
        $sheet->getColumnDimension('C')->setWidth(26);
        $sheet->getColumnDimension('D')->setWidth(24);
        $this->printSetup($sheet);
    }

    // ---------- Sheet 2: Detail Transaksi ----------

    private function buildTransactionSheet($sheet, array $filter, $transactions, bool $includeImages, array &$tmpFiles): void
    {
        $sheet->setTitle('Detail Transaksi');

        $lastCol = 'J';
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->setCellValue('A1', 'DETAIL TRANSAKSI SPAREPART');
        $this->band($sheet, "A1:{$lastCol}1", self::NAVY, self::WHITE, 15, true);
        $sheet->getRowDimension(1)->setRowHeight(28);

        $typeLabel = $filter['type'] === 'all' ? 'Semua Tipe' : ($filter['type'] === 'in' ? 'Barang Masuk' : 'Barang Keluar');
        $sheet->mergeCells("A2:{$lastCol}2");
        $sheet->setCellValue('A2', "Periode: {$filter['periodLabel']}  •  {$typeLabel}  •  {$transactions->count()} transaksi");
        $this->band($sheet, "A2:{$lastCol}2", self::ORANGE, self::WHITE, 10, true);
        $sheet->getRowDimension(2)->setRowHeight(21);
        $sheet->getRowDimension(3)->setRowHeight(6);

        $headers = ['No', 'Tanggal & Waktu', 'ID Part', 'Nama Sparepart', 'Lokasi', 'Tipe', 'Jumlah', 'Mekanik', 'Keterangan', 'Foto'];
        $widths = [6, 20, 12, 28, 15, 12, 10, 20, 34, 18];
        foreach ($headers as $i => $h) {
            $col = Coordinate::stringFromColumnIndex($i + 1);
            $sheet->setCellValue("{$col}4", $h);
            $sheet->getColumnDimension($col)->setWidth($widths[$i]);
        }
        $this->band($sheet, "A4:{$lastCol}4", self::NAVY, self::WHITE, 10, true);
        $sheet->getRowDimension(4)->setRowHeight(24);

        $row = 5;
        foreach ($transactions as $i => $tx) {
            $isIn = $tx->type === 'in';
            $sheet->setCellValue("A{$row}", $i + 1);
            $sheet->setCellValue("B{$row}", $tx->created_at ? $tx->created_at->translatedFormat('d M Y, H:i') : '-');
            $sheet->setCellValue("C{$row}", $tx->part_id);
            $sheet->setCellValue("D{$row}", $tx->sparepart->name ?? '-');
            $sheet->setCellValue("E{$row}", $tx->sparepart->location ?? '-');
            $sheet->setCellValue("F{$row}", $isIn ? 'MASUK' : 'KELUAR');
            // Explicit string agar tanda "+" tidak dimakan Excel sebagai angka.
            $sheet->setCellValueExplicit("G{$row}", ($isIn ? '+' : '−').number_format($tx->quantity, 0, ',', '.'), DataType::TYPE_STRING);
            $sheet->setCellValue("H{$row}", $tx->user->name ?? '-');
            $sheet->setCellValue("I{$row}", $tx->notes ?: '-');

            // Kolom tipe: badge berwarna
            $this->band($sheet, "F{$row}", $isIn ? self::GREEN_BG : self::RED_BG, $isIn ? self::GREEN_TX : self::RED_TX, 10, true);
            $sheet->getStyle("G{$row}")->getFont()->setBold(true)->setSize(11)
                ->getColor()->setARGB($isIn ? self::GREEN_TX : self::RED_TX);

            // Zebra untuk baris
            if ($row % 2 === 0) {
                foreach (['A', 'B', 'C', 'D', 'E', 'G', 'H', 'I'] as $c) {
                    $sheet->getStyle("{$c}{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::ZEBRA);
                }
            }

            // Foto: thumbnail embed + hyperlink cadangan
            $imageUrl = $tx->sparepart->image_url ?? null;
            $this->attachPhoto($sheet, "J{$row}", $imageUrl, $includeImages, $tmpFiles);

            $sheet->getRowDimension($row)->setRowHeight($includeImages ? 62 : 20);
            $row++;
        }

        $lastData = max($row - 1, 4);
        $sheet->getStyle("A4:{$lastCol}{$lastData}")->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::GRID);
        $sheet->getStyle("A5:A{$lastData}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("F5:G{$lastData}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("B5:B{$lastData}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("I5:I{$lastData}")->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->freezePane('A5');
        $sheet->setAutoFilter("A4:{$lastCol}{$lastData}");
        $this->printSetup($sheet);
    }

    // ---------- Sheet 3: Stok Terkini ----------

    private function buildStockSheet($sheet, $parts, bool $includeImages, array &$tmpFiles): void
    {
        $sheet->setTitle('Stok Terkini');

        $lastCol = 'H';
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->setCellValue('A1', 'STOK SPAREPART TERKINI');
        $this->band($sheet, "A1:{$lastCol}1", self::NAVY, self::WHITE, 15, true);
        $sheet->getRowDimension(1)->setRowHeight(28);

        $sheet->mergeCells("A2:{$lastCol}2");
        $sheet->setCellValue('A2', 'Snapshot per '.now()->translatedFormat('d M Y H:i')."  •  {$parts->count()} jenis part");
        $this->band($sheet, "A2:{$lastCol}2", self::ORANGE, self::WHITE, 10, true);
        $sheet->getRowDimension(2)->setRowHeight(21);
        $sheet->getRowDimension(3)->setRowHeight(6);

        $headers = ['No', 'ID Part', 'Nama Sparepart', 'Lokasi', 'Stok', 'Status', 'Deskripsi', 'Foto'];
        $widths = [6, 12, 28, 15, 10, 13, 36, 18];
        foreach ($headers as $i => $h) {
            $col = Coordinate::stringFromColumnIndex($i + 1);
            $sheet->setCellValue("{$col}4", $h);
            $sheet->getColumnDimension($col)->setWidth($widths[$i]);
        }
        $this->band($sheet, "A4:{$lastCol}4", self::NAVY, self::WHITE, 10, true);
        $sheet->getRowDimension(4)->setRowHeight(24);

        $row = 5;
        foreach ($parts as $i => $p) {
            $low = $p->current_stock <= 3;
            $sheet->setCellValue("A{$row}", $i + 1);
            $sheet->setCellValue("B{$row}", $p->part_id);
            $sheet->setCellValue("C{$row}", $p->name);
            $sheet->setCellValue("D{$row}", $p->location);
            $sheet->setCellValue("E{$row}", $p->current_stock);
            $sheet->setCellValue("F{$row}", $low ? 'MENIPIS' : 'AMAN');
            $sheet->setCellValue("G{$row}", $p->description ?: '-');

            $this->band($sheet, "F{$row}", $low ? self::RED_BG : self::GREEN_BG, $low ? self::RED_TX : self::GREEN_TX, 10, true);
            $sheet->getStyle("E{$row}")->getFont()->setBold(true)->setSize(12)
                ->getColor()->setARGB($low ? self::RED_TX : self::GREEN_TX);

            if ($row % 2 === 0) {
                foreach (['A', 'B', 'C', 'D', 'G'] as $c) {
                    $sheet->getStyle("{$c}{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB(self::ZEBRA);
                }
            }

            $this->attachPhoto($sheet, "H{$row}", $p->image_url ?? null, $includeImages, $tmpFiles);

            $sheet->getRowDimension($row)->setRowHeight($includeImages ? 62 : 20);
            $row++;
        }

        $lastData = max($row - 1, 4);
        $sheet->getStyle("A4:{$lastCol}{$lastData}")->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB(self::GRID);
        $sheet->getStyle("A5:A{$lastData}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("E5:F{$lastData}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle("G5:G{$lastData}")->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->freezePane('A5');
        $sheet->setAutoFilter("A4:{$lastCol}{$lastData}");
        $this->printSetup($sheet);
    }

    // ---------- Helper styling & gambar ----------

    private function band($sheet, string $range, string $bg, string $fg, int $size, bool $bold): void
    {
        $style = $sheet->getStyle($range);
        $style->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB($bg);
        $style->getFont()->setBold($bold)->setSize($size)->getColor()->setARGB($fg);
        $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
    }

    private function printSetup($sheet): void
    {
        $sheet->getPageSetup()
            ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE)
            ->setPaperSize(PageSetup::PAPERSIZE_A4)
            ->setFitToWidth(1)
            ->setFitToHeight(0);
        $sheet->getPageSetup()->setFitToPage(true);
        $sheet->getHeaderFooter()->setOddFooter('&C Halaman &P dari &N');
    }

    /**
     * Tempel thumbnail foto ke sel + hyperlink "Lihat Foto" sebagai cadangan
     * bila gambar tidak bisa dimuat (mis. URL R2 mati).
     */
    private function attachPhoto($sheet, string $cell, ?string $imageUrl, bool $includeImages, array &$tmpFiles): void
    {
        $sheet->getStyle($cell)->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);

        if (! $imageUrl) {
            $sheet->setCellValue($cell, '—');
            $sheet->getStyle($cell)->getFont()->setItalic(true)->getColor()->setARGB(self::GRAY_TX);

            return;
        }

        $sheet->setCellValue($cell, 'Lihat Foto');
        if (str_starts_with($imageUrl, 'http')) {
            $sheet->getCell($cell)->getHyperlink()->setUrl($imageUrl);
        }
        $sheet->getStyle($cell)->getFont()->setSize(9)->setUnderline(true);
        $sheet->getStyle($cell)->getFont()->getColor()->setARGB(self::LINK);

        if (! $includeImages) {
            return;
        }

        $local = $this->resolveImageFile($imageUrl, $tmpFiles);
        if (! $local) {
            return;
        }

        try {
            $drawing = new Drawing();
            $drawing->setPath($local);
            $drawing->setCoordinates($cell);
            $drawing->setHeight(52);
            $drawing->setOffsetX(6);
            $drawing->setOffsetY(5);
            $drawing->setWorksheet($sheet);
        } catch (\Throwable) {
            // Biarkan hyperlink teks sebagai fallback.
        }
    }

    /**
     * Ubah image_url (URL publik /storage/..., path R2, atau path lokal)
     * menjadi file lokal siap embed. Gambar dikecilkan via GD agar file
     * .xlsx tidak membengkak. Return null bila tidak bisa diambil.
     *
     * @return string|null path file lokal
     */
    private function resolveImageFile(string $imageUrl, array &$tmpFiles): ?string
    {
        // 0. Data-URI (mis. data:image/png;base64,...) → tulis ke file temp.
        if (str_starts_with($imageUrl, 'data:image/')) {
            if (preg_match('#^data:(image/(?:png|jpe?g|gif|webp));base64,(.+)$#s', $imageUrl, $m)) {
                $raw = base64_decode($m[2], true);
                if ($raw !== false && strlen($raw) > 0 && strlen($raw) < 8 * 1024 * 1024) {
                    $tmp = tempnam(sys_get_temp_dir(), 'xl_img_');
                    file_put_contents($tmp, $raw);
                    $tmpFiles[] = $tmp;

                    return $this->shrinkForExcel($tmp, $tmpFiles);
                }
            }

            return null;
        }

        // 1. URL /storage/... petakan ke storage/app/public bila ada lokalnya.
        if (preg_match('#/storage/(.+)$#', $imageUrl, $m)) {
            $candidate = storage_path('app/public/'.$m[1]);
            if (is_file($candidate)) {
                return $this->shrinkForExcel($candidate, $tmpFiles);
            }
        }

        // 2. Path relatif storage lokal.
        $relative = ltrim(parse_url($imageUrl, PHP_URL_PATH) ?? $imageUrl, '/');
        foreach ([$relative, 'app/public/'.$relative, $imageUrl] as $try) {
            $candidate = str_starts_with($try, '/') || preg_match('#^[A-Z]:\\\\#i', $try)
                ? $try
                : storage_path($try);
            if (is_file($candidate)) {
                return $this->shrinkForExcel($candidate, $tmpFiles);
            }
        }

        // 3. Disk default (mendukung S3/R2): unduh isi file ke temp.
        try {
            $disk = Storage::disk(config('filesystems.default', 'public'));
            $key = $imageUrl;
            if (preg_match('#/storage/(.+)$#', $imageUrl, $m)) {
                $key = 'spareparts/'.basename($m[1]);
            } elseif (str_starts_with($imageUrl, 'spareparts/')) {
                $key = $imageUrl;
            }
            if ($disk->exists($key)) {
                $tmp = tempnam(sys_get_temp_dir(), 'xl_img_');
                file_put_contents($tmp, $disk->get($key));
                $tmpFiles[] = $tmp;

                return $this->shrinkForExcel($tmp, $tmpFiles);
            }
        } catch (\Throwable) {
            // lanjut ke unduhan HTTP
        }

        // 4. Unduh HTTP langsung (timeout pendek).
        try {
            $res = Http::timeout(8)->get($imageUrl);
            $ct = $res->header('Content-Type', '');
            if ($res->successful() && str_starts_with($ct, 'image/')) {
                $tmp = tempnam(sys_get_temp_dir(), 'xl_img_');
                file_put_contents($tmp, $res->body());
                $tmpFiles[] = $tmp;

                return $this->shrinkForExcel($tmp, $tmpFiles);
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }

    /**
     * Kecilkan gambar ke maks 300px (pakai GD bila tersedia) agar ukuran
     * file Excel tetap wajar. Return path file hasil (bisa file asli).
     */
    private function shrinkForExcel(string $path, array &$tmpFiles): ?string
    {
        $info = @getimagesize($path);
        if (! $info || ! in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP], true)) {
            return null;
        }
        [$w, $h, $type] = $info;
        if (max($w, $h) <= 300 || ! function_exists('imagecreatetruecolor')) {
            return $path;
        }

        $scale = 300 / max($w, $h);
        $nw = (int) round($w * $scale);
        $nh = (int) round($h * $scale);

        $src = match ($type) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_GIF => @imagecreatefromgif($path),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            default => false,
        };
        if (! $src) {
            return $path;
        }

        $dst = imagecreatetruecolor($nw, $nh);
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
        imagefilledrectangle($dst, 0, 0, $nw, $nh, $transparent);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($src);

        $tmp = tempnam(sys_get_temp_dir(), 'xl_th_').'.jpg';
        // Latar putih agar transparansi PNG tetap bagus di Excel.
        $flat = imagecreatetruecolor($nw, $nh);
        $white = imagecolorallocate($flat, 255, 255, 255);
        imagefilledrectangle($flat, 0, 0, $nw, $nh, $white);
        imagecopy($flat, $dst, 0, 0, 0, 0, $nw, $nh);
        imagedestroy($dst);
        imagejpeg($flat, $tmp, 72);
        imagedestroy($flat);

        $tmpFiles[] = $tmp;

        return $tmp;
    }
}
