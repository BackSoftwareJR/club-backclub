<?php

namespace App\Exceptions;

class ForbiddenApiException extends ApiException
{
    public function __construct(string $message = 'Forbidden.')
    {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return 403;
    }

    public function errorCode(): string
    {
        return 'forbidden';
    }
}
