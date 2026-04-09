# Image Optimization Guide

## Current Issues (from Lighthouse)

### Critical - Large Images
1. **Hero Image** (`/background hero section.png`)
   - Current: 2,345 KB (2.3 MB)
   - Target: < 300 KB
   - Savings: 2,219 KB (94% reduction)

2. **Logo** (`/logo.png`)
   - Current: 190 KB
   - Target: < 20 KB
   - Savings: 178 KB (94% reduction)

3. **Day1Health Logo** (`/day1health-logo.jpg`)
   - Current: 62 KB
   - Target: < 10 KB
   - Savings: 61 KB (98% reduction)

**Total Potential Savings: 2,752 KB (2.7 MB)**

---

## Solution: Convert to WebP

### Why WebP?
- 25-35% smaller than PNG
- 25-34% smaller than JPEG
- Supports transparency (like PNG)
- Supported by 97% of browsers

---

## Step-by-Step Optimization

### Option 1: Online Tools (Easiest)

1. **Squoosh** (https://squoosh.app/)
   - Upload image
   - Select WebP format
   - Adjust quality (80-85 recommended)
   - Download optimized image

2. **TinyPNG** (https://tinypng.com/)
   - Upload PNG/JPG
   - Automatically optimizes
   - Download result

### Option 2: Command Line (Recommended for Batch)

```bash
# Install sharp (if not already installed)
npm install -D sharp-cli

# Convert hero image
npx sharp -i "public/background hero section.png" -o "public/background-hero-section.webp" -f webp --quality 85

# Convert logo
npx sharp -i "public/logo.png" -o "public/logo.webp" -f webp --quality 90

# Convert Day1Health logo
npx sharp -i "public/day1health-logo.jpg" -o "public/day1health-logo.webp" -f webp --quality 85
```

### Option 3: Automated Script

Create `scripts/optimize-images.js`:

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const images = [
  {
    input: 'public/background hero section.png',
    output: 'public/background-hero-section.webp',
    quality: 85,
    resize: { width: 1920, height: 1080, fit: 'cover' }
  },
  {
    input: 'public/logo.png',
    output: 'public/logo.webp',
    quality: 90,
    resize: { width: 586, height: 227, fit: 'contain' }
  },
  {
    input: 'public/day1health-logo.jpg',
    output: 'public/day1health-logo.webp',
    quality: 85,
    resize: { width: 525, height: 475, fit: 'contain' }
  }
];

async function optimizeImages() {
  for (const img of images) {
    try {
      await sharp(img.input)
        .resize(img.resize)
        .webp({ quality: img.quality })
        .toFile(img.output);
      
      const originalSize = fs.statSync(img.input).size;
      const optimizedSize = fs.statSync(img.output).size;
      const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      
      console.log(`✅ ${path.basename(img.output)}`);
      console.log(`   Original: ${(originalSize / 1024).toFixed(0)} KB`);
      console.log(`   Optimized: ${(optimizedSize / 1024).toFixed(0)} KB`);
      console.log(`   Savings: ${savings}%\n`);
    } catch (error) {
      console.error(`❌ Error optimizing ${img.input}:`, error.message);
    }
  }
}

optimizeImages();
```

Run with:
```bash
node scripts/optimize-images.js
```

---

## Update Code to Use WebP

### Use `<picture>` Element for Fallback

```tsx
// Before
<img src="/logo.png" alt="+1 Rewards" />

// After
<picture>
  <source srcSet="/logo.webp" type="image/webp" />
  <img src="/logo.png" alt="+1 Rewards" width="413" height="160" />
</picture>
```

### Hero Image Example

```tsx
// In Hero.tsx
<picture>
  <source 
    srcSet="/background-hero-section.webp" 
    type="image/webp" 
  />
  <img
    alt="Diverse South African community interaction"
    className="w-full h-full object-cover"
    src="/background hero section.png"
    width="1920"
    height="1080"
    fetchpriority="high"
  />
</picture>
```

---

## Expected Results After Optimization

### Before
- Total image size: 2,809 KB
- LCP: 3.8s
- Performance score: ~85

### After
- Total image size: ~300 KB (89% reduction)
- LCP: ~2.0s (47% improvement)
- Performance score: ~95

---

## Responsive Images (Bonus)

For even better performance, serve different sizes:

```tsx
<picture>
  <source 
    media="(max-width: 768px)"
    srcSet="/background-hero-section-mobile.webp"
    type="image/webp"
  />
  <source 
    srcSet="/background-hero-section.webp"
    type="image/webp"
  />
  <img
    src="/background hero section.png"
    alt="Hero"
    width="1920"
    height="1080"
    fetchpriority="high"
  />
</picture>
```

---

## Quick Win Checklist

- [ ] Convert hero image to WebP (saves 2.2 MB)
- [ ] Convert logo to WebP (saves 178 KB)
- [ ] Convert Day1Health logo to WebP (saves 61 KB)
- [ ] Update image references in code
- [ ] Add width/height to all images (done ✅)
- [ ] Test in multiple browsers
- [ ] Verify LCP improvement

---

## Tools & Resources

- **Squoosh**: https://squoosh.app/
- **TinyPNG**: https://tinypng.com/
- **Sharp**: https://sharp.pixelplumbing.com/
- **WebP Browser Support**: https://caniuse.com/webp
- **Image Optimization Guide**: https://web.dev/fast/#optimize-your-images

---

## Automation for Future Images

Add to `package.json`:

```json
{
  "scripts": {
    "optimize-images": "node scripts/optimize-images.js",
    "prebuild": "npm run optimize-images"
  }
}
```

This will automatically optimize images before each build.

---

## Priority Order

1. **Hero image** (biggest impact - 2.2 MB savings)
2. **Logo** (used on every page - 178 KB savings)
3. **Day1Health logo** (61 KB savings)
4. **Other images** (as needed)

---

## Testing

After optimization:

```bash
npm run build
npm run preview
```

Then run Lighthouse and verify:
- LCP < 2.5s ✅
- Image delivery score improved ✅
- Total page size reduced ✅
