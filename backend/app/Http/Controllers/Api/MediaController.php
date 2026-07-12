<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class MediaController extends Controller
{
    public function show(Request $request, string $path): Response
    {
        $path = $this->normalizePath($path);

        if ($path === null || ! $this->isAllowedPath($path)) {
            abort(404);
        }

        $disk = Storage::disk((string) config('media.disk', 'public'));

        if (! $disk->exists($path)) {
            abort(404);
        }

        $absolutePath = $disk->path($path);
        $mime = $disk->mimeType($path) ?: 'application/octet-stream';

        return response()->file($absolutePath, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    private function normalizePath(string $path): ?string
    {
        $path = str_replace('\\', '/', $path);
        $path = trim($path, '/');

        if ($path === '' || str_contains($path, '..')) {
            return null;
        }

        return $path;
    }

    private function isAllowedPath(string $path): bool
    {
        return str_starts_with($path, 'clubs/');
    }
}
