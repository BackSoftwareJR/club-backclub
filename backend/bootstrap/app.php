<?php

use App\Exceptions\ApiException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
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
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (ApiException $exception, Request $request) {
            return $exception->render($request);
        });

        $exceptions->render(function (ValidationException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json([
                'message' => 'Validation failed.',
                'error' => 'validation_error',
                'errors' => $exception->errors(),
            ], 422);
        });
    })->create();
