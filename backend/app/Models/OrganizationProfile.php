<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class OrganizationProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'short_name',
        'tagline',
        'about',
        'history',
        'vision',
        'missions',
        'values',
        'address',
        'region_label',
        'whatsapp',
        'email',
        'instagram',
        'facebook',
        'youtube',
        'logo_path',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'missions' => 'array',
            'values' => 'array',
        ];
    }

    protected $appends = [
        'logo_url',
    ];

    public function getLogoUrlAttribute(): ?string
    {
        if (! $this->logo_path) {
            return null;
        }

        return Storage::disk('public')->url($this->logo_path);
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
