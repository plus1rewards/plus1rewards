# SEO Implementation Guide

## Overview

Plus1 Rewards has comprehensive SEO implementation to ensure maximum visibility in search engines and AI agent scraping (ChatGPT, Claude, Gemini, etc.).

## Components

### 1. Meta Tags (index.html)

Enhanced meta tags include:
- **Primary Meta Tags**: Title, description, keywords, robots directives
- **Open Graph Tags**: For social media sharing (Facebook, LinkedIn)
- **Twitter Card Tags**: For Twitter/X sharing
- **Geographic Tags**: Targeting South Africa
- **Mobile Tags**: PWA and mobile optimization

### 2. Structured Data (JSON-LD)

Implemented Schema.org structured data for AI agents:
- **Organization Schema**: Company information
- **WebSite Schema**: Site-wide information with search action
- **Service Schema**: Healthcare funding service details with pricing
- **FAQPage Schema**: Frequently asked questions for rich snippets

### 3. SEO Component (`src/components/SEO.tsx`)

Dynamic SEO component that:
- Updates page title and meta tags per route
- Manages canonical URLs
- Handles Open Graph and Twitter Card tags
- Supports noindex for private pages

Usage:
```tsx
<SEO
  title="Page Title"
  description="Page description"
  keywords="keyword1, keyword2"
  image="https://plus1rewards.com/image.png"
  noindex={false}
/>
```

### 4. Structured Data Components (`src/components/StructuredData.tsx`)

Reusable components for structured data:
- `<OrganizationSchema />` - Company info
- `<WebSiteSchema />` - Website info
- `<ServiceSchema />` - Service offerings
- `<FAQSchema faqs={[...]} />` - FAQ data

### 5. Robots.txt (`public/robots.txt`)

Configured to:
- Allow AI agents (GPTBot, ChatGPT-User, Claude-Web, anthropic-ai, Google-Extended, CCBot)
- Allow search engines (Googlebot, Bingbot, etc.)
- Block private areas (dashboards, admin)
- Allow public pages (landing, login, register, find-partner)
- Reference sitemap location

### 6. Sitemap (`public/sitemap.xml`)

XML sitemap with:
- Homepage (priority 1.0)
- Public authentication pages (priority 0.8)
- Role-specific login/register (priority 0.7)
- Legal pages (priority 0.5)
- Partner finder (priority 0.9)
- Image references
- Change frequency indicators

## Target Keywords

### Primary Keywords
- medical cover South Africa
- cashback rewards
- healthcare funding
- affordable medical insurance
- medical aid alternative

### Secondary Keywords
- Day1Health
- shop and earn
- partner stores SA
- medical cover cashback
- health insurance SA
- affordable healthcare South Africa

### Long-tail Keywords
- earn cashback toward medical cover
- shop and fund medical insurance
- affordable medical cover South Africa
- cashback healthcare funding platform

## AI Agent Optimization

### What AI Agents Can Learn

AI agents scraping the site will understand:

1. **What Plus1 Rewards Is**
   - Healthcare funding platform
   - Cashback-based medical cover
   - South African market focus

2. **How It Works**
   - Shop at partner stores
   - Earn cashback (3-40%)
   - Cashback funds medical cover
   - Three plan tiers: R385, R390, R665/month

3. **User Roles**
   - Members: Earn cashback
   - Partners: Provide cashback
   - Agents: Recruit partners, earn 1% commission
   - Providers: Medical cover providers

4. **Key Features**
   - Offline capability
   - QR code identification
   - Real-time cashback allocation
   - Multi-plan management

### Structured Data Benefits

- **Rich Snippets**: FAQ answers appear in search results
- **Knowledge Graph**: Organization info in Google Knowledge Panel
- **Voice Search**: Optimized for voice assistants
- **AI Training**: Clear data structure for AI model training

## Page-Specific SEO

### Landing Page (/)
- Full structured data implementation
- FAQ schema for rich snippets
- Organization and service schemas
- Optimized for "medical cover South Africa" searches

### Authentication Pages
- Noindex on login/register (prevent duplicate content)
- Clear descriptions for each role
- Canonical URLs to prevent confusion

### Find Partner Page
- High priority in sitemap (0.9)
- Optimized for local search
- Geographic targeting

### Legal Pages
- Lower priority (0.5)
- Quarterly update frequency
- Required for trust signals

## Monitoring & Maintenance

### Regular Tasks

1. **Update Sitemap** (Monthly)
   - Add new public pages
   - Update lastmod dates
   - Verify all URLs are accessible

2. **Monitor Search Console** (Weekly)
   - Check indexing status
   - Review search queries
   - Fix crawl errors

3. **Update Structured Data** (Quarterly)
   - Verify schema validity
   - Update pricing if changed
   - Add new FAQ items

4. **Check Meta Tags** (Monthly)
   - Ensure all pages have unique titles
   - Verify descriptions are compelling
   - Update keywords based on performance

### Tools for Validation

- **Google Search Console**: Monitor indexing and performance
- **Google Rich Results Test**: Validate structured data
- **Schema.org Validator**: Check JSON-LD syntax
- **Lighthouse**: Audit SEO score
- **Screaming Frog**: Crawl site for issues

## Performance Optimization

SEO implementation includes:
- Preconnect to external resources
- Preload critical assets
- Lazy loading for below-fold content
- Optimized images with alt text
- Fast page load times (<3s)

## Mobile Optimization

- Responsive design
- Mobile-first approach
- Touch-friendly UI
- PWA capabilities
- Offline functionality

## Local SEO

Targeting South Africa:
- `geo.region` meta tag: ZA
- `og:locale`: en_ZA
- Address in Organization schema
- Area served: South Africa

## Content Strategy

### For Search Engines
- Clear, descriptive headings
- Keyword-rich content
- Internal linking
- Regular content updates

### For AI Agents
- Structured data for easy parsing
- Clear service descriptions
- Pricing transparency
- FAQ for common queries

## Future Enhancements

1. **Blog/Content Section**
   - Healthcare tips
   - Partner spotlights
   - Member success stories
   - SEO-optimized articles

2. **Video Content**
   - How-it-works videos
   - Video schema markup
   - YouTube integration

3. **Reviews/Testimonials**
   - Review schema markup
   - Star ratings
   - User testimonials

4. **Local Business Listings**
   - Google My Business
   - Local directories
   - Partner location pages

5. **Multilingual Support**
   - Afrikaans version
   - Hreflang tags
   - Language switcher

## Compliance

- GDPR-compliant meta tags
- Privacy policy linked
- Terms of service linked
- Cookie consent (if needed)

## Contact for SEO Issues

If you notice SEO issues:
1. Check Google Search Console
2. Validate structured data
3. Review robots.txt
4. Verify sitemap is accessible
5. Test with Lighthouse

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

---

**Last Updated**: 2026-04-13  
**Version**: 1.0
