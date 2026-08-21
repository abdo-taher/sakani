import { Property, LocationDistrict, SystemSettings } from '../types';
import { resolveImageUrl, FALLBACK_PROPERTY_IMAGE } from './media';

export const SITE_BASE_URL = 'https://sakani.site';
export const DEFAULT_SITE_TITLE = 'سكني | شقق للإيجار وغرف وعقارات في دمياط الجديدة';
export const DEFAULT_SITE_DESCRIPTION = 'منصة سكني - بوابتك للبحث عن شقق للإيجار، غرف وسكن طلاب وطالبات، وعقارات للبيع في دمياط الجديدة مع معاينات موثقة واستشارات عقارية مجانية.';
export const DEFAULT_OG_IMAGE = `${SITE_BASE_URL}/hero-poster.jpg`;

/**
 * Generate clean Arabic/readable slug for a property
 */
export function generatePropertySlug(property: Property): string {
  if (!property) return '';
  const title = property.title || '';
  const cleanTitle = title
    .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
  
  const id = property.id || '';
  return cleanTitle ? `${id}-${cleanTitle}` : String(id);
}

/**
 * Generate full canonical URL for a property
 */
export function generatePropertyCanonicalUrl(property: Property): string {
  if (!property) return `${SITE_BASE_URL}/properties`;
  const slug = generatePropertySlug(property);
  return `${SITE_BASE_URL}/properties/${encodeURIComponent(slug)}`;
}

/**
 * Generate SEO-friendly dynamic title for a property
 */
export function generatePropertyTitle(property: Property): string {
  if (!property) return DEFAULT_SITE_TITLE;
  const opName = property.operation_type === 'rent' ? 'للإيجار' : 'للبيع';
  const locName = property.district_name || 'دمياط الجديدة';
  const roomsText = property.rooms ? ` - ${property.rooms} غرف` : '';
  return `${property.title} | ${opName} في ${locName}${roomsText} - سكني`;
}

/**
 * Generate SEO-friendly dynamic description for a property
 */
export function generatePropertyDescription(property: Property): string {
  if (!property) return DEFAULT_SITE_DESCRIPTION;
  const opName = property.operation_type === 'rent' ? 'للإيجار' : 'للبيع';
  const locName = property.district_name || 'دمياط الجديدة';
  const typeMap: Record<string, string> = {
    apartment: 'شقة',
    villa: 'فيلا',
    duplex: 'دوبلكس',
    penthouse: 'بنتهاوس',
    shop: 'محل تجاري',
    land: 'أرض',
    studio: 'ستوديو',
    chalet: 'شاليه',
  };
  const typeName = typeMap[property.property_type] || 'عقار';
  const areaText = property.operation_type !== 'rent' && property.area && Number(property.area) > 0 ? ` بمساحة ${property.area} م²` : '';
  const roomsText = property.rooms ? `، ${property.rooms} غرف` : '';
  const finishingText = property.finishing === 'super_lux' ? '، تشطيب سوبر لوكس' : '';
  const priceFormatted = property.price ? `${new Intl.NumberFormat('ar-EG').format(property.price)} ج.م` : 'للاستفسار';

  return `${typeName} ${opName} في ${locName}${areaText}${roomsText}${finishingText} بسعر ${priceFormatted}. تصفح الصور وفيديو المعاينة وتفاصيل الحجز المباشر عبر منصة سكني.`;
}

/**
 * Generate contextual image alt text
 */
export function generatePropertyAltText(property: Property, imageType?: string, index?: number): string {
  if (!property) return 'صورة عقار في دمياط الجديدة - سكني';
  const locName = property.district_name || 'دمياط الجديدة';
  const opName = property.operation_type === 'rent' ? 'للإيجار' : 'للبيع';
  
  const typeLabels: Record<string, string> = {
    living_room: 'غرفة المعيشة والريسبشن',
    bedroom: 'غرفة النوم الرئيسية',
    master_bedroom: 'غرفة النوم الماستر',
    bathroom: 'الحمام',
    kitchen: 'المطبخ',
    balcony: 'البلكونة والإطلالة',
    facade: 'واجهة المبنى والمدخل',
    floorplan: 'المخطط الهندسي',
  };

  const sectionName = (imageType && typeLabels[imageType]) ? ` - ${typeLabels[imageType]}` : (typeof index === 'number' && index > 0 ? ` - صورة ${index + 1}` : '');
  return `${property.title} ${opName} في ${locName}${sectionName}`;
}

