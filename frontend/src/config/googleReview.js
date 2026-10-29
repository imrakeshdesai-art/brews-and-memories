/**
 * Google Review Configuration for THE MORAS CAFE
 *
 * HOW TO GET YOUR DIRECT 5-STAR REVIEW LINK:
 * 1. Go to https://business.google.com or search "my business" on Google while logged into your Google account.
 * 2. On your Business Profile dashboard, click "Ask for reviews" (or "Get more reviews").
 * 3. Copy the short link provided (e.g. https://g.page/r/CU9.../review).
 * 4. Paste it below into `googleReviewDirectUrl`.
 *
 * When customers scan the QR code or visit /rate, they will be sent directly to this URL
 * with Google's 5-star review popup ready to click and submit!
 */

export const GOOGLE_REVIEW_CONFIG = {
  // Direct Google Business Profile review link for The Moras Cafe
  googleReviewDirectUrl: 'https://g.page/r/CZnAvZOBTAOMEBM/review', 

  // Place ID for The Moras Cafe (Vijayapura)
  placeId: 'ChIJJb8cUnFVxjsRmcC9k4FMA4w',

  // Fallback URL: Google Maps listing for The Moras Cafe
  fallbackSearchUrl: 'https://g.page/r/CZnAvZOBTAOMEBM/review',

  // Permanent Smart Forwarder URL on your website
  permanentRateUrl: 'https://themorascafe.in/rate',
};

export function getEffectiveReviewUrl() {
  if (GOOGLE_REVIEW_CONFIG.googleReviewDirectUrl && GOOGLE_REVIEW_CONFIG.googleReviewDirectUrl.trim() !== '') {
    return GOOGLE_REVIEW_CONFIG.googleReviewDirectUrl.trim();
  }
  if (GOOGLE_REVIEW_CONFIG.placeId && GOOGLE_REVIEW_CONFIG.placeId.trim() !== '') {
    return `https://search.google.com/local/writereview?placeid=${GOOGLE_REVIEW_CONFIG.placeId.trim()}`;
  }
  return GOOGLE_REVIEW_CONFIG.fallbackSearchUrl;
}
