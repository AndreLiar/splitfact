// Temporary debugging script to test currency formatting
// Run this in your browser console on the invoice page

function testCurrencyFormatting() {
  console.log('=== Currency Formatting Debug ===');
  
  // Test different malformed patterns
  const testValues = [
    '8/000,00',
    '1 8/000,00', 
    '8000',
    8000,
    '18000.00',
    '18,000.00',
    '18 000,00'
  ];
  
  function safeToNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    
    let cleanValue = value;
    if (typeof value === 'string') {
      console.log('Original:', value);
      
      // Handle multiple slash patterns
      cleanValue = cleanValue.replace(/(\d+)\/(\d{3}),(\d{2})/g, '$1$2.$3');
      cleanValue = cleanValue.replace(/(\d+)\/(\d{3})/g, '$1$2');
      cleanValue = cleanValue.replace(/(\d+)\s+(\d+)\/(\d{3}),(\d{2})/g, '$1$2$3.$4');
      cleanValue = cleanValue.replace(/(\d+)\s+(\d+)\/(\d{3})/g, '$1$2$3');
      cleanValue = cleanValue.replace(',', '.');
      cleanValue = cleanValue.replace(/[^0-9.-]/g, '');
      
      console.log('Cleaned:', cleanValue);
    }
    
    const numValue = Number(cleanValue || 0);
    const result = isNaN(numValue) ? 0 : numValue;
    console.log('Final number:', result);
    return result;
  }
  
  function formatCurrency(amount) {
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    return formatted.replace(/\u00A0/g, ' ');
  }
  
  testValues.forEach(val => {
    console.log(`\n--- Testing: "${val}" ---`);
    const cleaned = safeToNumber(val);
    const formatted = formatCurrency(cleaned);
    console.log(`Result: "${formatted}"`);
  });
}

// Run the test
testCurrencyFormatting();