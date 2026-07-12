<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

final class MediaUrl
{
    public static function fromPath(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        return Storage::disk((string) config('media.disk', 'public'))->url($path);
    }
}
