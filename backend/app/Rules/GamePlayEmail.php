<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class GamePlayEmail implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $fail('Enter a valid fictional game email address.');

            return;
        }

        $domain = strtolower(substr(strrchr($value, '@'), 1) ?: '');

        if ($domain === '') {
            $fail('Use a fictional game email (e.g. player@velvet.club).');

            return;
        }

        $blocked = array_map('strtolower', config('legal.blocked_email_domains', []));
        if (in_array($domain, $blocked, true)) {
            $fail('Real email providers are not allowed. Use a fictional game domain (e.g. .club, .game, .local).');

            return;
        }

        $allowedTlds = config('legal.allowed_email_tlds', []);
        $tld = strtolower(substr($domain, strrpos($domain, '.') + 1) ?: '');

        if (! in_array($tld, $allowedTlds, true)) {
            $fail('Email must use a fictional game TLD: '.implode(', ', array_map(fn ($t) => ".{$t}", $allowedTlds)).'.');
        }
    }
}
