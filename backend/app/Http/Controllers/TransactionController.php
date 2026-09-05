<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Sparepart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::with(['sparepart', 'user']);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $transactions = $query->orderByDesc('created_at')->get();

        return response()->json($transactions);
    }

    public function store(Request $request)
    {
        $request->validate([
            'part_id' => 'required|string|exists:spareparts,part_id',
            'type' => 'required|in:in,out',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        // FR-03: kalkulasi stok atomik agar tidak race-condition saat banyak mekanik ambil bareng.
        $transaction = DB::transaction(function () use ($request) {
            $sparepart = Sparepart::where('part_id', $request->part_id)->lockForUpdate()->firstOrFail();
            if ($request->type === 'out') {
                if ($request->quantity > $sparepart->current_stock) {
                    abort(response()->json(['message' => 'Jumlah melebihi stok!'], 422));
                }
                $sparepart->decrement('current_stock', $request->quantity);
            } else {
                $sparepart->increment('current_stock', $request->quantity);
            }

            return Transaction::create([
                'part_id' => $request->part_id,
                'user_id' => $request->user()->id,
                'type' => $request->type,
                'quantity' => $request->quantity,
                'notes' => $request->notes,
                'created_at' => now(),
            ]);
        });

        return response()->json($transaction->load(['sparepart', 'user']), 201);
    }

    public function takePart(Request $request)
    {
        $request->validate([
            'part_id' => 'required|string|exists:spareparts,part_id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'required|string',
        ]);

        $transaction = DB::transaction(function () use ($request) {
            $sparepart = Sparepart::where('part_id', $request->part_id)->lockForUpdate()->firstOrFail();

            if ($request->quantity > $sparepart->current_stock) {
                abort(response()->json(['message' => 'Jumlah melebihi stok!'], 422));
            }

            $sparepart->decrement('current_stock', $request->quantity);

            return Transaction::create([
                'part_id' => $request->part_id,
                'user_id' => $request->user()->id,
                'type' => 'out',
                'quantity' => $request->quantity,
                'notes' => $request->notes,
                'created_at' => now(),
            ]);
        });

        return response()->json($transaction->load(['sparepart', 'user']), 201);
    }
}
