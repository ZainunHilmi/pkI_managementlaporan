<?php

namespace App\Http\Controllers;

use App\Models\Sparepart;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalParts = Sparepart::count();
        $totalStock = Sparepart::sum('current_stock');
        $lowStock = Sparepart::where('current_stock', '<=', 3)->count();
        $todayTx = Transaction::whereDate('created_at', today())->count();

        return response()->json([
            'total_parts' => $totalParts,
            'total_stock' => $totalStock,
            'low_stock' => $lowStock,
            'today_transactions' => $todayTx,
        ]);
    }

    public function stockChart()
    {
        $parts = Sparepart::select('part_id', 'name', 'current_stock')
            ->orderBy('part_id')
            ->get();

        return response()->json($parts);
    }

    public function transactionChart()
    {
        $days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        $txIn = array_fill(0, 7, 0);
        $txOut = array_fill(0, 7, 0);

        $transactions = Transaction::where('created_at', '>=', now()->subDays(7))->get();

        foreach ($transactions as $tx) {
            $dayIndex = (int) $tx->created_at->format('N') - 1;
            if ($tx->type === 'in') {
                $txIn[$dayIndex] += $tx->quantity;
            } else {
                $txOut[$dayIndex] += $tx->quantity;
            }
        }

        return response()->json([
            'labels' => $days,
            'in' => $txIn,
            'out' => $txOut,
        ]);
    }
}
