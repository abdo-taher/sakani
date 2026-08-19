<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SitemapController;
use App\Services\SeoMetaService;
use Illuminate\Http\Request;

// 1. Dynamic XML Sitemap
Route::get('/sitemap.xml', [SitemapController::class, 'index']);

// 2. Production robots.txt
Route::get('/robots.txt', function () {
    $content = "User-agent: *\n";
    $content .= "Allow: /\n";
    $content .= "Disallow: /admin\n";
    $content .= "Disallow: /admin/\n";
    $content .= "Disallow: /my-reservations\n";
    $content .= "Disallow: /customer/\n";
    $content .= "Disallow: /api/customer/\n";
    $content .= "Disallow: /api/admin/\n\n";
    $content .= "Sitemap: https://sakani.site/sitemap.xml\n";

    return response($content, 200, [
        'Content-Type' => 'text/plain; charset=utf-8',
        'Cache-Control' => 'public, max-age=86400',
    ]);
});

// 3. Serve React SPA with dynamic SEO Pre-rendering & Server Meta Injection
Route::get('/{any?}', function (Request $request, SeoMetaService $seoService) {
    $path = public_path('index.html');

    if (file_exists($path)) {
        $html = file_get_contents($path);
        $enhancedHtml = $seoService->injectMeta($html, $request->path());
        return response($enhancedHtml, 200, [
            'Content-Type' => 'text/html; charset=utf-8',
            'X-Frame-Options' => 'SAMEORIGIN',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    return response()->json([
        'message' => 'Sakani API & SEO Engine is running.',
        'docs'    => url('/api'),
        'sitemap' => url('/sitemap.xml'),
    ], 200);
})->where('any', '^(?!api).*$');

