<?php

use App\Exceptions\ApiException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Hostinger deploy: public_html/api/index.php receives paths like /entry/... (no /api prefix).
 * Set API_ROUTE_PREFIX= (empty) in production .env on its own line.
 * Local dev: omit API_ROUTE_PREFIX → defaults to "api".
 *
 * Read .env line-by-line — env() returns null when config is cached.
 */
$apiRoutePrefix = (static function (): string {
    $envPath = dirname(__DIR__).'/.env';
    if (! is_readable($envPath)) {
        return 'api';
    }

    foreach (file($envPath, FILE_IGNORE_NEW_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (str_starts_with($line, 'API_ROUTE_PREFIX=')) {
            return trim(substr($line, strlen('API_ROUTE_PREFIX=')), " \t\"'");
        }
    }

    return 'api';
})();

$isApiRequest = static function (Request $request) use ($apiRoutePrefix): bool {
    if ($apiRoutePrefix !== '' && $apiRoutePrefix !== null) {
        return $request->is(trim((string) $apiRoutePrefix, '/').'/*');
    }

    return $request->is('entry/*')
        || $request->is('auth/*')
        || $request->is('clubs/*')
        || $request->is('up');
};

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: $apiRoutePrefix === '' || $apiRoutePrefix === null ? '' : (string) $apiRoutePrefix,
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'jwt.auth' => \App\Http\Middleware\JwtAuthMiddleware::class,
            'ip.auth.block' => \App\Http\Middleware\IpAuthBlockMiddleware::class,
            'club.scope' => \App\Http\Middleware\ClubScopeMiddleware::class,
            'club.admin' => \App\Http\Middleware\ClubAdminMiddleware::class,
            'club.member.active' => \App\Http\Middleware\ClubMemberActiveMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) use ($isApiRequest): void {
        $exceptions->shouldRenderJsonWhen($isApiRequest);

        $exceptions->render(function (ApiException $exception, Request $request) {
            return $exception->render($request);
        });

        $exceptions->render(function (ValidationException $exception, Request $request) use ($isApiRequest) {
            if (! $isApiRequest($request)) {
                return null;
            }

            return response()->json([
                'message' => 'Validation failed.',
                'error' => 'validation_error',
                'errors' => $exception->errors(),
            ], 422);
        });
    })->create();
