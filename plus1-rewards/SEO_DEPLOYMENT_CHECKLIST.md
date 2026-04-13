# SEO Deployment Checklist

Use this checklist after deploying Plus1 Rewards to production.

## Pre-Deployment ✅

- [x] Run `npm run validate-seo` - All checks pass
- [x] Verify robots.txt is accessible
- [x] Verify sitemap.xml is accessible
- [x] Test structured data with Schema validator
- [x] Check all meta tags in index.html
- [x] Verify manifest.json is valid
- [x] Test SEO component on landing page
- [x] Ensure no console errors

## Immediate Post-Deployment (Day 1)

### 1. Verify Files Are Accessible
- [ ] Visit `https://plus1rewards.com/robots.txt`
  - Should show robots.txt content
  - Should NOT return 404
- [ ] Visit `https://plus1rewards.com/sitemap.xml`
  - Should show XML sitemap
  - Should NOT return 404
- [ ] Visit `https://plus1rewards.com/manifest.json`
  - Should show JSON manifest
  - Should NOT return 404

### 2. Test Structured Data
- [ ] Go to [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Enter: `https://plus1rewards.com`
- [ ] Verify these schemas are detected:
  - [ ] Organization
  - [ ] WebSite
  - [ ] Service
  - [ ] FAQPage (if FAQ is visible)
- [ ] Fix any errors shown

### 3. Test Meta Tags
- [ ] View page source of `https://plus1rewards.com`
- [ ] Verify these tags exist:
  - [ ] `<title>` tag with "Plus1 Rewards"
  - [ ] `<meta name="description">` with full description
  - [ ] `<meta property="og:title">` for Open Graph
  - [ ] `<meta property="og:image">` with thumbnail URL
  - [ ] `<meta property="twitter:card">` for Twitter
  - [ ] `<link rel="canonical">` with correct URL
  - [ ] `<script type="application/ld+json">` with structured data

### 4. Test Social Sharing
- [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
  - Enter: `https://plus1rewards.com`
  - Verify image, title, description appear correctly
  - Click "Scrape Again" if needed
- [ ] [Twitter Card Validator](https://cards-dev.twitter.com/validator)
  - Enter: `https://plus1rewards.com`
  - Verify card preview looks good
- [ ] [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
  - Enter: `https://plus1rewards.com`
  - Verify preview is correct

### 5. Run Lighthouse Audit
- [ ] Open Chrome DevTools (F12)
- [ ] Go to "Lighthouse" tab
- [ ] Select "SEO" category
- [ ] Run audit
- [ ] Aim for score of 90+
- [ ] Fix any issues found

## Week 1 Tasks

### 1. Submit to Google Search Console
- [ ] Go to [Google Search Console](https://search.google.com/search-console)
- [ ] Click "Add Property"
- [ ] Enter: `https://plus1rewards.com`
- [ ] Choose verification method:
  - [ ] Option A: DNS verification (recommended)
  - [ ] Option B: HTML file upload
  - [ ] Option C: HTML tag in `<head>`
- [ ] Complete verification
- [ ] Submit sitemap:
  - [ ] Go to "Sitemaps" section
  - [ ] Enter: `https://plus1rewards.com/sitemap.xml`
  - [ ] Click "Submit"
- [ ] Wait 24-48 hours for initial crawl

### 2. Submit to Bing Webmaster Tools
- [ ] Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [ ] Sign in with Microsoft account
- [ ] Click "Add a site"
- [ ] Enter: `https://plus1rewards.com`
- [ ] Verify ownership (similar to Google)
- [ ] Submit sitemap: `https://plus1rewards.com/sitemap.xml`

### 3. Set Up Google Analytics (Optional)
- [ ] Create Google Analytics 4 property
- [ ] Add tracking code to index.html
- [ ] Verify tracking is working
- [ ] Set up conversion goals

### 4. Monitor Initial Indexing
- [ ] Check Google Search Console daily
- [ ] Look for "Coverage" report
- [ ] Verify pages are being indexed
- [ ] Fix any crawl errors

## Week 2-4 Tasks

### 1. Check Indexing Status
- [ ] Google search: `site:plus1rewards.com`
  - Should show indexed pages
  - Note: May take 1-2 weeks
- [ ] Bing search: `site:plus1rewards.com`
  - Should show indexed pages

### 2. Monitor Search Console
- [ ] Check "Performance" report
- [ ] Review search queries
- [ ] Check click-through rates
- [ ] Identify top-performing pages

### 3. Test Rich Snippets
- [ ] Search for "Plus1 Rewards" on Google
- [ ] Look for rich snippets (FAQ, ratings, etc.)
- [ ] Note: May take 2-4 weeks to appear

### 4. Verify AI Agent Access
- [ ] Ask ChatGPT: "What is Plus1 Rewards?"
  - Should provide accurate information
  - Note: May take weeks for AI training
- [ ] Ask Claude: "Tell me about Plus1 Rewards"
  - Should understand the service
- [ ] Ask Gemini: "How does Plus1 Rewards work?"
  - Should explain the cashback system

## Monthly Maintenance

### Update Sitemap
- [ ] Open `public/sitemap.xml`
- [ ] Update `<lastmod>` dates to current month
- [ ] Add any new public pages
- [ ] Resubmit to Google Search Console
- [ ] Resubmit to Bing Webmaster Tools

### Review Performance
- [ ] Check Google Search Console
  - [ ] Total clicks
  - [ ] Total impressions
  - [ ] Average CTR
  - [ ] Average position
- [ ] Identify improvement opportunities
- [ ] Update meta descriptions if CTR is low

### Content Updates
- [ ] Review and update FAQ answers
- [ ] Check if pricing has changed
- [ ] Update keywords based on search queries
- [ ] Add new content if needed

### Technical Checks
- [ ] Run `npm run validate-seo`
- [ ] Check for broken links
- [ ] Verify all images have alt text
- [ ] Test page load speed
- [ ] Check mobile responsiveness

## Quarterly Tasks

### Deep SEO Audit
- [ ] Run full Lighthouse audit
- [ ] Check all pages for SEO issues
- [ ] Review and update meta descriptions
- [ ] Analyze competitor SEO
- [ ] Update keyword strategy

### Content Strategy
- [ ] Consider adding blog section
- [ ] Create new landing pages for keywords
- [ ] Add more structured data types
- [ ] Create video content (if applicable)

### Link Building
- [ ] Reach out to healthcare blogs
- [ ] Submit to relevant directories
- [ ] Partner with complementary services
- [ ] Create shareable content

## Troubleshooting

### Pages Not Indexed
1. Check robots.txt isn't blocking
2. Verify sitemap is submitted
3. Check for noindex tags
4. Request indexing in Search Console
5. Wait 2-4 weeks

### No Rich Snippets
1. Validate structured data
2. Ensure FAQ schema is correct
3. Check for errors in Search Console
4. Wait 2-4 weeks for Google to process

### Low Rankings
1. Add more quality content
2. Improve page speed
3. Build backlinks
4. Optimize for mobile
5. Target long-tail keywords

### AI Agents Don't Know About Site
1. Verify robots.txt allows AI bots
2. Check structured data is valid
3. Ensure site is indexed by Google
4. Wait for AI model updates (can take months)

## Success Metrics

### Week 1
- [ ] Site indexed by Google
- [ ] Sitemap processed
- [ ] No crawl errors

### Month 1
- [ ] 10+ pages indexed
- [ ] Appearing in search results
- [ ] 100+ impressions in Search Console

### Month 3
- [ ] 500+ impressions
- [ ] 50+ clicks
- [ ] Rich snippets appearing
- [ ] Ranking for brand name

### Month 6
- [ ] 2,000+ impressions
- [ ] 200+ clicks
- [ ] Ranking for target keywords
- [ ] AI agents can answer questions

## Resources

### Validation Tools
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

### Monitoring Tools
- [Google Search Console](https://search.google.com/search-console)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [Google Analytics](https://analytics.google.com/)

### Learning Resources
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Schema.org Documentation](https://schema.org/)
- [Moz Beginner's Guide to SEO](https://moz.com/beginners-guide-to-seo)

## Notes

- SEO is a long-term strategy - results take 3-6 months
- Focus on quality content and user experience
- Keep meta tags and structured data up to date
- Monitor Search Console weekly
- Be patient with AI agent training

---

**Deployment Date**: _____________  
**Completed By**: _____________  
**Next Review Date**: _____________

---

**Status Tracking**

| Task | Status | Date | Notes |
|------|--------|------|-------|
| Pre-deployment validation | ✅ | 2026-04-13 | All checks passed |
| Files accessible | ⏳ | | After deployment |
| Structured data tested | ⏳ | | After deployment |
| Google Search Console | ⏳ | | Week 1 |
| Bing Webmaster Tools | ⏳ | | Week 1 |
| Initial indexing | ⏳ | | Week 2-4 |
| Rich snippets | ⏳ | | Month 1-2 |
| AI agent awareness | ⏳ | | Month 3-6 |

---

**Last Updated**: 2026-04-13
