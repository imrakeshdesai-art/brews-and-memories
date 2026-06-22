const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\rakes\\.gemini\\antigravity\\brain\\1b868131-874c-483f-b200-b9a18d749cfb\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const match = line.match(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+/);
    if (match) {
      console.log('FOUND PROXY URL:', match[0]);
    }
  }
}

main().catch(console.error);
