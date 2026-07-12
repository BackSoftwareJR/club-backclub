<?php

/**
 * Laravel front controller for Hostinger subdirectory deploy.
 *
 * Place as: domains/club.backclub.it/public_html/api/index.php
 * Laravel app root: domains/club.backclub.it/api/ (outside public_html)
 *
 * Strips the /api URL prefix so routes match with API_ROUTE_PREFIX= (empty).
 * External URL: https://club.backclub.it/api/entry/1/NFC-OWNER-001
 * Internal path: /entry/1/NFC-OWNER-001
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

$request = Request::capture();
$uri = $request->getRequestUri();
$path = parse_url($uri, PHP_URL_PATH) ?? '/';

if (str_starts_with($path, '/api')) {
    $strippedPath = substr($path, 4) ?: '/';
    $query = parse_url($uri, PHP_URL_QUERY);
    $newUri = $strippedPath.($query ? '?'.$query : '');

    $request = Request::create(
        $newUri,
        $request->getMethod(),
        $request->request->all(),
        $request->cookies->all(),
        $request->files->all(),
        $request->server->all(),
        $request->getContent()
    );
    $request->headers->replace($request->headers->all());
}

$app->handleRequest($request);
