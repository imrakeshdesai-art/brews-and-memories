import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL === '1' || process.env.BUILD_TARGET === 'vercel' || process.argv.includes('--force');

if (!isVercel) {
  console.log('[Build Optimizer] Not a Vercel build (Cloudflare/local). Preserving all originals.');
  process.exit(0);
}

const distDir = path.resolve(__dirname, '../dist');
const originalsDir = path.join(distDir, 'wallpapers', 'originals');
const previewsDir = path.join(distDir, 'wallpapers', 'previews');

console.log('--- Vercel Build Optimization: Cleaning Originals ---');

if (fs.existsSync(originalsDir)) {
  const files = fs.readdirSync(originalsDir);
  console.log(`Found ${files.length} original files in dist/wallpapers/originals. Removing...`);
  fs.rmSync(originalsDir, { recursive: true, force: true });
  console.log('Successfully removed dist/wallpapers/originals.');
} else {
  console.log('dist/wallpapers/originals is already absent.');
}

const originalsExist = fs.existsSync(originalsDir);
const previewsExist = fs.existsSync(previewsDir);
const previewCount = previewsExist ? fs.readdirSync(previewsDir).length : 0;

console.log(`Originals in dist: ${originalsExist ? 'EXISTS (ERROR)' : 'EXCLUDED (SUCCESS)'}`);
console.log(`Previews in dist:  ${previewsExist ? `RETAINED (${previewCount} files)` : 'MISSING (ERROR)'}`);

if (originalsExist) {
  console.error('ERROR: Originals were not excluded from Vercel dist!');
  process.exit(1);
}

if (!previewsExist || previewCount !== 21) {
  console.error(`ERROR: Expected 21 previews in dist, found ${previewCount}!`);
  process.exit(1);
}

console.log('--- Vercel Build Verification: PASSED ---');
