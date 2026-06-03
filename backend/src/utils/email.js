const nodemailer = require('nodemailer');
const https = require('https');

function cleanEnvVar(val) {
  if (!val) return '';
  let cleaned = val.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned.trim();
}

// ── Config ───────────────────────────────────────────────────────────────────
const GMAIL_USER = cleanEnvVar(process.env.GMAIL_USER);   // e.g. brewsandmemories@gmail.com
const GMAIL_PASS = cleanEnvVar(process.env.GMAIL_APP_PASS); // Gmail App Password (16 chars)
const GMAIL_PROXY_URL = cleanEnvVar(process.env.GMAIL_PROXY_URL || process.env.GMAIL_PROXY_URI); // Google Apps Script URL
const GMAIL_PROXY_TOKEN = cleanEnvVar(process.env.GMAIL_PROXY_TOKEN || 'brews-memories-secret');

// ── Unicode Escape Helper for safe transmission ──────────────────────────────
function escapeUnicode(str) {
  return str.replace(/[^\x00-\x7F]/g, (char) => {
    return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
  });
}

// ── HTTPS Helper for Proxy (follows redirects) ──────────────────────────────
function sendPostRequest(url, data, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    function doRequest(requestUrl, postData, redirectsLeft) {
      try {
        const urlObj = new URL(requestUrl);
        const isPost = !!postData;
        
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: isPost ? 'POST' : 'GET',
          headers: isPost ? {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(postData, 'utf8')
          } : {},
          timeout: 15000 // 15 seconds max for Google Apps Script
        };
        
        const req = https.request(options, (res) => {
          // Handle redirects (302, 307, 301, 303)
          if ([301, 302, 303, 307].includes(res.statusCode) && res.headers.location) {
            if (redirectsLeft <= 0) {
              return reject(new Error('Too many redirects'));
            }
            console.log(`[Email] Proxy redirect ${res.statusCode} → ${res.headers.location}`);
            // 302/303 redirects change POST to GET (per HTTP spec)
            const nextData = (res.statusCode === 307) ? postData : null;
            return doRequest(res.headers.location, nextData, redirectsLeft - 1);
          }
          
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            console.log(`[Email] Proxy response status=${res.statusCode} body=${body.substring(0, 200)}`);
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error(`Invalid JSON from proxy (status ${res.statusCode}): ${body.substring(0, 100)}`));
            }
          });
        });
        
        req.on('error', (e) => reject(e));
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Proxy connection timed out (15s)'));
        });
        
        if (postData) req.write(postData, 'utf8');
        req.end();
      } catch (err) {
        reject(err);
      }
    }
    
    const payload = escapeUnicode(JSON.stringify(data));
    doRequest(url, payload, maxRedirects);
  });
}

// ── Transporter (For Direct SMTP Fallback) ────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
    connectionTimeout: 3000, // 3 seconds timeout
    greetingTimeout: 3000,   // 3 seconds timeout
    socketTimeout: 5000      // 5 seconds timeout
  });
}

