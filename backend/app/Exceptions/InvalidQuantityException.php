<?php

namespace App\Exceptions;

class InvalidQuantityException extends ApiException
{
    public function __construct(string $message = 'Quantity does not match product step rules.')
    {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function errorCode(): string
    {
        return 'invalid_quantity';
    }
}
