<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
    ];

    protected $fillable = [
        'part_id',
        'user_id',
        'type',
        'quantity',
        'notes',
        'created_at',
    ];

    public function sparepart()
    {
        return $this->belongsTo(Sparepart::class, 'part_id', 'part_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
