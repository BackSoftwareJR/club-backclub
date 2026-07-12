<?php

namespace App\Exceptions;

class ClubScopeException extends ApiException
{
    public function __construct(string $message = 'Access denied for this club.')
    {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return 403;
    }

    public function errorCode(): string
    {
        return 'club_scope_mismatch';
    }
}
