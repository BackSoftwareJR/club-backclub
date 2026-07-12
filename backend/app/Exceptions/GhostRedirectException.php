<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GhostRedirectException extends ApiException
{
    /**
     * @param  array<string, mixed>|null  $metadata
     */
    public function __construct(
        public readonly string $violationType,
        public readonly ?int $clubId = null,
        public readonly ?string $nfcUid = null,
        public readonly ?array $metadata = null,
        private readonly int $httpStatus = 404,
    ) {
        parent::__construct('Resource not found.');
    }

    public function statusCode(): int
    {
        return $this->httpStatus;
    }

    public function errorCode(): string
    {
        return 'ghost_redirect';
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Resource not found.',
            'error' => $this->errorCode(),
            'redirect_url' => 'https://www.google.com',
        ], $this->statusCode());
    }
}
