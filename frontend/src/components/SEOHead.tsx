import React, { useEffect } from 'react';
import { SITE_BASE_URL, DEFAULT_SITE_TITLE, DEFAULT_SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from '../utils/seo';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  robots?: 'index, follow' | 'noindex, nofollow' | 'noindex, follow' | 'index, nofollow';
  schema?: Record<string, any> | Array<Record<string, any>> | null;
  publishedTime?: string;
  modifiedTime?: string;
}

function updateMetaTag(attribute: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`meta[${attribute}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateCanonical(url: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = DEFAULT_SITE_TITLE,
  description = DEFAULT_SITE_DESCRIPTION,
  canonical,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  robots = 'index, follow',
  schema,
}) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Title
    document.title = title;

    // 2. Standard Meta
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'robots', robots);

    // 3. Canonical URL
    const canonicalUrl = canonical || (typeof window !== 'undefined' ? `${SITE_BASE_URL}${window.location.pathname}` : SITE_BASE_URL);
    updateCanonical(canonicalUrl);

    // 4. Open Graph Tags
    updateMetaTag('property', 'og:site_name', 'سكني');
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'og:image', image);
    updateMetaTag('property', 'og:type', type);
    updateMetaTag('property', 'og:locale', 'ar_EG');

    // 5. Twitter Card Tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', image);

    // 6. JSON-LD Structured Data
    // Remove previous dynamic schemas
    const existingScripts = document.querySelectorAll('script[data-sakani-seo="true"]');
    existingScripts.forEach(el => el.remove());

    if (schema) {
      const schemasArray = Array.isArray(schema) ? schema : [schema];
      schemasArray.filter(Boolean).forEach((sObj, idx) => {
        try {
          const script = document.createElement('script');
          script.type = 'application/ld+json';
          script.setAttribute('data-sakani-seo', 'true');
          script.id = `sakani-jsonld-${idx}`;
          script.text = JSON.stringify(sObj);
          document.head.appendChild(script);
        } catch (e) {
          console.error('Failed to inject JSON-LD schema', e);
        }
      });
    }

    return () => {
      const cleanupScripts = document.querySelectorAll('script[data-sakani-seo="true"]');
      cleanupScripts.forEach(el => el.remove());
    };
  }, [title, description, canonical, image, type, robots, JSON.stringify(schema)]);

  return null;
};