// ── Format items as HTML rows ─────────────────────────────────────────────────
function buildItemRows(items) {
  return items.map((item) => {
    const variant = item.variant ? ` <span style="color:#777;font-size:13px;font-weight:normal">(${item.variant})</span>` : '';
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e8e2d2;font-size:15px;color:#2d2d2d;font-weight:500">
          ${item.name}${variant} <span style="color:#777;font-size:14px;font-weight:normal">× ${item.qty}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #e8e2d2;text-align:right;font-weight:700;color:#0f3d3e;font-size:15px">
          ₹${item.price * item.qty}
        </td>
      </tr>`;
  }).join('');
}

// ── HTML Email Template ───────────────────────────────────────────────────────
function buildCustomerEmailHTML({ name, items, total, payment, address, orderId }) {
  const isPaid = payment && payment.toLowerCase() === 'online';
  const totalLabel = isPaid ? 'Total Paid' : 'Total to Pay';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Order Confirmed — Brews & Memories</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    body {
      font-family: 'Plus Jakarta Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);border:1px solid #e8e2d2">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f3d3e 0%,#185c5d 100%);padding:40px 32px;text-align:center;border-bottom:3px solid #fbbf24">
      <div style="margin-bottom:16px">
        <img src="https://brews-and-memories.vercel.app/logo.jpg" alt="Brews & Memories Logo" style="width:75px;height:75px;border-radius:50%;border:3px solid #fbbf24;box-shadow:0 4px 10px rgba(0,0,0,0.15);display:inline-block;object-fit:cover" />
      </div>
      <div style="color:#fbbf24;font-size:13px;letter-spacing:4px;text-transform:uppercase;font-weight:800;margin-bottom:8px">Brews & Memories</div>
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;font-family:'Playfair Display', Georgia, serif;letter-spacing:-0.5px">Order Confirmed! &#x1F389;</h1>
      <p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:14px;font-style:italic;font-family:'Playfair Display', Georgia, serif">Vijayapura's Premium Cozy Café</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">

      <p style="color:#2d2d2d;font-size:16px;line-height:1.6;margin:0 0 24px;font-family:'Plus Jakarta Sans', Arial, sans-serif">
        Hi <strong>${name}</strong>! &#x1F44B;<br/><br/>
        Your order has been confirmed! Our kitchen crew is already preparing your items fresh and piping hot. Here is a summary of your cafe ticket:
      </p>

      <!-- Order Details Box -->
      <div style="background:#faf8f5;border-radius:14px;padding:24px;margin-bottom:28px;border:1px solid #e8e2d2;box-shadow:inset 0 1px 3px rgba(0,0,0,0.02)">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tr>
            <td style="padding-bottom:16px;border-bottom:2px dashed #e8e2d2">
              <div style="font-size:11px;color:#8e8a7e;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:4px">Order Reference</div>
              <div style="font-size:15px;color:#0f3d3e;font-weight:800;font-family:monospace">${orderId}</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:12px">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${buildItemRows(items)}
                <tr>
                  <td style="padding:18px 0 0;font-size:16px;font-weight:800;color:#0f3d3e;border-top:2px solid #e8e2d2">${totalLabel}</td>
                  <td style="padding:18px 0 0;text-align:right;font-size:22px;font-weight:900;color:#0f3d3e;border-top:2px solid #e8e2d2">₹${total}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      <!-- Info Cards — Stacked Vertical Layout -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border-collapse:separate;border-spacing:0 10px">
        <!-- Payment Row -->
        <tr>
          <td style="background:#f0fdf4;border-radius:14px;padding:18px 24px;border:1px solid #bbf7d0">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48" valign="middle" style="padding-right:16px">
                  <div style="width:48px;height:48px;background:#dcfce7;border-radius:12px;text-align:center;line-height:48px;font-size:24px">&#x1F4B3;</div>
                </td>
                <td valign="middle">
                  <div style="font-size:11px;color:#047857;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:2px">Payment Method</div>
                  <div style="font-size:17px;font-weight:800;color:#065f46">${payment.toUpperCase()}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Table Row -->
        <tr>
          <td style="background:#fff7ed;border-radius:14px;padding:18px 24px;border:1px solid #fed7aa">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48" valign="middle" style="padding-right:16px">
                  <div style="width:48px;height:48px;background:#ffedd5;border-radius:12px;text-align:center;line-height:48px;font-size:24px">&#x1FA91;</div>
                </td>
                <td valign="middle">
                  <div style="font-size:11px;color:#c2410c;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:2px">Seated At</div>
                  <div style="font-size:17px;font-weight:800;color:#9a3412">${address}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Hours Row -->
        <tr>
          <td style="background:#fdf4ff;border-radius:14px;padding:18px 24px;border:1px solid #e9d5ff">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48" valign="middle" style="padding-right:16px">
                  <div style="width:48px;height:48px;background:#f3e8ff;border-radius:12px;text-align:center;line-height:48px;font-size:24px">&#x1F550;</div>
                </td>
                <td valign="middle">
                  <div style="font-size:11px;color:#7e22ce;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:2px">Café Hours</div>
                  <div style="font-size:17px;font-weight:800;color:#6b21a8">10 AM – 10:30 PM</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:32px">
        <a href="https://brews-and-memories.vercel.app" 
           style="display:inline-block;background:linear-gradient(135deg,#0f3d3e,#185c5d);color:#fff;text-decoration:none;padding:16px 36px;border-radius:50px;font-weight:800;font-size:15px;letter-spacing:1.5px;box-shadow:0 4px 12px rgba(15,61,62,0.25);border:2px solid #fbbf24">
          &#x1F355; Order Again
        </a>
      </div>

      <!-- Contact Info Box -->
      <div style="background:#faf8f5;border-radius:12px;padding:18px;text-align:center;border:1px solid #e8e2d2;margin-bottom:8px">
        <p style="color:#5e5a50;font-size:13px;line-height:1.6;margin:0">
          &#x1F4CD; Find us at: <strong>B.M. Patil Circle, Vijayapura, Karnataka</strong><br/>
          &#x1F4DE; Questions? Ping us on WhatsApp: <a href="https://wa.me/919945446137" style="color:#0f3d3e;font-weight:800;text-decoration:underline">+91 99454 46137</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#0f3d3e;padding:24px 32px;text-align:center;border-top:3px solid #fbbf24">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.7);line-height:1.6">
        © 2026 Brews & Memories Café · Vijayapura<br/>
        Follow our memories on Instagram 
        <a href="https://www.instagram.com/brews_and_memories_/" style="color:#fbbf24;font-weight:700;text-decoration:none">@brews_and_memories_</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Main send function ────────────────────────────────────────────────────────
async function sendOrderEmail(orderData) {
  if (!orderData.email) {
    console.log('[Email] No customer email provided — skipping.');
    return { success: false, error: 'No customer email provided' };
  }

  const subject = `✅ Order Confirmed — Brews & Memories (#${String(orderData.orderId).slice(-6)})`;
  const htmlContent = buildCustomerEmailHTML(orderData);
  const errors = [];

  // 1️⃣ Try sending via Google HTTP Proxy if configured (Bypasses Render free tier SMTP blocks)
  if (GMAIL_PROXY_URL) {
    try {
      console.log(`[Email] Attempting HTTP Proxy send to ${orderData.email}...`);
      const result = await sendPostRequest(GMAIL_PROXY_URL, {
        to: orderData.email,
        subject: subject,
        htmlBody: htmlContent,
        token: GMAIL_PROXY_TOKEN
      });
      
      if (result && result.success) {
        console.log(`[Email] Confirmation sent via HTTP Proxy → ${orderData.email}`);
        return { success: true, method: 'proxy', result };
      } else {
        throw new Error((result && result.error) || 'Proxy execution failed');
      }
    } catch (err) {
      errors.push(`Proxy Error: ${err.message}`);
      console.error('[Email] HTTP Proxy send failed:', err.message);
      console.log('[Email] Falling back to direct SMTP...');
    }
  } else {
    errors.push('Proxy URL not configured');
  }

  // 2️⃣ Direct SMTP Fallback (Will fail on Render Free tier due to port blocks, but works locally/paid tier)
  if (!GMAIL_USER || !GMAIL_PASS) {
    errors.push('SMTP credentials not configured');
    console.warn('[Email] Direct SMTP credentials not set — skipping fallback.');
    return { success: false, errors };
  }

  const transporter = createTransporter();
  try {
    const info = await transporter.sendMail({
      from: `"Brews & Memories Café" <${GMAIL_USER}>`,
      to: orderData.email,
      subject: subject,
      html: htmlContent,
    });
    console.log(`[Email] Confirmation sent via SMTP → ${orderData.email} | MessageID: ${info.messageId}`);
    return { success: true, method: 'smtp', info };
  } catch (err) {
    errors.push(`SMTP Error: ${err.message}`);
    console.error('[Email] Direct SMTP send failed:', err.message);
  }

  return { success: false, errors };
}

module.exports = { sendOrderEmail };
