const fs = require('fs');
const path = require('path');

// Load the actual email helper functions from the codebase to ensure we are testing the real code
const emailJsContent = fs.readFileSync(path.join(__dirname, '../backend/src/utils/email.js'), 'utf8');

// Use eval to get buildCustomerEmailHTML out of the file content
const buildHtmlFnMatch = emailJsContent.match(/function buildCustomerEmailHTML\([\s\S]+?\n\}/);
if (!buildHtmlFnMatch) {
  console.error('Could not extract buildCustomerEmailHTML function from email.js');
  process.exit(1);
}

// Convert function definition to assignment/evaluation
const buildCustomerEmailHTML = eval('(' + buildHtmlFnMatch[0] + ')');

// Extract buildItemRows as well
const buildItemRowsMatch = emailJsContent.match(/function buildItemRows\([\s\S]+?\n\}/);
if (!buildItemRowsMatch) {
  console.error('Could not extract buildItemRows function from email.js');
  process.exit(1);
}
const buildItemRows = eval('(' + buildItemRowsMatch[0] + ')');

const sampleData = {
  name: "Rakesh Desai",
  orderId: "6a272301b09af2598d223571",
  address: "Table 3",
  items: [
    { name: "Chocolate Milk Shake", qty: 1, price: 139 }
  ],
  total: 139,
  payment: "counter"
};

const htmlOutput = buildCustomerEmailHTML(sampleData);

// 1. Save HTML to scratch directory
const outputPath = path.join(__dirname, 'rendered_email.html');
fs.writeFileSync(outputPath, htmlOutput, 'utf8');
console.log(`Saved rendered email template to: ${outputPath}`);

// 2. Scan for raw non-ASCII characters
const nonAsciiMatches = [];
let match;
const regex = /[^\x00-\x7F]/g;
while ((match = regex.exec(htmlOutput)) !== null) {
  nonAsciiMatches.push({
    char: match[0],
    index: match.index,
    hex: '0x' + match[0].charCodeAt(0).toString(16)
  });
}

console.log('\n--- Encoding Scan Results ---');
console.log(`Total non-ASCII characters found: ${nonAsciiMatches.length}`);
if (nonAsciiMatches.length > 0) {
  console.log('List of non-ASCII characters:');
  nonAsciiMatches.forEach((m, idx) => {
    console.log(`  ${idx + 1}. Character: "${m.char}" | Hex Code: ${m.hex} | Location Index: ${m.index}`);
  });
} else {
  console.log('🎉 SUCCESS: The email body contains ZERO raw non-ASCII characters!');
  console.log('All emojis and special symbols are successfully encoded as safe HTML entities.');
}
