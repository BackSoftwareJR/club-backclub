<?php

namespace App\Exceptions;

class TopupRequestNotPendingException extends ApiException
{
    public function __construct(string $message = 'Top-up request is not pending.')
    {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function errorCode(): string
    {
        return 'topup_not_pending';
    }
}
