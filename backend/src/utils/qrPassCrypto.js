const crypto = require('crypto');
const QRCode = require('qrcode');

/**
 * Generates a secure, unguessable 64-hex-character random token for the QR code.
 */
function generateQrToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Computes SHA-256 hash of the raw token for secure database storage and lookup.
 */
function hashQrToken(token) {
  if (!token || typeof token !== 'string') return '';
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Renders a high-resolution base64 data URL for the QR code offline without external network dependency.
 */
async function generateQrCodeDataUrl(content) {
  try {
    return await QRCode.toDataURL(content, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#123F3D', // Moras Forest Green
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR data URL:', err);
    // Fallback Quickchart URL if QRCode fails
    return `https://quickchart.io/qr?text=${encodeURIComponent(content)}&size=300`;
  }
}

/**
 * Constructs the secure pass check/verify payload URL for the QR code.
 * Encoding: https://themorascafe.in/moras-live/passes?passId=ML-0001&token=...
 */
function buildPassQrPayload(passId, qrToken, req) {
  let baseUrl = process.env.FRONTEND_URL;
  // Strictly reject decommissioned Vercel domain if present in env
  if (baseUrl && baseUrl.includes('vercel.app')) {
    baseUrl = null;
  }

  // Attempt dynamic detection from request origin/referer if valid
  if (!baseUrl && req) {
    const origin = typeof req.get === 'function' ? req.get('origin') : (req.headers && req.headers.origin);
    const referer = typeof req.get === 'function' ? req.get('referer') : (req.headers && req.headers.referer);
    const candidate = origin || referer;
    if (candidate) {
      try {
        const parsed = new URL(candidate);
        if (parsed.origin && !parsed.origin.includes('vercel.app')) {
          baseUrl = parsed.origin;
        }
      } catch (e) {}
    }
  }

  // Fallback to official production domain
  if (!baseUrl || baseUrl.includes('vercel.app')) {
    baseUrl = 'https://themorascafe.in';
  }

  baseUrl = baseUrl.replace(/\/+$/, '');
  return `${baseUrl}/moras-live/passes?passId=${encodeURIComponent(passId)}&token=${encodeURIComponent(qrToken)}`;
}

module.exports = {
  generateQrToken,
  hashQrToken,
  generateQrCodeDataUrl,
  buildPassQrPayload,
};
