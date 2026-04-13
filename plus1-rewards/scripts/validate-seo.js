#!/usr/bin/env node

/**
 * SEO Validation Script
 * Validates SEO implementation for Plus1 Rewards
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description} exists`, 'green');
    return true;
  } else {
    log(`✗ ${description} missing`, 'red');
    return false;
  }
}

function validateRobotsTxt() {
  log('\n=== Validating robots.txt ===', 'cyan');
  const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
  
  if (!fs.existsSync(robotsPath)) {
    log('✗ robots.txt not found', 'red');
    return false;
  }

  const content = fs.readFileSync(robotsPath, 'utf-8');
  const checks = [
    { pattern: /User-agent: \*/i, desc: 'User-agent wildcard' },
    { pattern: /Sitemap:/i, desc: 'Sitemap reference' },
    { pattern: /GPTBot/i, desc: 'GPTBot allowed' },
    { pattern: /Claude-Web/i, desc: 'Claude-Web allowed' },
    { pattern: /anthropic-ai/i, desc: 'Anthropic AI allowed' },
    { pattern: /Disallow: \/admin\//i, desc: 'Admin blocked' },
    { pattern: /Disallow: \/member\//i, desc: 'Member area blocked' }
  ];

  let allPassed = true;
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log(`  ✓ ${check.desc}`, 'green');
    } else {
      log(`  ✗ ${check.desc}`, 'red');
      allPassed = false;
    }
  });

  return allPassed;
}

function validateSitemap() {
  log('\n=== Validating sitemap.xml ===', 'cyan');
  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  
  if (!fs.existsSync(sitemapPath)) {
    log('✗ sitemap.xml not found', 'red');
    return false;
  }

  const content = fs.readFileSync(sitemapPath, 'utf-8');
  const checks = [
    { pattern: /<urlset/i, desc: 'Valid XML structure' },
    { pattern: /<loc>https:\/\/plus1rewards\.com\/<\/loc>/i, desc: 'Homepage URL' },
    { pattern: /<priority>1\.0<\/priority>/i, desc: 'Homepage priority' },
    { pattern: /<changefreq>/i, desc: 'Change frequency set' },
    { pattern: /<lastmod>/i, desc: 'Last modified dates' }
  ];

  let allPassed = true;
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log(`  ✓ ${check.desc}`, 'green');
    } else {
      log(`  ✗ ${check.desc}`, 'red');
      allPassed = false;
    }
  });

  // Count URLs
  const urlCount = (content.match(/<url>/g) || []).length;
  log(`  ℹ ${urlCount} URLs in sitemap`, 'blue');

  return allPassed;
}

function validateIndexHtml() {
  log('\n=== Validating index.html ===', 'cyan');
  const indexPath = path.join(__dirname, '..', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    log('✗ index.html not found', 'red');
    return false;
  }

  const content = fs.readFileSync(indexPath, 'utf-8');
  const checks = [
    { pattern: /<title>.*Plus1 Rewards.*<\/title>/i, desc: 'Page title' },
    { pattern: /<meta name="description"/i, desc: 'Meta description' },
    { pattern: /<meta name="keywords"/i, desc: 'Meta keywords' },
    { pattern: /<meta property="og:title"/i, desc: 'Open Graph title' },
    { pattern: /<meta property="og:description"/i, desc: 'Open Graph description' },
    { pattern: /<meta property="og:image"/i, desc: 'Open Graph image' },
    { pattern: /<meta property="twitter:card"/i, desc: 'Twitter card' },
    { pattern: /<link rel="canonical"/i, desc: 'Canonical URL' },
    { pattern: /<script type="application\/ld\+json">/i, desc: 'Structured data (JSON-LD)' },
    { pattern: /@type.*Organization/i, desc: 'Organization schema' },
    { pattern: /@type.*WebSite/i, desc: 'WebSite schema' },
    { pattern: /@type.*Service/i, desc: 'Service schema' }
  ];

  let allPassed = true;
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      log(`  ✓ ${check.desc}`, 'green');
    } else {
      log(`  ✗ ${check.desc}`, 'red');
      allPassed = false;
    }
  });

  return allPassed;
}

function validateManifest() {
  log('\n=== Validating manifest.json ===', 'cyan');
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    log('✗ manifest.json not found', 'red');
    return false;
  }

  try {
    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const checks = [
      { key: 'name', desc: 'App name' },
      { key: 'short_name', desc: 'Short name' },
      { key: 'description', desc: 'Description' },
      { key: 'start_url', desc: 'Start URL' },
      { key: 'theme_color', desc: 'Theme color' },
      { key: 'background_color', desc: 'Background color' },
      { key: 'icons', desc: 'Icons array' }
    ];

    let allPassed = true;
    checks.forEach(check => {
      if (content[check.key]) {
        log(`  ✓ ${check.desc}`, 'green');
      } else {
        log(`  ✗ ${check.desc}`, 'red');
        allPassed = false;
      }
    });

    return allPassed;
  } catch (error) {
    log(`✗ Invalid JSON: ${error.message}`, 'red');
    return false;
  }
}

function validateComponents() {
  log('\n=== Validating SEO Components ===', 'cyan');
  const components = [
    { path: 'src/components/SEO.tsx', desc: 'SEO component' },
    { path: 'src/components/StructuredData.tsx', desc: 'Structured data component' }
  ];

  let allPassed = true;
  components.forEach(component => {
    if (!checkFile(component.path, component.desc)) {
      allPassed = false;
    }
  });

  return allPassed;
}

function generateReport() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   Plus1 Rewards SEO Validation Report  ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');

  const results = {
    robotsTxt: validateRobotsTxt(),
    sitemap: validateSitemap(),
    indexHtml: validateIndexHtml(),
    manifest: validateManifest(),
    components: validateComponents()
  };

  log('\n=== Summary ===', 'cyan');
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  if (passed === total) {
    log(`\n✓ All checks passed! (${passed}/${total})`, 'green');
    log('\nYour SEO implementation is complete and ready for deployment.', 'green');
  } else {
    log(`\n⚠ ${passed}/${total} checks passed`, 'yellow');
    log('\nPlease fix the issues above before deployment.', 'yellow');
  }

  log('\n=== Next Steps ===', 'blue');
  log('1. Submit sitemap to Google Search Console', 'blue');
  log('2. Validate structured data with Google Rich Results Test', 'blue');
  log('3. Test with Lighthouse for SEO score', 'blue');
  log('4. Monitor indexing status in Search Console', 'blue');
  log('5. Update sitemap monthly with new pages\n', 'blue');

  return passed === total;
}

// Run validation
const success = generateReport();
process.exit(success ? 0 : 1);
