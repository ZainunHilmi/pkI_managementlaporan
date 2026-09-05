<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sparepart extends Model
{
    protected $primaryKey = 'part_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'part_id',
        'name',
        'location',
        'current_stock',
        'description',
        'image_url',
    ];

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'part_id', 'part_id');
    }

    public function isLowStock(): bool
    {
        return $this->current_stock <= 3;
    }
}
