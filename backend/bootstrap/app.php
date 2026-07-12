<?php

use App\Exceptions\ApiException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

$apiRoutePrefix = env('API_ROUTE_PREFIX', 'api');

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
