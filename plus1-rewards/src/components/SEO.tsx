// plus1-rewards/src/components/SEO.tsx
import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  robots?: 'index, follow' | 'noindex, nofollow';
  ogType?: string;
  ogImage?: string;
}

export default function SEO({
  title,
  description,
  keywords = '',
  canonical = '',
  robots = 'index, follow',
  ogType = 'website',
  ogImage = 'https://plus1rewards.com/thumbnail.png'
}: SEOProps) {
  useEffect(() => {
    // Update title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMetaTag = (selector: string, attribute: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (attribute === 'property') {
          element.setAttribute('property', selector.replace('meta[property="', '').replace('"]', ''));
        } else {
          element.setAttribute('name', selector.replace('meta[name="', '').replace('"]', ''));
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update canonical link
    const updateCanonical = (href: string) => {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Primary meta tags
    updateMetaTag('meta[name="title"]', 'name', title);
    updateMetaTag('meta[name="description"]', 'name', description);
    if (keywords) updateMetaTag('meta[name="keywords"]', 'name', keywords);
    updateMetaTag('meta[name="robots"]', 'name', robots);

    // Open Graph tags
    updateMetaTag('meta[property="og:type"]', 'property', ogType);
    updateMetaTag('meta[property="og:title"]', 'property', title);
    updateMetaTag('meta[property="og:description"]', 'property', description);
    updateMetaTag('meta[property="og:image"]', 'property', ogImage);
    updateMetaTag('meta[property="og:locale"]', 'property', 'en_ZA');
    if (canonical) updateMetaTag('meta[property="og:url"]', 'property', canonical);

    // Twitter tags
    updateMetaTag('meta[property="twitter:card"]', 'property', 'summary_large_image');
    updateMetaTag('meta[property="twitter:title"]', 'property', title);
    updateMetaTag('meta[property="twitter:description"]', 'property', description);
    updateMetaTag('meta[property="twitter:image"]', 'property', ogImage);
    if (canonical) updateMetaTag('meta[property="twitter:url"]', 'property', canonical);

    // Canonical link
    if (canonical) updateCanonical(canonical);
  }, [title, description, keywords, canonical, robots, ogType, ogImage]);

  return null;
}
