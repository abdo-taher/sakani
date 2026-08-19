<?php

namespace App\Services;

use App\Models\Property;
use App\Models\Location;
use App\Models\Setting;
use Illuminate\Support\Str;

class SeoMetaService
{
    /**
     * Inject dynamic SEO tags, Open Graph, Twitter cards, and JSON-LD schema into HTML
     */
    public function injectMeta(string $html, string $path): string
    {
        $siteUrl = rtrim(config('app.frontend_url', 'https://sakani.site'), '/');
        $cleanPath = '/' . ltrim($path, '/');
        
        $settings = Setting::all()->pluck('value', 'key');
        $siteName = $settings->get('site_name', 'سكني | عقارات دمياط الجديدة');
        $defaultDesc = 'منصة سكني العقارية الرائدة للبيع والشراء والإيجار وحجز الغرف في دمياط الجديدة والمناطق المميزة مع معاينات فورية وتجربة ذكية.';
        $defaultImage = "{$siteUrl}/hero-poster.jpg";

        $meta = [
            'title' => $siteName,
            'description' => $defaultDesc,
            'canonical' => "{$siteUrl}{$cleanPath}",
            'image' => $defaultImage,
            'type' => 'website',
            'robots' => 'index, follow',
            'schema' => [],
        ];

        // 1. Check for Admin or Private Routes
        if (str_starts_with($cleanPath, '/admin') || 
            str_starts_with($cleanPath, '/my-reservations') || 
            str_starts_with($cleanPath, '/customer')) {
            $meta['title'] = 'لوحة التحكم والخدمات الخاصة | سكني';
            $meta['robots'] = 'noindex, nofollow';
            return $this->applyMetaToHtml($html, $meta);
        }

        // 2. Check for Property Details Route (/properties/{idOrSlug})
        if (preg_match('#^/properties/([^/?]+)#', $cleanPath, $matches)) {
            $idOrSlug = urldecode($matches[1]);
            $property = $this->resolveProperty($idOrSlug);

            if ($property) {
                // If not approved or is uploading, set noindex
                if ($property->submission_status === 'pending_review' || $property->status === 'rejected' || $property->is_uploading) {
                    $meta['robots'] = 'noindex, nofollow';
                }

                $locName = $property->location?->name ?: 'دمياط الجديدة';
                $propType = $property->propertyType?->name ?: ($property->property_type === 'villa' ? 'فيلا' : 'شقة');
                $opName = $property->category?->name ?: ($property->operation_type === 'rent' ? 'للإيجار' : 'للبيع');
                $priceFormatted = $property->price ? number_format((float)$property->price) . ' ج.م' : 'للاستفسار';
                $areaText = $property->area ? " بمساحة {$property->area} م²" : '';
                $roomsText = $property->rooms ? "، {$property->rooms} غرف" : '';

                // Title & Description
                $meta['title'] = $property->seo_title ?: "{$property->title} - {$opName} في {$locName} | سكني";
                $meta['description'] = $property->seo_description ?: "{$propType} {$opName} في {$locName}{$areaText}{$roomsText} بسعر {$priceFormatted}. شاهد كافة الصور وفيديو المعاينة وتواصل مباشرة عبر منصة سكني.";
                $meta['canonical'] = $property->canonical_url;
                $meta['type'] = 'article';

                // Image
                $primaryImg = $property->images()->first();
                if ($primaryImg && !empty($primaryImg->image_url) && !str_contains($primaryImg->image_url, '.mp4')) {
                    $meta['image'] = $primaryImg->image_url;
                }

                // Build Structured Data (RealEstateListing + Accommodation + Breadcrumbs)
                $meta['schema'] = $this->buildPropertyJsonLd($property, $siteUrl);
            } else {
                $meta['title'] = 'العقار غير متوفر | سكني';
                $meta['robots'] = 'noindex, follow';
            }

            return $this->applyMetaToHtml($html, $meta);
        }

        // 3. Location / Places Routes (/places or /places/{slug})
        if (preg_match('#^/places/([^/?]+)#', $cleanPath, $matches) || preg_match('#^/locations/([^/?]+)#', $cleanPath, $matches)) {
            $locSlug = urldecode($matches[1]);
            $location = Location::where('slug', $locSlug)->orWhere('id', $locSlug)->first();

            if ($location) {
                $meta['title'] = "عقارات وشقق للإيجار والبيع في {$location->name} - دمياط الجديدة | سكني";
                $meta['description'] = "دليل عقارات {$location->name} بدمياط الجديدة. تصفح أفضل الشقق، الفيلات، المحلات وسكن الطلاب المتاح حالياً مع خطط الأسعار والمعاينات الفورية عبر سكني.";
                $meta['canonical'] = "{$siteUrl}/places/{$location->slug}";
                if ($location->image_url) {
                    $meta['image'] = $location->image_url;
                }
                $meta['schema'] = $this->buildLocationJsonLd($location, $siteUrl);
            }
            return $this->applyMetaToHtml($html, $meta);
        }

        // 4. Room Rental Discovery (/rooms-for-rent)
        if ($cleanPath === '/rooms-for-rent') {
            $meta['title'] = 'غرف للإيجار وسكن طلاب وشباب في دمياط الجديدة | سكني';
            $meta['description'] = 'تصفح قائمة الغرف المفروشة والمستقلة للإيجار الشهري في دمياط الجديدة بالقرب من جامعة حورس وجامعة دمياط. سكن طالبات وشباب بأفضل الأسعار.';
            $meta['canonical'] = "{$siteUrl}/rooms-for-rent";
            return $this->applyMetaToHtml($html, $meta);
        }

        // 5. Properties Catalog Landing (/properties)
        if ($cleanPath === '/properties') {
            $meta['title'] = 'عقارات للبيع والإيجار في دمياط الجديدة | سكني';
            $meta['description'] = 'ابحث في مئات العقارات الموثوقة والمفحوصة قانونياً في دمياط الجديدة. شقق، دوبلكس، فيلات، محلات تجارية بأسعار تنافسية.';
            $meta['canonical'] = "{$siteUrl}/properties";
            return $this->applyMetaToHtml($html, $meta);
        }

        // 6. Places Guide Landing (/places)
        if ($cleanPath === '/places') {
            $meta['title'] = 'أحياء ومناطق دمياط الجديدة - دليل السكن والاستثمار | سكني';
            $meta['description'] = 'استكشف أهم أحياء ومناطق دمياط الجديدة: المنطقة المركزية، منطقة 27، سكن مصر، دار مصر، والحي المتميز. دليلك الشامل لمتوسط الأسعار والخدمات.';
            $meta['canonical'] = "{$siteUrl}/places";
            return $this->applyMetaToHtml($html, $meta);
        }

        // 7. Sell / Add Property (/sell or /add-property)
        if ($cleanPath === '/sell' || $cleanPath === '/add-property') {
            $meta['title'] = 'أضف عقارك للبيع أو الإيجار مجاناً | سكني';
            $meta['description'] = 'اعرض شقتك، فيلتك أو محلك التجاري للبيع أو الإيجار أمام آلاف الباحثين عن عقارات في دمياط الجديدة مع تسويق احترافي وتوثيق قانوني.';
            $meta['canonical'] = "{$siteUrl}/sell";
            return $this->applyMetaToHtml($html, $meta);
        }

        // 8. Need Property (/need-property)
        if ($cleanPath === '/need-property') {
            $meta['title'] = 'اطلب عقارك بمواصفات خاصة | سكني';
            $meta['description'] = 'سجل متطلباتك وميزانيتك وسيقوم فريق المستشارين العقاريين في سكني بالبحث عن أفضل الخيارات المطابقة وتوفيرها خلال ساعات.';
            $meta['canonical'] = "{$siteUrl}/need-property";
            return $this->applyMetaToHtml($html, $meta);
        }

        // 9. Contact Us (/contact)
        if ($cleanPath === '/contact') {
            $meta['title'] = 'اتصل بنا - فريق الاستشارات وخدمة العملاء | سكني';
            $meta['description'] = 'تواصل مع فريق منصة سكني في دمياط الجديدة للحصول على استشارات عقارية مجانية، حجز مواعيد المعاينات، أو الاستفسارات العامة.';
            $meta['canonical'] = "{$siteUrl}/contact";
            return $this->applyMetaToHtml($html, $meta);
        }

        // 10. Default Home Page Schema
        $meta['schema'] = $this->buildGlobalOrganizationJsonLd($siteUrl, $settings);

        return $this->applyMetaToHtml($html, $meta);
    }

