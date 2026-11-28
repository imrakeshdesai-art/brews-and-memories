/**
 * THE MORAS CAFE — Static Route SEO & Open Graph Pre-renderer
 *
 * Runs post-build (after `vite build`) to generate static HTML entry points
 * for all verified public routes in React Router.
 *
 * This ensures that non-JS crawlers (WhatsApp, Meta / Instagram ExternalHit,
 * Twitterbot, LinkedIn, Telegram, iMessage) receive exact, route-specific
 * Open Graph and Twitter Card metadata in the initial HTML response.
 *
 * Cloudflare Pages automatically serves `dist/<route>/index.html` directly
 * for requests to `/<route>`, while client-side navigation in React Router
 * continues to function seamlessly with zero disruption.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

const BASE_URL = 'https://themorascafe.in';
const DEFAULT_IMAGE = `${BASE_URL}/themorascafe-og-cover.jpg`;
const LIVE_IMAGE = `${BASE_URL}/moras-live-og.jpg`;

/**
 * Strict route registry matching existing routes configured in App.jsx.
 * Only real, functional public routes are defined here.
 */
const ROUTES = [
  {
    path: '/about',
    title: 'About Us — The Story | The Moras Cafe',
    description: "The Moras Cafe is Vijayapura's sanctuary for robusta coffee, pure vegetarian food, and meaningful conversations on Solapur Rd.",
    canonical: `${BASE_URL}/about`,
    image: DEFAULT_IMAGE,
    imageAlt: 'The Moras Cafe — Robusta Coffee, Pure Vegetarian Food & Moments on Solapur Rd, Vijayapura',
  },
  {
    path: '/menu',
    title: 'Our Menu | The Moras Cafe',
    description: 'Explore The Moras Cafe menu on Solapur Rd, Vijayapura. Freshly brewed robusta coffee, hand-tossed pizzas, pasta, sizzling brownie, and vegetarian culinary favorites.',
    canonical: `${BASE_URL}/menu`,
    image: DEFAULT_IMAGE,
    imageAlt: 'The Moras Cafe Menu — Robusta Coffee, Pizzas & Food in Vijayapura',
  },
  {
    path: '/reserve',
    title: 'Host Birthday Celebrations & Table Reservations | The Moras Cafe',
    description: 'Host your birthday celebration at The Moras Cafe for ₹199. Dedicated illuminated Happy Birthday backdrop with warm ambient lights, table setup, and party seating on Solapur Rd, Vijayapura.',
    canonical: `${BASE_URL}/reserve`,
    image: DEFAULT_IMAGE,
    imageAlt: 'The Moras Cafe — Birthday Party Celebrations & Table Reservations on Solapur Rd, Vijayapura',
  },
  {
    path: '/reviews',
    title: 'Guest Reviews & Testimonials | The Moras Cafe',
    description: 'Read real reviews and guest experiences from The Moras Cafe on Solapur Rd, Vijayapura. Discover why locals love our robusta coffee, pizzas, pasta, and warm welcoming vibe.',
    canonical: `${BASE_URL}/reviews`,
    image: DEFAULT_IMAGE,
    imageAlt: 'Customer Reviews and Testimonials for The Moras Cafe',
  },
  {
    path: '/moments',
    title: 'Moments & Ambiance Gallery | The Moras Cafe',
    description: 'Explore customer memories, photos, and ambiance from The Moras Cafe on Solapur Rd, Vijayapura. Share your cozy cafe moments with us.',
    canonical: `${BASE_URL}/moments`,
    image: DEFAULT_IMAGE,
    imageAlt: 'Moments and Photography from The Moras Cafe on Solapur Rd',
  },
  {
    path: '/wallpapers',
    title: 'Official Brand Wallpapers | The Moras Cafe',
    description: 'Download official high-resolution smartphone brand wallpapers from The Moras Cafe. Featuring botanical coffee artwork, heritage tapestries, and signature emblems.',
    canonical: `${BASE_URL}/wallpapers`,
    image: DEFAULT_IMAGE,
    imageAlt: 'Official Brand Wallpapers from The Moras Cafe',
  },
  {
    path: '/moras-live',
    title: 'MORAS LIVE — Open Stage Music, Poetry & Comedy | The Moras Cafe',
    description: 'Join MORAS LIVE at The Moras Cafe on Solapur Rd, Vijayapura — an open stage celebration of poetry, acoustic music, rap, comedy, and raw artistic talent. Your mic. Your moment.',
    canonical: `${BASE_URL}/moras-live`,
    image: LIVE_IMAGE,
    imageAlt: 'MORAS LIVE — Open Stage Celebration of Poetry, Music, Rap & Comedy at The Moras Cafe',
  },
  {
    path: '/moras-live/register',
    title: 'MORAS LIVE — Official Performer Registration | The Moras Cafe',
    description: 'Register as a performer for MORAS LIVE at The Moras Cafe on Solapur Rd, Vijayapura. An open stage celebration of poetry, music, rap, comedy, and creative expression. Your mic. Your moment.',
    canonical: `${BASE_URL}/moras-live/register`,
    image: LIVE_IMAGE,
    imageAlt: 'MORAS LIVE — Official Performer Registration at The Moras Cafe',
  },
  {
    path: '/moras-live/passes',
    title: 'MORAS LIVE — Limited Audience Passes (60 Max) | The Moras Cafe',
    description: 'Reserve your exclusive limited audience pass for MORAS LIVE at The Moras Cafe on Solapur Rd, Vijayapura. Exactly 60 passes available. Each pass includes one complimentary freshly-brewed Cappuccino.',
    canonical: `${BASE_URL}/moras-live/passes`,
    image: LIVE_IMAGE,
    imageAlt: 'MORAS LIVE — Limited Audience Passes at The Moras Cafe',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | The Moras Cafe',
    description: 'Privacy Policy for The Moras Cafe. Learn how we collect, protect, and process your table ordering information securely.',
    canonical: `${BASE_URL}/privacy`,
    image: DEFAULT_IMAGE,
    imageAlt: 'The Moras Cafe Privacy Policy',
  },
  {
    path: '/terms',
    title: 'Terms of Service | The Moras Cafe',
    description: 'Terms of Service for The Moras Cafe. Understand our table ordering policies, digital session rules, and payment options.',
    canonical: `${BASE_URL}/terms`,
    image: DEFAULT_IMAGE,
    imageAlt: 'The Moras Cafe Terms of Service',
  },
];

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectMetadata(html, route) {
  let updated = html;

  // Title
  updated = updated.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(route.title)}</title>`);

  // Meta Description
  updated = updated.replace(
    /<meta\s+name=["']description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(route.description)}" />`
  );

  // Canonical
  updated = updated.replace(
    /<link\s+rel=["']canonical["']\s+href=["'][\s\S]*?["']\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(route.canonical)}" />`
  );

  // Open Graph Title
  updated = updated.replace(
    /<meta\s+property=["']og:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`
  );

  // Open Graph Description
  updated = updated.replace(
    /<meta\s+property=["']og:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`
  );

  // Open Graph URL
  updated = updated.replace(
    /<meta\s+property=["']og:url["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:url" content="${escapeHtml(route.canonical)}" />`
  );

  // Open Graph Image
  updated = updated.replace(
    /<meta\s+property=["']og:image["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:image" content="${escapeHtml(route.image)}" />`
  );

  // Open Graph Image Secure URL
  updated = updated.replace(
    /<meta\s+property=["']og:image:secure_url["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:image:secure_url" content="${escapeHtml(route.image)}" />`
  );

  // Open Graph Image Alt
  updated = updated.replace(
    /<meta\s+property=["']og:image:alt["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:image:alt" content="${escapeHtml(route.imageAlt)}" />`
  );

  // Twitter Title
  updated = updated.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`
  );

  // Twitter Description
  updated = updated.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`
  );

  // Twitter URL
  updated = updated.replace(
    /<meta\s+name=["']twitter:url["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:url" content="${escapeHtml(route.canonical)}" />`
  );

  // Twitter Image
  updated = updated.replace(
    /<meta\s+name=["']twitter:image["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:image" content="${escapeHtml(route.image)}" />`
  );

  // Twitter Image Alt
  updated = updated.replace(
    /<meta\s+name=["']twitter:image:alt["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:image:alt" content="${escapeHtml(route.imageAlt)}" />`
  );

  return updated;
}

export function prerender() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`❌ Pre-render failed: dist template not found at ${TEMPLATE_PATH}`);
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  console.log(`\n🚀 Starting Static Route SEO Pre-renderer for ${ROUTES.length} routes...`);

  let count = 0;
  for (const route of ROUTES) {
    const routeRel = route.path.replace(/^\/+/, '');
    const targetDir = path.join(DIST_DIR, routeRel);
    const targetFile = path.join(targetDir, 'index.html');

    fs.mkdirSync(targetDir, { recursive: true });
    const renderedHtml = injectMetadata(baseHtml, route);
    fs.writeFileSync(targetFile, renderedHtml, 'utf8');

    console.log(`  ✅ Generated: /${routeRel}/index.html (${route.title})`);
    count++;
  }

  console.log(`\n🎉 Successfully pre-rendered ${count} static public routes for social crawlers!\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  prerender();
}
