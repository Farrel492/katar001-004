<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class AlbumPhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'album_id',
        'path',
        'caption',
        'sort_order',
    ];

    protected $appends = [
        'photo_url',
    ];

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->path ? Storage::disk('public')->url($this->path) : null;
    }

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }
}