    /**
     * Resolve property from ID or slug
     */
    protected function resolveProperty(string $idOrSlug): ?Property
    {
        $numericId = null;
        if (is_numeric($idOrSlug)) {
            $numericId = (int)$idOrSlug;
        } elseif (preg_match('/^(\d+)-/u', $idOrSlug, $matches)) {
            $numericId = (int)$matches[1];
        } elseif (preg_match('/-(\d+)$/u', $idOrSlug, $matches)) {
            $numericId = (int)$matches[1];
        } elseif (preg_match('/^SK-(\d+)$/i', $idOrSlug, $matches)) {
            $numericId = (int)$matches[1];
        }

        if ($numericId) {
            $prop = Property::with(['category', 'propertyType', 'location', 'images'])->find($numericId);
            if ($prop) return $prop;
        }

        return Property::with(['category', 'propertyType', 'location', 'images'])
            ->where('slug', $idOrSlug)
            ->first();
    }

    /**
     * Build JSON-LD Structured Data for a Property
     */
    protected function buildPropertyJsonLd(Property $property, string $siteUrl): array
    {
        $locName = $property->location?->name ?: 'دمياط الجديدة';
        $images = $property->images->map(fn($img) => $img->image_url)->filter()->values()->all();
        if (empty($images)) {
            $images = ["{$siteUrl}/default-property.svg"];
        }

        $schemas = [];

        // RealEstateListing Schema
        $listingSchema = [
            '@context' => 'https://schema.org',
            '@type' => 'RealEstateListing',
            'name' => $property->title,
            'description' => $property->description ?: $property->title,
            'url' => $property->canonical_url,
            'datePosted' => $property->created_at ? $property->created_at->toIso8601String() : null,
            'dateModified' => $property->updated_at ? $property->updated_at->toIso8601String() : null,
            'image' => $images,
            'offers' => [
                '@type' => 'Offer',
                'price' => (float)$property->price,
                'priceCurrency' => 'EGP',
                'availability' => $property->status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
                'businessFunction' => $property->operation_type === 'rent' ? 'https://schema.org/LeaseOut' : 'https://schema.org/Sell',
            ],
            'about' => [
                '@type' => $property->has_detailed_rooms ? 'Room' : ($property->property_type === 'villa' ? 'SingleFamilyResidence' : 'Apartment'),
                'name' => $property->title,
                'numberOfRooms' => (int)$property->rooms,
                'numberOfBathroomsTotal' => (int)$property->bathrooms,
                'floorSize' => [
                    '@type' => 'QuantitativeValue',
                    'value' => (float)($property->area ?: 100),
                    'unitCode' => 'MTK',
                ],
                'address' => [
                    '@type' => 'PostalAddress',
                    'addressLocality' => $locName,
                    'addressRegion' => 'دمياط الجديدة',
                    'addressCountry' => 'EG',
                ],
            ],
        ];

        if ($property->latitude && $property->longitude) {
            $listingSchema['about']['geo'] = [
                '@type' => 'GeoCoordinates',
                'latitude' => (float)$property->latitude,
                'longitude' => (float)$property->longitude,
            ];
        }

        $schemas[] = $listingSchema;

        // Video Schema if property has video
        if (!empty($property->video_url)) {
            $schemas[] = [
                '@context' => 'https://schema.org',
                '@type' => 'VideoObject',
                'name' => "معاينة فيديو - {$property->title}",
                'description' => Str::limit($property->description ?: $property->title, 200),
                'thumbnailUrl' => $property->video_thumbnail_url ?: ($images[0] ?? "{$siteUrl}/hero-poster.jpg"),
                'uploadDate' => $property->created_at ? $property->created_at->toIso8601String() : now()->toIso8601String(),
                'contentUrl' => $property->video_url,
            ];
        }

        // BreadcrumbList Schema
        $schemas[] = [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => [
                [
                    '@type' => 'ListItem',
                    'position' => 1,
                    'name' => 'الرئيسية',
                    'item' => $siteUrl,
                ],
                [
                    '@type' => 'ListItem',
                    'position' => 2,
                    'name' => $property->operation_type === 'rent' ? 'شقق للإيجار' : 'عقارات للبيع',
                    'item' => "{$siteUrl}/properties?operation={$property->operation_type}",
                ],
                [
                    '@type' => 'ListItem',
                    'position' => 3,
                    'name' => $locName,
                    'item' => "{$siteUrl}/places/{$property->location_id}",
                ],
                [
                    '@type' => 'ListItem',
                    'position' => 4,
                    'name' => $property->title,
                    'item' => $property->canonical_url,
                ],
            ],
        ];

        return $schemas;
    }

