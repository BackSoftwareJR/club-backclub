<?php

namespace App\Exceptions;

class PinLockedException extends ApiException
{
    public function __construct(string $message = 'PIN entry locked due to too many failed attempts.')
    {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return 429;
    }

    public function errorCode(): string
    {
        return 'pin_locked';
    }
}