/**
 * Build Schema.org RealEstateListing + Accommodation JSON-LD
 */
export function buildRealEstateListingSchema(property: Property) {
  if (!property) return null;
  const canonicalUrl = generatePropertyCanonicalUrl(property);
  const images = property.images && property.images.length > 0
    ? property.images.map(img => resolveImageUrl(img)).filter(Boolean)
    : [DEFAULT_OG_IMAGE];

  const locName = property.district_name || 'دمياط الجديدة';

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: generatePropertyDescription(property),
    url: canonicalUrl,
    datePosted: property.created_at || new Date().toISOString(),
    image: images,
    offers: {
      '@type': 'Offer',
      price: Number(property.price) || 0,
      priceCurrency: 'EGP',
      availability: property.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      businessFunction: property.operation_type === 'rent' ? 'https://schema.org/LeaseOut' : 'https://schema.org/Sell',
    },
    about: {
      '@type': property.has_detailed_rooms ? 'Room' : (property.property_type === 'villa' ? 'SingleFamilyResidence' : 'Apartment'),
      name: property.title,
      numberOfRooms: Number(property.rooms) || 1,
      numberOfBathroomsTotal: Number(property.bathrooms) || 1,
      ...(property.operation_type !== 'rent' && property.area && Number(property.area) > 0 ? {
        floorSize: {
          '@type': 'QuantitativeValue',
          value: Number(property.area),
          unitCode: 'MTK',
        },
      } : {}),
      address: {
        '@type': 'PostalAddress',
        addressLocality: locName,
        addressRegion: 'دمياط الجديدة',
        addressCountry: 'EG',
      },
    },
  };

  if (property.latitude && property.longitude) {
    schema.about.geo = {
      '@type': 'GeoCoordinates',
      latitude: property.latitude,
      longitude: property.longitude,
    };
  }

  return schema;
}

/**
 * Build Schema.org VideoObject JSON-LD
 */
export function buildVideoSchema(property: Property) {
  if (!property || !property.video_url) return null;
  const thumbUrl = property.video_thumbnail_url || (property.images?.[0] ? resolveImageUrl(property.images[0]) : DEFAULT_OG_IMAGE);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: `معاينة فيديو - ${property.title}`,
    description: generatePropertyDescription(property),
    thumbnailUrl: thumbUrl,
    uploadDate: property.created_at || new Date().toISOString(),
    contentUrl: property.video_url,
  };
}

/**
 * Build Schema.org BreadcrumbList JSON-LD
 */
export function buildBreadcrumbsSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_BASE_URL}${item.url}`,
    })),
  };
}

/**
 * Build Schema.org Organization + WebSite JSON-LD
 */
export function buildOrganizationSchema(settings?: SystemSettings) {
  const phone = settings?.phone || '01067725976';
  const email = settings?.email || 'info@sakani.site';

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'سكني',
      alternateName: 'Sakani Real Estate',
      url: SITE_BASE_URL,
      logo: `${SITE_BASE_URL}/favicon.svg`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: `+2${phone}`,
        contactType: 'customer service',
        areaServed: 'EG',
        availableLanguage: ['Arabic', 'English'],
      },
      sameAs: [
        settings?.facebook_url,
        settings?.instagram_url,
        settings?.tiktok_url,
      ].filter(Boolean),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'سكني',
      url: SITE_BASE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_BASE_URL}/properties?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

/**
 * Build Schema.org Place JSON-LD
 */
export function buildLocationSchema(district: LocationDistrict) {
  if (!district) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${district.name} - دمياط الجديدة`,
    description: district.description || `دليل ومواصفات السكن في ${district.name} بدمياط الجديدة.`,
    url: `${SITE_BASE_URL}/places/${encodeURIComponent(district.id)}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: district.name,
      addressRegion: 'دمياط الجديدة',
      addressCountry: 'EG',
    },
    ...(district.coordinates ? {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: district.coordinates.lat,
        longitude: district.coordinates.lng,
      }
    } : {}),
  };
}
