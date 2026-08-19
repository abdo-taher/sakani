import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');

console.log('🧪 Starting Sakani Automated SEO & Search Visibility Test Suite...\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

// 1. Homepage SEO Verification (dist/index.html)
console.log('─── 1. Homepage SEO Audit (dist/index.html) ───');
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

assert(indexHtml.includes('<html lang="ar" dir="rtl">'), 'HTML contains lang="ar" and dir="rtl"');
assert(indexHtml.includes('<title>سكني | شقق للإيجار وغرف وعقارات في دمياط الجديدة</title>'), 'Homepage has exact, relevant <title>');
assert(indexHtml.includes('<meta name="description" content="منصة سكني - بوابتك للبحث عن شقق للإيجار، غرف وسكن طلاب وطالبات، وعقارات للبيع في دمياط الجديدة مع معاينات موثقة واستشارات عقارية مجانية." />'), 'Homepage has rich meta description');
assert(indexHtml.includes('<link rel="canonical" href="https://sakani.site/" />'), 'Homepage canonical uses production HTTPS host');

const h1Matches = indexHtml.match(/<h1[^>]*>.*?<\/h1>/gis) || [];
assert(h1Matches.length === 1, `Homepage has exactly 1 H1 heading (found: ${h1Matches.length})`);
assert(h1Matches[0] && h1Matches[0].includes('دور على شقة أو غرفة تناسب احتياجاتك في دمياط الجديدة'), 'H1 text matches target Arabic primary keyword');

const h2Matches = indexHtml.match(/<h2[^>]*>.*?<\/h2>/gis) || [];
assert(h2Matches.length >= 5, `Homepage has structured H2 hierarchy (found: ${h2Matches.length} H2 tags)`);

const wordCount = (indexHtml.replace(/<[^>]+>/g, ' ').match(/[\u0621-\u064A\w]+/g) || []).length;
assert(wordCount >= 300, `Homepage raw HTML contains substantial crawlable Arabic content (${wordCount} words)`);

const internalLinks = (indexHtml.match(/href="\/[a-zA-Z0-9_\-\?=&]*"/g) || []);
assert(internalLinks.length >= 10, `Homepage raw HTML contains crawlable internal links (found: ${internalLinks.length} links)`);

assert(indexHtml.includes('"@type": "Organization"') && indexHtml.includes('"@type": "WebSite"'), 'Homepage contains valid JSON-LD Organization and WebSite schema');


// 2. Public Pre-rendered Routes Audit
console.log('\n─── 2. Static Pre-rendered Landing Pages Audit ───');
const routes = ['rent', 'buy', 'rooms-for-rent', 'places', 'sell', 'need-property', 'contact'];

for (const route of routes) {
  const filePath = path.join(distDir, route, 'index.html');
  assert(fs.existsSync(filePath), `Route /${route} has pre-rendered index.html on disk`);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    assert(content.includes(`<link rel="canonical" href="https://sakani.site/${route}" />`), `Route /${route} has canonical URL`);
    const routeH1 = content.match(/<h1[^>]*>.*?<\/h1>/gis) || [];
    assert(routeH1.length === 1, `Route /${route} has exactly 1 H1`);
    assert(content.includes('<meta name="description"'), `Route /${route} has meta description`);
  }
}

// 3. Robots.txt Audit
console.log('\n─── 3. robots.txt Directives Audit ───');
const robotsContent = fs.readFileSync(path.join(distDir, 'robots.txt'), 'utf-8');
assert(robotsContent.includes('Allow: /'), 'robots.txt allows root path');
assert(robotsContent.includes('Allow: /properties'), 'robots.txt allows /properties');
assert(robotsContent.includes('Allow: /rent'), 'robots.txt allows /rent');
assert(robotsContent.includes('Disallow: /admin'), 'robots.txt disallows /admin');
assert(robotsContent.includes('Disallow: /my-reservations'), 'robots.txt disallows /my-reservations');
assert(robotsContent.includes('Sitemap: https://sakani.site/sitemap.xml'), 'robots.txt references canonical sitemap URL');

// 4. htaccess Directives Audit
console.log('\n─── 4. .htaccess Server Configuration Audit ───');
const htaccessContent = fs.readFileSync(path.join(distDir, '.htaccess'), 'utf-8');
assert(htaccessContent.includes('AddDefaultCharset UTF-8'), '.htaccess contains AddDefaultCharset UTF-8');
assert(htaccessContent.includes('Header set Content-Type "text/html; charset=UTF-8"'), '.htaccess sets Content-Type charset header');
assert(htaccessContent.includes('RewriteCond %{HTTP_HOST} ^www\\.sakani\\.site$ [NC]'), '.htaccess redirects www to canonical non-www');
assert(htaccessContent.includes('RewriteCond %{HTTP_HOST} ^api\\.sakani\\.site$ [NC]'), '.htaccess preserves api.sakani.site routing');

console.log(`\n==============================================`);
console.log(`📊 Test Summary: ${passedTests} Passed, ${failedTests} Failed`);
console.log(`==============================================\n`);

if (failedTests > 0) {
  process.exit(1);
}
