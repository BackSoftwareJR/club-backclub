<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Media disk
    |--------------------------------------------------------------------------
    |
    | Uploads (product covers, club logos) use the "public" filesystem disk.
    | On Hostinger set MEDIA_ROOT_PATH outside the deploy tree so rsync never
    | deletes user files.
    |
    */

    'disk' => env('MEDIA_DISK', 'public'),

];
