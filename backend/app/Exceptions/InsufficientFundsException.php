<?php

namespace App\Exceptions;

class InsufficientFundsException extends ApiException
{
    public function __construct(string $message = 'Insufficient wallet balance.')
    {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return 402;
    }

    public function errorCode(): string
    {
        return 'insufficient_funds';
    }
}