    /**
     * Build JSON-LD Structured Data for a Location
     */
    protected function buildLocationJsonLd(Location $location, string $siteUrl): array
    {
        return [
            [
                '@context' => 'https://schema.org',
                '@type' => 'Place',
                'name' => "{$location->name} - دمياط الجديدة",
                'description' => "دليل عقارات وأسعار السكن في {$location->name} بمدينة دمياط الجديدة.",
                'url' => "{$siteUrl}/places/{$location->slug}",
                'address' => [
                    '@type' => 'PostalAddress',
                    'addressLocality' => $location->name,
                    'addressRegion' => 'دمياط الجديدة',
                    'addressCountry' => 'EG',
                ],
            ],
            [
                '@context' => 'https://schema.org',
                '@type' => 'BreadcrumbList',
                'itemListElement' => [
                    [
                        '@type' => 'ListItem',
                        'position' => 1,
                        'name' => 'الرئيسية',
                        'item' => $siteUrl,
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => 'دليل الأحياء والمناطق',
                        'item' => "{$siteUrl}/places",
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 3,
                        'name' => $location->name,
                        'item' => "{$siteUrl}/places/{$location->slug}",
                    ],
                ],
            ],
        ];
    }

    /**
     * Build Global Organization & WebSite JSON-LD
     */
    protected function buildGlobalOrganizationJsonLd(string $siteUrl, $settings): array
    {
        $phone = $settings->get('phone', '01067725976');
        $email = $settings->get('email', 'info@sakani.site');

        return [
            [
                '@context' => 'https://schema.org',
                '@type' => 'Organization',
                'name' => 'سكني',
                'alternateName' => 'Sakani Real Estate',
                'url' => $siteUrl,
                'logo' => "{$siteUrl}/favicon.svg",
                'contactPoint' => [
                    '@type' => 'ContactPoint',
                    'telephone' => "+2{$phone}",
                    'contactType' => 'customer service',
                    'areaServed' => 'EG',
                    'availableLanguage' => ['Arabic', 'English'],
                ],
                'sameAs' => array_values(array_filter([
                    $settings->get('facebook_url'),
                    $settings->get('instagram_url'),
                    $settings->get('tiktok_url'),
                ])),
            ],
            [
                '@context' => 'https://schema.org',
                '@type' => 'WebSite',
                'name' => 'سكني',
                'url' => $siteUrl,
                'potentialAction' => [
                    '@type' => 'SearchAction',
                    'target' => "{$siteUrl}/properties?q={search_term_string}",
                    'query-input' => 'required name=search_term_string',
                ],
            ],
        ];
    }

