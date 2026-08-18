<?php

namespace App\Helpers;

class PhoneHelper
{
    /**
     * Normalize Egyptian phone numbers to standard format (e.g. 01012345678).
     * Handles:
     * - +201012345678 -> 01012345678
     * - 00201012345678 -> 01012345678
     * - 201012345678 -> 01012345678
     * - 01012345678 -> 01012345678
     * - 1012345678 -> 01012345678
     */
    public static function normalize(string $phone): string
    {
        // Strip everything except digits and plus sign
        $clean = preg_replace('/[^\d+]/', '', trim($phone));

        // Strip leading + or 00
        if (str_starts_with($clean, '+')) {
            $clean = substr($clean, 1);
        } elseif (str_starts_with($clean, '00')) {
            $clean = substr($clean, 2);
        }

        // If starts with Egyptian country code 20
        if (str_starts_with($clean, '20') && strlen($clean) === 12) {
            $clean = '0' . substr($clean, 2);
        } elseif (strlen($clean) === 10 && in_array(substr($clean, 0, 2), ['10', '11', '12', '15'])) {
            $clean = '0' . $clean;
        }

        return $clean;
    }

    /**
     * Validate whether a string is a valid Egyptian mobile phone number.
     * Must be 11 digits starting with 010, 011, 012, or 015 after normalization.
     */
    public static function isValidEgyptianPhone(string $phone): bool
    {
        $normalized = self::normalize($phone);
        return (bool) preg_match('/^01[0125]\d{8}$/', $normalized);
    }
}
