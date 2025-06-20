// Comprehensive test of authentic Russian tool supplier scraping
import https from 'https';
import { Buffer } from 'buffer';

async function testComprehensiveScrapingSystem() {
  console.log('=== COMPREHENSIVE TEST: Authentic Russian Tool Supplier Scraping ===\n');
  
  const suppliers = [
    { id: 'tss', name: 'TSS', url: 'https://www.tss.ru/dealers/catalog/' },
    { id: 'sturm', name: 'STURM TOOLS', url: 'https://sturmtools.ru/' },
    { id: 'zubr', name: 'ZUBR', url: 'https://zubr.ru/' },
    { id: 'instrument', name: 'INSTRUMENT.RU', url: 'https://instrument.ru/' }
  ];
  
  let totalProductsExtracted = 0;
  const successfulSuppliers = [];
  
  for (const supplier of suppliers) {
    console.log(`\n🔍 Testing supplier: ${supplier.name}`);
    console.log(`   URL: ${supplier.url}`);
    
    try {
      // Test website connectivity
      const isAccessible = await testWebsiteAccess(supplier.url);
      if (!isAccessible) {
        console.log(`   ❌ Website not accessible`);
        continue;
      }
      
      console.log(`   ✅ Website accessible`);
      
      // Test HTML extraction
      const htmlContent = await fetchWebsiteHTML(supplier.url);
      if (!htmlContent || htmlContent.length < 1000) {
        console.log(`   ❌ Insufficient HTML content`);
        continue;
      }
      
      console.log(`   ✅ HTML extracted (${htmlContent.length} chars)`);
      
      // Test Claude AI processing
      const products = await extractProductsWithClaude(htmlContent, supplier);
      if (products.length === 0) {
        console.log(`   ❌ No products extracted by Claude AI`);
        continue;
      }
      
      console.log(`   ✅ Claude AI extracted ${products.length} products`);
      console.log(`   📦 Sample product: ${products[0].name} (${products[0].sku})`);
      
      totalProductsExtracted += products.length;
      successfulSuppliers.push({
        name: supplier.name,
        products: products.length,
        sample: products[0]
      });
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Delay between suppliers
    await delay(2000);
  }
  
  // Final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Successful suppliers: ${successfulSuppliers.length}/${suppliers.length}`);
  console.log(`📦 Total products extracted: ${totalProductsExtracted}`);
  
  if (successfulSuppliers.length > 0) {
    console.log('\n🎯 SUCCESSFUL EXTRACTIONS:');
    successfulSuppliers.forEach(supplier => {
      console.log(`   • ${supplier.name}: ${supplier.products} products`);
      console.log(`     Sample: "${supplier.sample.name}" (${supplier.sample.sku})`);
    });
    
    console.log('\n✅ WEB SCRAPING SYSTEM STATUS: FULLY OPERATIONAL');
    console.log('🚀 Ready to extract authentic data from Russian tool suppliers');
  } else {
    console.log('\n❌ No successful extractions - system needs debugging');
  }
}

async function testWebsiteAccess(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: '/',
      method: 'HEAD',
      timeout: 5000
    };
    
    const protocol = urlObj.protocol === 'https:' ? https : require('http');
    const req = protocol.request(options, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
}

async function fetchWebsiteHTML(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    };
    
    const protocol = urlObj.protocol === 'https:' ? https : require('http');
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Timeout')));
    req.end();
  });
}

async function extractProductsWithClaude(htmlContent, supplier) {
  // Clean HTML for Claude processing
  let cleaned = htmlContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleaned.length > 8000) {
    cleaned = cleaned.substring(0, 8000);
  }
  
  // Convert to base64 for safe Russian text handling
  const base64Html = Buffer.from(cleaned, 'utf8').toString('base64');
  
  const prompt = `Extract product information from this Russian tool supplier website (base64 encoded HTML). 

Find products and return ONLY a JSON array with these fields:
- name: product name in Russian
- sku: product code/article
- category: product category  
- description: product description
- imageUrl: image URL (if available)

Return format: [{"name":"Product","sku":"CODE","category":"Category","description":"Description","imageUrl":"url"}]

Base64 HTML: ${base64Html}`;

  const data = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  });
  
  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': data.length
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(body);
            const content = response.content[0].text;
            
            // Extract JSON from Claude response
            const jsonMatch = content.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
              const products = JSON.parse(jsonMatch[0]);
              // Filter valid products
              const validProducts = products.filter(p => 
                p.name && p.sku && 
                p.name.trim().length > 0 && 
                p.sku.trim().length > 0
              );
              resolve(validProducts);
            } else {
              resolve([]);
            }
          } catch (e) {
            resolve([]);
          }
        } else {
          reject(new Error(`Claude API error: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the comprehensive test
testComprehensiveScrapingSystem().catch(console.error);