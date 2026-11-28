import { useEffect } from 'react';

const DEFAULT_TITLE = 'The Moras Cafe — Coffee, Food & More in Vijayapura';
const DEFAULT_DESCRIPTION = 'Welcome to The Moras Cafe on Solapur Rd, Vijayapura. Enjoy freshly brewed robusta coffee, pizzas, pasta, sizzling brownie, and cozy ambiance.';
const DEFAULT_IMAGE = 'https://themorascafe.in/themorascafe-og-cover.jpg';
const DEFAULT_IMAGE_ALT = 'The Moras Cafe — Robusta Coffee, Pure Vegetarian Food & Moments in Vijayapura';
const BASE_URL = 'https://themorascafe.in';

function setMetaTag(selector, attrName, attrValue, content) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export default function useSEO({
  title,
  description,
  canonical,
  image = DEFAULT_IMAGE,
  imageAlt = DEFAULT_IMAGE_ALT,
  imageWidth = '1200',
  imageHeight = '630',
  imageType = 'image/jpeg',
  isHome = false,
  noindex = false,
} = {}) {
  useEffect(() => {
    // 1. Page Title
    const finalTitle = isHome
      ? DEFAULT_TITLE
      : title
      ? (title.includes('The Moras Cafe') ? title : `${title} | The Moras Cafe`)
      : DEFAULT_TITLE;
    document.title = finalTitle;

    // 2. Meta Description
    const finalDesc = description || DEFAULT_DESCRIPTION;
    setMetaTag('meta[name="description"]', 'name', 'description', finalDesc);

    // 3. Canonical Tag
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const finalCanonical = canonical
      ? (canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical.startsWith('/') ? '' : '/'}${canonical}`)
      : (currentPath === '/' ? `${BASE_URL}/` : `${BASE_URL}${currentPath}`);
    setCanonical(finalCanonical);

    // 4. Open Graph Tags
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'The Moras Cafe');
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_IN');
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', finalTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', finalDesc);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', finalCanonical);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
    setMetaTag('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', image);
    setMetaTag('meta[property="og:image:type"]', 'property', 'og:image:type', imageType);
    setMetaTag('meta[property="og:image:width"]', 'property', 'og:image:width', imageWidth);
    setMetaTag('meta[property="og:image:height"]', 'property', 'og:image:height', imageHeight);
    setMetaTag('meta[property="og:image:alt"]', 'property', 'og:image:alt', imageAlt);

    // 5. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', finalTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', finalDesc);
    setMetaTag('meta[name="twitter:url"]', 'name', 'twitter:url', finalCanonical);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    setMetaTag('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', imageAlt);

    // 6. Robots Meta Tag (e.g. noindex for admin/kitchen/track)
    if (noindex) {
      setMetaTag('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow');
    } else {
      setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow');
    }
  }, [title, description, canonical, image, imageAlt, imageWidth, imageHeight, imageType, isHome, noindex]);
}
