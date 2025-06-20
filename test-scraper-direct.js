// Direct test of the web scraping system with authentic Russian tool suppliers
const { scrapeSupplierCatalog } = require('./server/utils/web-scraper.ts');

async function testAuthentic() {
  console.log('Testing authentic data extraction from Russian tool suppliers...');
  
  try {
    // Test TSS supplier
    console.log('\n=== Testing TSS ===');
    const tssResult = await scrapeSupplierCatalog('tss');
    console.log('TSS Result:', JSON.stringify(tssResult, null, 2));
    
    // Test STURM TOOLS supplier
    console.log('\n=== Testing STURM TOOLS ===');
    const sturmResult = await scrapeSupplierCatalog('sturm');
    console.log('STURM Result:', JSON.stringify(sturmResult, null, 2));
    
    // Test DCK TOOLS supplier
    console.log('\n=== Testing DCK TOOLS ===');
    const dckResult = await scrapeSupplierCatalog('dck');
    console.log('DCK Result:', JSON.stringify(dckResult, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAuthentic();