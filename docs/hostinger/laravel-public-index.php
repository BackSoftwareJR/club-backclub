<?php

/**
 * Laravel front controller for Hostinger subdirectory deploy.
 *
 * Place as: domains/club.backclub.it/public_html/api/index.php
 * Laravel app root: domains/club.backclub.it/api/ (outside public_html)
 *
 * External URL: https://club.backclub.it/api/entry/1/NFC-OWNER-001
 * Internal path (Hostinger): /entry/1/NFC-OWNER-001 — set API_ROUTE_PREFIX= (empty) in .env
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$laravelRoot = __DIR__.'/../../api';

if (file_exists($maintenance = $laravelRoot.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $laravelRoot.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $laravelRoot.'/bootstrap/app.php';

$app->handleRequest(Request::capture());
