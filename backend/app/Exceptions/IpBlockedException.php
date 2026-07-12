<?php

namespace App\Exceptions;

class IpBlockedException extends ApiException
{
    public function __construct(string $message = 'Too many failed authentication attempts from this IP.')
    {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return 429;
    }

    public function errorCode(): string
    {
        return 'ip_blocked';
    }
}
