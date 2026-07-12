<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class ApiException extends Exception
{
    abstract public function statusCode(): int;

    abstract public function errorCode(): string;

    public function render(Request $request): ?JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error' => $this->errorCode(),
        ], $this->statusCode());
    }
}
