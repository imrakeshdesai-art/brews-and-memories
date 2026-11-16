import { useEffect } from 'react';

const DEFAULT_TITLE = 'The Moras Cafe — Coffee, Food & More in Vijayapura';
const DEFAULT_DESCRIPTION = 'Welcome to The Moras Cafe at B.M. Patil Circle, Vijayapura. Enjoy freshly brewed coffee, pizzas, pasta, sizzling brownie, and cozy ambiance.';
const DEFAULT_IMAGE = 'https://themorascafe.in/og-image.jpg';
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
    const finalCanonical = canonical || (currentPath === '/' ? `${BASE_URL}/` : `${BASE_URL}${currentPath}`);
    setCanonical(finalCanonical);

    // 4. Open Graph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', finalTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', finalDesc);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', finalCanonical);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', image);

    // 5. Twitter Card Tags
    setMetaTag('meta[property="twitter:title"]', 'property', 'twitter:title', finalTitle);
    setMetaTag('meta[property="twitter:description"]', 'property', 'twitter:description', finalDesc);
    setMetaTag('meta[property="twitter:url"]', 'property', 'twitter:url', finalCanonical);
    setMetaTag('meta[property="twitter:image"]', 'property', 'twitter:image', image);

    // 6. Robots Meta Tag (e.g. noindex for admin/kitchen/track)
    if (noindex) {
      setMetaTag('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow');
    } else {
      setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow');
    }
  }, [title, description, canonical, image, isHome, noindex]);
}
