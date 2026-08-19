<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Location;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    /**
     * Generate dynamic XML sitemap conforming to Sitemaps 0.9 + Image/Video schema
     */
    public function index(): Response
    {
        $xml = Cache::remember('sakani_xml_sitemap_full', 3600, function () {
            return $this->buildSitemapXml();
        });

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
            'Cache-Control' => 'public, max-age=3600, s-maxage=3600',
        ]);
    }

    /**
     * Build sitemap XML structure
     */
    protected function buildSitemapXml(): string
    {
        $siteUrl = rtrim(config('app.frontend_url', 'https://sakani.site'), '/');

        // Fetch only approved, published, non-uploading properties
        $properties = Property::with(['images', 'location', 'category'])
            ->publiclyVisible()
            ->where('is_uploading', false)
            ->latest('updated_at')
            ->get();

        // Fetch locations with properties count
        $locations = Location::all();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
        $xml .= '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' . "\n";
        $xml .= '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">' . "\n";

        // 1. Static Key Landing Pages
        // 1. Static Key SEO Landing Pages
        $staticPages = [
            ['loc' => '/', 'priority' => '1.0', 'changefreq' => 'daily', 'lastmod' => now()->toAtomString()],
            ['loc' => '/rent', 'priority' => '0.95', 'changefreq' => 'daily', 'lastmod' => now()->toAtomString()],
            ['loc' => '/buy', 'priority' => '0.95', 'changefreq' => 'daily', 'lastmod' => now()->toAtomString()],
            ['loc' => '/rooms-for-rent', 'priority' => '0.90', 'changefreq' => 'daily', 'lastmod' => now()->toAtomString()],
            ['loc' => '/places', 'priority' => '0.85', 'changefreq' => 'weekly', 'lastmod' => now()->toAtomString()],
            ['loc' => '/properties', 'priority' => '0.85', 'changefreq' => 'daily', 'lastmod' => now()->toAtomString()],
            ['loc' => '/sell', 'priority' => '0.7', 'changefreq' => 'monthly', 'lastmod' => now()->toAtomString()],
            ['loc' => '/need-property', 'priority' => '0.7', 'changefreq' => 'monthly', 'lastmod' => now()->toAtomString()],
            ['loc' => '/contact', 'priority' => '0.6', 'changefreq' => 'monthly', 'lastmod' => now()->toAtomString()],
        ];

        foreach ($staticPages as $page) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . htmlspecialchars("{$siteUrl}{$page['loc']}") . "</loc>\n";
            $xml .= "    <lastmod>{$page['lastmod']}</lastmod>\n";
            $xml .= "    <changefreq>{$page['changefreq']}</changefreq>\n";
            $xml .= "    <priority>{$page['priority']}</priority>\n";
            $xml .= "  </url>\n";
        }

        // 2. Curated Search & Audience Landing Pages
        $curatedLandings = [
            ['loc' => '/properties?mode=room', 'priority' => '0.80', 'changefreq' => 'daily'],
            ['loc' => '/properties?audience=families', 'priority' => '0.80', 'changefreq' => 'weekly'],
            ['loc' => '/properties?audience=female_students', 'priority' => '0.80', 'changefreq' => 'weekly'],
            ['loc' => '/properties?audience=singles', 'priority' => '0.80', 'changefreq' => 'weekly'],
        ];

        foreach ($curatedLandings as $landing) {
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . htmlspecialchars("{$siteUrl}{$landing['loc']}") . "</loc>\n";
            $xml .= "    <lastmod>" . now()->toAtomString() . "</lastmod>\n";
            $xml .= "    <changefreq>{$landing['changefreq']}</changefreq>\n";
            $xml .= "    <priority>{$landing['priority']}</priority>\n";
            $xml .= "  </url>\n";
        }

        // 3. Location Landing Pages with Real Inventory/Content
        $meaningfulLocations = Location::whereHas('properties', function($q) {
            $q->publiclyVisible();
        })->orWhereNotNull('image_url')->get();

        foreach ($meaningfulLocations as $loc) {
            $locSlug = $loc->slug ?: $loc->id;
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . htmlspecialchars("{$siteUrl}/places/{$locSlug}") . "</loc>\n";
            $xml .= "    <lastmod>" . ($loc->updated_at ? $loc->updated_at->toAtomString() : now()->toAtomString()) . "</lastmod>\n";
            $xml .= "    <changefreq>weekly</changefreq>\n";
            $xml .= "    <priority>0.75</priority>\n";
            if (!empty($loc->image_url)) {
                $xml .= "    <image:image>\n";
                $xml .= "      <image:loc>" . htmlspecialchars($loc->image_url) . "</image:loc>\n";
                $xml .= "      <image:title>" . htmlspecialchars($loc->name . ' - دمياط الجديدة') . "</image:title>\n";
                $xml .= "    </image:image>\n";
            }
            $xml .= "  </url>\n";
        }

        // 4. Public Properties with Images and Videos
        foreach ($properties as $prop) {
            $propSlug = $prop->slug ?: $prop->id;
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . htmlspecialchars("{$siteUrl}/properties/{$propSlug}") . "</loc>\n";
            $xml .= "    <lastmod>" . ($prop->updated_at ? $prop->updated_at->toAtomString() : now()->toAtomString()) . "</lastmod>\n";
            $xml .= "    <changefreq>weekly</changefreq>\n";
            $xml .= "    <priority>" . ($prop->featured ? '0.85' : '0.80') . "</priority>\n";

            // Attach Images
            if ($prop->images && $prop->images->count() > 0) {
                foreach ($prop->images->take(8) as $img) {
                    $imgUrl = $img->image_url;
                    if ($imgUrl && !str_contains($imgUrl, '.mp4') && !str_contains($imgUrl, '.webm')) {
                        $xml .= "    <image:image>\n";
                        $xml .= "      <image:loc>" . htmlspecialchars($imgUrl) . "</image:loc>\n";
                        $xml .= "      <image:title>" . htmlspecialchars($prop->title) . "</image:title>\n";
                        if (!empty($img->caption)) {
                            $xml .= "      <image:caption>" . htmlspecialchars($img->caption) . "</image:caption>\n";
                        }
                        $xml .= "    </image:image>\n";
                    }
                }
            }

            // Attach Video if exists
            if (!empty($prop->video_url)) {
                $thumbUrl = $prop->video_thumbnail_url ?: ($prop->images->first()?->image_url ?: "{$siteUrl}/hero-poster.jpg");
                $xml .= "    <video:video>\n";
                $xml .= "      <video:thumbnail_loc>" . htmlspecialchars($thumbUrl) . "</video:thumbnail_loc>\n";
                $xml .= "      <video:title>" . htmlspecialchars("معاينة فيديو - " . $prop->title) . "</video:title>\n";
                $xml .= "      <video:description>" . htmlspecialchars(\Illuminate\Support\Str::limit($prop->description ?: $prop->title, 200)) . "</video:description>\n";
                $xml .= "      <video:content_loc>" . htmlspecialchars($prop->video_url) . "</video:content_loc>\n";
                $xml .= "      <video:publication_date>" . ($prop->created_at ? $prop->created_at->toAtomString() : now()->toAtomString()) . "</video:publication_date>\n";
                $xml .= "    </video:video>\n";
            }

            $xml .= "  </url>\n";
        }

        $xml .= "</urlset>\n";

        return $xml;
    }
}
