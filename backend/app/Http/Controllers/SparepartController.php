<?php

namespace App\Http\Controllers;

use App\Models\Sparepart;
use Illuminate\Http\Request;

class SparepartController extends Controller
{
    public function index(Request $request)
    {
        $query = Sparepart::query();

        // Server-side search (FR-02 scalable): ?search=nama/id
        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('part_id', 'like', "%{$s}%")
                  ->orWhere('location', 'like', "%{$s}%");
            });
        }

        // Filter stok: ?stock=low|ok
        if ($request->string('stock') == 'low') {
            $query->where('current_stock', '<=', 3);
        } elseif ($request->string('stock') == 'ok') {
            $query->where('current_stock', '>', 3);
        }

        $spareparts = $query->orderBy('part_id')->get();

        return response()->json($spareparts);
    }

    public function show($partId)
    {
        $sparepart = Sparepart::where('part_id', $partId)->firstOrFail();

        return response()->json($sparepart);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'current_stock' => 'required|integer|min:0',
            'description' => 'nullable|string',
            // FR-04: validasi file 2MB jpg/png (kirim sebagai multipart `image`)
            // Tetap dukung `image_url` string untuk kompatibilitas frontend lama.
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'image_url' => 'nullable|string|max:2048',
        ]);

        $imageUrl = $request->input('image_url');
        if ($request->hasFile('image')) {
            // Otomatis ke R2 bila FILESYSTEM_DISK=s3 (S3-compatible), else ke public/.
            $disk = config('filesystems.default', 'public');
            $path = $request->file('image')->store('spareparts', $disk);
            $imageUrl = $disk === 'public'
                ? rtrim(config('app.url'), '/').'/storage/'.$path
                : $path;
        }

        // Generate next part_id
        $lastPart = Sparepart::orderByDesc('part_id')->first();
        if ($lastPart) {
            $lastNum = intval(substr($lastPart->part_id, 3)) + 1;
        } else {
            $lastNum = 1;
        }
        $partId = 'SP-' . str_pad($lastNum, 3, '0', STR_PAD_LEFT);

        $sparepart = Sparepart::create([
            'part_id' => $partId,
            'name' => $request->name,
            'location' => $request->location,
            'current_stock' => $request->current_stock,
            'description' => $request->description,
            'image_url' => $imageUrl,
        ]);

        return response()->json($sparepart, 201);
    }

    public function update(Request $request, $partId)
    {
        $sparepart = Sparepart::where('part_id', $partId)->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'current_stock' => 'required|integer|min:0',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'image_url' => 'nullable|string|max:2048',
        ]);

        $imageUrl = $request->input('image_url', $sparepart->image_url);
        if ($request->hasFile('image')) {
            $disk = config('filesystems.default', 'public');
            $path = $request->file('image')->store('spareparts', $disk);
            $imageUrl = $disk === 'public'
                ? rtrim(config('app.url'), '/').'/storage/'.$path
                : $path;
        }

        $sparepart->update([
            'name' => $request->name,
            'location' => $request->location,
            'current_stock' => $request->current_stock,
            'description' => $request->description,
            'image_url' => $imageUrl,
        ]);

        return response()->json($sparepart);
    }

    public function destroy($partId)
    {
        $sparepart = Sparepart::where('part_id', $partId)->firstOrFail();
        $sparepart->delete();

        return response()->json(['message' => 'Sparepart berhasil dihapus']);
    }
}
