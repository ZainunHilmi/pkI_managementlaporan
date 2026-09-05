<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Sparepart;
use App\Models\Transaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // === USERS ===
        $admin = User::create([
            'name' => 'Admin Utama',
            'email' => 'admin@workshop.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        $budi = User::create([
            'name' => 'Budi Mekanik',
            'email' => 'budi@workshop.com',
            'password' => Hash::make('budi123'),
            'role' => 'mechanic',
        ]);

        $andi = User::create([
            'name' => 'Andi Teknisi',
            'email' => 'andi@workshop.com',
            'password' => Hash::make('andi123'),
            'role' => 'mechanic',
        ]);

        // === SPAREPARTS ===
        $spareparts = [
            Sparepart::create([
                'part_id' => 'SP-001',
                'name' => 'Bearing 6205-2RS',
                'location' => 'Rak A-1',
                'current_stock' => 24,
                'description' => 'Bearing seal ganda untuk motor listrik',
            ]),
            Sparepart::create([
                'part_id' => 'SP-002',
                'name' => 'V-Belt B68',
                'location' => 'Rak A-2',
                'current_stock' => 8,
                'description' => 'Fan belt untuk mesin compressor',
            ]),
            Sparepart::create([
                'part_id' => 'SP-003',
                'name' => 'Oil Filter HF-203',
                'location' => 'Rak B-1',
                'current_stock' => 3,
                'description' => 'Filter oli mesin diesel 4-tak',
            ]),
            Sparepart::create([
                'part_id' => 'SP-004',
                'name' => 'Spark Plug CR7E',
                'location' => 'Rak B-2',
                'current_stock' => 45,
                'description' => 'Busi iridium untuk mesin potong',
            ]),
            Sparepart::create([
                'part_id' => 'SP-005',
                'name' => 'Hydraulic Seal Kit',
                'location' => 'Rak C-1',
                'current_stock' => 2,
                'description' => 'Seal kit untuk silinder hidrolik',
            ]),
            Sparepart::create([
                'part_id' => 'SP-006',
                'name' => 'Air Filter FA-163',
                'location' => 'Rak C-2',
                'current_stock' => 15,
                'description' => 'Filter udara universal mesin',
            ]),
            Sparepart::create([
                'part_id' => 'SP-007',
                'name' => 'Timing Belt T120',
                'location' => 'Rak D-1',
                'current_stock' => 6,
                'description' => 'Synchron belt mesin industrial',
            ]),
            Sparepart::create([
                'part_id' => 'SP-008',
                'name' => 'Fuel Pump CP3',
                'location' => 'Rak D-2',
                'current_stock' => 1,
                'description' => 'Pompa bahan bakar common rail',
            ]),
        ];

        // === TRANSACTIONS ===
        Transaction::create([
            'part_id' => 'SP-001',
            'user_id' => $budi->id,
            'type' => 'out',
            'quantity' => 2,
            'notes' => 'Penggantian bearing motor conveyor',
            'created_at' => '2026-09-04 08:30:00',
        ]);

        Transaction::create([
            'part_id' => 'SP-003',
            'user_id' => $budi->id,
            'type' => 'out',
            'quantity' => 1,
            'notes' => 'Servis berkala mesin diesel',
            'created_at' => '2026-09-04 09:15:00',
        ]);

        Transaction::create([
            'part_id' => 'SP-004',
            'user_id' => $andi->id,
            'type' => 'out',
            'quantity' => 4,
            'notes' => 'Maintenance mesin potong rumput',
            'created_at' => '2026-09-04 10:00:00',
        ]);

        Transaction::create([
            'part_id' => 'SP-002',
            'user_id' => $admin->id,
            'type' => 'in',
            'quantity' => 20,
            'notes' => 'Restok dari supplier',
            'created_at' => '2026-09-03 14:00:00',
        ]);

        Transaction::create([
            'part_id' => 'SP-005',
            'user_id' => $admin->id,
            'type' => 'in',
            'quantity' => 10,
            'notes' => 'Pengadaan awal bulan September',
            'created_at' => '2026-09-01 09:00:00',
        ]);

        Transaction::create([
            'part_id' => 'SP-006',
            'user_id' => $andi->id,
            'type' => 'out',
            'quantity' => 3,
            'notes' => 'Ganti filter udara unit A',
            'created_at' => '2026-09-03 11:30:00',
        ]);

        Transaction::create([
            'part_id' => 'SP-001',
            'user_id' => $admin->id,
            'type' => 'in',
            'quantity' => 50,
            'notes' => 'Restok bearing dari distributor',
            'created_at' => '2026-09-02 08:00:00',
        ]);

        Transaction::create([
            'part_id' => 'SP-007',
            'user_id' => $budi->id,
            'type' => 'out',
            'quantity' => 2,
            'notes' => 'Ganti timing belt mesin generator',
            'created_at' => '2026-09-02 13:45:00',
        ]);
    }
}
