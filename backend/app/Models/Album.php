<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Album extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'event_id',
        'taken_at',
        'cover_photo_id',
        'status',
        'created_by',
    ];

    protected $casts = [
        'taken_at' => 'date',
    ];

    protected $appends = [
        'cover_url',
        'photos_count',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(AlbumPhoto::class)->orderBy('sort_order', 'asc')->orderBy('id', 'asc');
    }

    public function coverPhoto(): BelongsTo
    {
        return $this->belongsTo(AlbumPhoto::class, 'cover_photo_id');
    }

    public function getCoverUrlAttribute(): ?string
    {
        if ($this->relationLoaded('coverPhoto') && $this->coverPhoto) {
            return $this->coverPhoto->photo_url;
        }

        if ($this->cover_photo_id) {
            $photo = AlbumPhoto::find($this->cover_photo_id);
            if ($photo) {
                return $photo->photo_url;
            }
        }

        // Fallback ke foto pertama jika ada
        if ($this->relationLoaded('photos') && $this->photos->isNotEmpty()) {
            return $this->photos->first()->photo_url;
        }

        $firstPhoto = $this->photos()->first();
        return $firstPhoto?->photo_url;
    }

    public function getPhotosCountAttribute(): int
    {
        if ($this->relationLoaded('photos')) {
            return $this->photos->count();
        }

        return $this->photos()->count();
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title);
        if ($baseSlug === '') {
            $baseSlug = 'album';
        }

        $slug = $baseSlug;
        $counter = 1;

        while (static::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
