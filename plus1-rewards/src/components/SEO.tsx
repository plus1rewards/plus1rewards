import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
  ogUrl?: string; // override og:url (used for blog posts to point to OG meta function)
}

const defaultSEO = {
  title: 'Plus1 Rewards | Earn Cashback Toward Medical Cover',
  description: 'Shop at partner stores and earn real cashback that funds your medical cover. Plus1 Rewards makes healthcare accessible for everyone in South Africa.',
  keywords: 'medical cover South Africa, cashback rewards, healthcare funding, Day1Health, affordable medical insurance, shop and earn, partner stores SA, medical cover cashback',
  image: 'https://plus1rewards.com/thumbnail.png',
  type: 'website'
};

export default function SEO({ title, description, keywords, image, type = 'website', noindex = false, ogUrl }: SEOProps) {
  const location = useLocation();
  const currentUrl = `https://plus1rewards.com${location.pathname}`;

  const seoTitle = title || defaultSEO.title;
  const seoDescription = description || defaultSEO.description;
  const seoKeywords = keywords || defaultSEO.keywords;
  const seoImage = image || defaultSEO.image;
  const shareUrl = ogUrl || currentUrl;

  useEffect(() => {
    document.title = seoTitle;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    setMeta('description', seoDescription);
    setMeta('keywords', seoKeywords);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph — use shareUrl so crawlers (WhatsApp, Twitter, LinkedIn) hit the OG function
    setMeta('og:title', seoTitle, true);
    setMeta('og:description', seoDescription, true);
    setMeta('og:image', seoImage, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:url', shareUrl, true);
    setMeta('og:type', type, true);
    setMeta('og:locale', 'en_ZA', true);
    setMeta('og:site_name', 'Plus1 Rewards', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', seoTitle);
    setMeta('twitter:description', seoDescription);
    setMeta('twitter:image', seoImage);
    setMeta('twitter:url', shareUrl);

    // Canonical always points to the real page URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical); }
    canonical.setAttribute('href', currentUrl);

  }, [seoTitle, seoDescription, seoKeywords, seoImage, currentUrl, shareUrl, type, noindex]);

  return null;
}