    /**
     * Replace meta tags in raw HTML
     */
    protected function applyMetaToHtml(string $html, array $meta): string
    {
        $escapedTitle = htmlspecialchars($meta['title'], ENT_QUOTES, 'UTF-8');
        $escapedDesc = htmlspecialchars($meta['description'], ENT_QUOTES, 'UTF-8');
        $escapedCanonical = htmlspecialchars($meta['canonical'], ENT_QUOTES, 'UTF-8');
        $escapedImage = htmlspecialchars($meta['image'], ENT_QUOTES, 'UTF-8');
        $escapedType = htmlspecialchars($meta['type'], ENT_QUOTES, 'UTF-8');
        $escapedRobots = htmlspecialchars($meta['robots'], ENT_QUOTES, 'UTF-8');

        // 1. Replace or insert <title>
        if (preg_match('/<title>.*?<\/title>/is', $html)) {
            $html = preg_replace('/<title>.*?<\/title>/is', "<title>{$escapedTitle}</title>", $html);
        } else {
            $html = str_replace('<head>', "<head>\n    <title>{$escapedTitle}</title>", $html);
        }

        // 2. Prepare dynamic meta bundle
        $metaTags = "\n";
        $metaTags .= "    <meta name=\"description\" content=\"{$escapedDesc}\" />\n";
        $metaTags .= "    <meta name=\"robots\" content=\"{$escapedRobots}\" />\n";
        $metaTags .= "    <link rel=\"canonical\" href=\"{$escapedCanonical}\" />\n";
        $metaTags .= "    <meta property=\"og:site_name\" content=\"سكني\" />\n";
        $metaTags .= "    <meta property=\"og:title\" content=\"{$escapedTitle}\" />\n";
        $metaTags .= "    <meta property=\"og:description\" content=\"{$escapedDesc}\" />\n";
        $metaTags .= "    <meta property=\"og:url\" content=\"{$escapedCanonical}\" />\n";
        $metaTags .= "    <meta property=\"og:image\" content=\"{$escapedImage}\" />\n";
        $metaTags .= "    <meta property=\"og:type\" content=\"{$escapedType}\" />\n";
        $metaTags .= "    <meta property=\"og:locale\" content=\"ar_EG\" />\n";
        $metaTags .= "    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n";
        $metaTags .= "    <meta name=\"twitter:title\" content=\"{$escapedTitle}\" />\n";
        $metaTags .= "    <meta name=\"twitter:description\" content=\"{$escapedDesc}\" />\n";
        $metaTags .= "    <meta name=\"twitter:image\" content=\"{$escapedImage}\" />\n";

        // JSON-LD Scripts
        if (!empty($meta['schema'])) {
            foreach ($meta['schema'] as $schemaObj) {
                $json = json_encode($schemaObj, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
                $metaTags .= "    <script type=\"application/ld+json\">\n{$json}\n    </script>\n";
            }
        }

        // Clean any existing description/canonical/og tags to avoid duplicates
        $html = preg_replace('/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i', '', $html);
        $html = preg_replace('/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i', '', $html);
        $html = preg_replace('/<meta\s+property="og:[^"]*"\s+content="[^"]*"\s*\/?>/i', '', $html);
        $html = preg_replace('/<meta\s+name="twitter:[^"]*"\s+content="[^"]*"\s*\/?>/i', '', $html);

        // Inject new tags right before </head>
        $html = str_replace('</head>', "{$metaTags}\n  </head>", $html);

        return $html;
    }
}
