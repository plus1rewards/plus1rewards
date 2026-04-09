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
    resize: { width: 586, height: 227, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }
  },
  {
    input: 'public/day1health-logo.jpg',
    output: 'public/day1health-logo.webp',
    quality: 85,
    resize: { width: 525, height: 475, fit: 'contain' }
  }
];

async function optimizeImages() {
  console.log('🖼️  Starting image optimization...\n');
  
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  
  for (const img of images) {
    try {
      // Check if input file exists
      if (!fs.existsSync(img.input)) {
        console.log(`⚠️  Skipping ${img.input} (file not found)\n`);
        continue;
      }
      
      await sharp(img.input)
        .resize(img.resize)
        .webp({ quality: img.quality })
        .toFile(img.output);
      
      const originalSize = fs.statSync(img.input).size;
      const optimizedSize = fs.statSync(img.output).size;
      const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      
      totalOriginalSize += originalSize;
      totalOptimizedSize += optimizedSize;
      
      console.log(`✅ ${path.basename(img.output)}`);
      console.log(`   Original: ${(originalSize / 1024).toFixed(0)} KB`);
      console.log(`   Optimized: ${(optimizedSize / 1024).toFixed(0)} KB`);
      console.log(`   Savings: ${savings}%\n`);
    } catch (error) {
      console.error(`❌ Error optimizing ${img.input}:`, error.message);
    }
  }
  
  if (totalOriginalSize > 0) {
    const totalSavings = ((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1);
    console.log('📊 Total Results:');
    console.log(`   Original: ${(totalOriginalSize / 1024).toFixed(0)} KB`);
    console.log(`   Optimized: ${(totalOptimizedSize / 1024).toFixed(0)} KB`);
    console.log(`   Total Savings: ${totalSavings}% (${((totalOriginalSize - totalOptimizedSize) / 1024).toFixed(0)} KB)\n`);
    console.log('✨ Image optimization complete!');
  }
}

optimizeImages().catch(console.error);
