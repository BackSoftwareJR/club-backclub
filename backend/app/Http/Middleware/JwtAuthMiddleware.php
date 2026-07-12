<?php

namespace App\Http\Middleware;

use App\Exceptions\UnauthorizedApiException;
use App\Models\User;
use App\Services\Auth\JwtService;
use Closure;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use UnexpectedValueException;

class JwtAuthMiddleware
{
    public function __construct(
        private readonly JwtService $jwtService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->bearerToken();

        if ($header === null || $header === '') {
            throw new UnauthorizedApiException('Bearer token is required.');
        }

        try {
            $payload = $this->jwtService->decode($header);
        } catch (ExpiredException|SignatureInvalidException|UnexpectedValueException) {
            throw new UnauthorizedApiException('Invalid or expired token.');
        }

        $user = User::query()->find($payload->sub ?? null);

        if ($user === null) {
            throw new UnauthorizedApiException('Authenticated user not found.');
        }

        $request->attributes->set('jwt_payload', $payload);
        $request->attributes->set('auth_user', $user);

        return $next($request);
    }
}
