import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
}

const defaultSEO = {
  title: 'Plus1 Rewards | Earn Cashback Toward Medical Cover',
  description: 'Shop at partner stores and earn real cashback that funds your medical cover. Plus1 Rewards makes healthcare accessible for everyone in South Africa.',
  keywords: 'medical cover South Africa, cashback rewards, healthcare funding, Day1Health, affordable medical insurance, shop and earn, partner stores SA, medical cover cashback',
  image: 'https://plus1rewards.com/thumbnail.png',
  type: 'website'
};

export default function SEO({ 
  title, 
  description, 
  keywords, 
  image, 
  type = 'website',
  noindex = false 
}: SEOProps) {
  const location = useLocation();
  const currentUrl = `https://plus1rewards.com${location.pathname}`;

  const seoTitle = title || defaultSEO.title;
  const seoDescription = description || defaultSEO.description;
  const seoKeywords = keywords || defaultSEO.keywords;
  const seoImage = image || defaultSEO.image;

  useEffect(() => {
    // Update document title
    document.title = seoTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', seoDescription);
    updateMetaTag('keywords', seoKeywords);
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph tags
    updateMetaTag('og:title', seoTitle, true);
    updateMetaTag('og:description', seoDescription, true);
    updateMetaTag('og:image', seoImage, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:locale', 'en_ZA', true);
    updateMetaTag('og:site_name', 'Plus1 Rewards', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seoTitle);
    updateMetaTag('twitter:description', seoDescription);
    updateMetaTag('twitter:image', seoImage);
    updateMetaTag('twitter:url', currentUrl);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

  }, [seoTitle, seoDescription, seoKeywords, seoImage, currentUrl, type, noindex]);

  return null;
}
