<?php

namespace App\Exceptions;

class UnauthorizedApiException extends ApiException
{
    public function __construct(string $message = 'Unauthorized.')
    {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return 401;
    }

    public function errorCode(): string
    {
        return 'unauthorized';
    }
}
