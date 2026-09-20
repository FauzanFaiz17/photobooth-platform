<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Alert Cooldown (minutes)
    |--------------------------------------------------------------------------
    |
    | Minimum minutes between consecutive notifications for the same printer.
    | Prevents email flooding when many print jobs complete in quick succession.
    |
    */

    'cooldown_minutes' => (int) env('PRINTER_ALERT_COOLDOWN_MINUTES', 60),

];
