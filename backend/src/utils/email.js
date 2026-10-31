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

// ── Branded Sender & Service Configuration ────────────────────────────────────
// Official identity for THE MORAS CAFE:
// - Orders & Notifications: orders@themorascafe.in
// - General Enquiries:      info@themorascafe.in
// - Careers / Hiring:       careers@themorascafe.in
const BREVO_API_KEY = cleanEnvVar(process.env.BREVO_API_KEY);
const EMAIL_FROM = cleanEnvVar(process.env.EMAIL_FROM) || 'orders@themorascafe.in';
const EMAIL_FROM_NAME = cleanEnvVar(process.env.EMAIL_FROM_NAME) || 'THE MORAS CAFE';
const EMAIL_REPLY_TO = cleanEnvVar(process.env.EMAIL_REPLY_TO) || 'orders@themorascafe.in';

// ── Legacy / Fallback Service Configuration ───────────────────────────────────
const GMAIL_USER = cleanEnvVar(process.env.GMAIL_USER);   // Fallback Gmail account
const GMAIL_PASS = cleanEnvVar(process.env.GMAIL_APP_PASS); // Gmail App Password
const GMAIL_PROXY_URL = cleanEnvVar(process.env.GMAIL_PROXY_URL || process.env.GMAIL_PROXY_URI); // Google Apps Script URL
const GMAIL_PROXY_TOKEN = cleanEnvVar(process.env.GMAIL_PROXY_TOKEN || 'brews-memories-secret');

// ── Brevo Transactional Email HTTPS API ───────────────────────────────────────
function sendBrevoEmail({ to, toName, subject, htmlContent, textContent }) {
  return new Promise((resolve, reject) => {
    if (!BREVO_API_KEY) {
      return reject(new Error('BREVO_API_KEY not configured'));
    }

    const payload = JSON.stringify({
      sender: {
        name: EMAIL_FROM_NAME,
        email: EMAIL_FROM,
      },
      to: [
        {
          email: to,
          name: toName || to.split('@')[0],
        },
      ],
      replyTo: {
        name: EMAIL_FROM_NAME,
        email: EMAIL_REPLY_TO,
      },
      subject,
      htmlContent,
      textContent: textContent || undefined,
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload, 'utf8'),
      },
      timeout: 12000, // 12 seconds max
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = body ? JSON.parse(body) : {};
        } catch (e) {
          parsed = { raw: body };
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            success: true,
            method: 'brevo_https',
            messageId: parsed.messageId || 'unknown-id',
          });
        } else {
          const errMsg = parsed.message || parsed.error || `HTTP ${res.statusCode}`;
          reject(new Error(`Brevo API error (${res.statusCode}): ${errMsg}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Brevo API request timed out (12s)'));
    });

    req.write(payload, 'utf8');
    req.end();
  });
}

// ── Legacy Google HTTPS Proxy (Follows Redirects) ────────────────────────────
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
            'Content-Length': Buffer.byteLength(postData, 'utf8'),
          } : {},
          timeout: 15000,
        };
        
        const req = https.request(options, (res) => {
          if ([301, 302, 303, 307].includes(res.statusCode) && res.headers.location) {
            if (redirectsLeft <= 0) {
              return reject(new Error('Too many redirects'));
            }
            const nextData = (res.statusCode === 307) ? postData : null;
            return doRequest(res.headers.location, nextData, redirectsLeft - 1);
          }
          
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
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
    
    const payload = JSON.stringify(data);
    doRequest(url, payload, maxRedirects);
  });
}

// ── Direct SMTP Fallback Transporter ─────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
    connectionTimeout: 3000,
    greetingTimeout: 3000,
    socketTimeout: 5000,
  });
}

// ── Format items as HTML rows ─────────────────────────────────────────────────
function buildItemRows(items) {
  return (items || []).map((item) => {
    const variant = item.variant ? ` <span style="color:#777;font-size:12px;font-weight:normal">(${item.variant})</span>` : '';
    const unitPrice = item.price || 0;
    const qty = item.qty || 1;
    const lineTotal = unitPrice * qty;
    return `
      <tr>
        <td width="65%" style="padding:10px 0;border-bottom:1px solid #e8e2d2;font-size:14px;color:#2d2d2d;font-weight:500;width:65%">
          <strong>${item.name}</strong>${variant}<br/>
          <span style="color:#777;font-size:12px">${qty} &times; &#x20B9;${unitPrice}</span>
        </td>
        <td width="35%" style="padding:10px 0;border-bottom:1px solid #e8e2d2;text-align:right;font-weight:800;color:#0f3d3e;font-size:15px;width:35%;white-space:nowrap">
          &#x20B9;${lineTotal}
        </td>
      </tr>`;
  }).join('');
}

// ── HTML Email Template: Tax Invoice & Bill Receipt ───────────────────────────
function buildCustomerEmailHTML({ name, items, total, payment, address, orderId, trackingToken }) {
  const isPaid = payment && (payment.toLowerCase() === 'online' || payment.toLowerCase() === 'upi');
  const totalLabel = isPaid ? 'Total Paid' : 'Total Amount Due';
  const refCode = orderId ? String(orderId).slice(-6).toUpperCase() : 'RECEIPT';
  const dateStr = new Date().toLocaleDateString('en-IN', { 
    timeZone: 'Asia/Kolkata', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Tax Invoice &amp; Bill Receipt &mdash; The Moras Cafe</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; }
    @media only screen and (max-width: 480px) {
      .email-wrapper { margin: 10px auto !important; border-radius: 8px !important; width: 100% !important; }
      .email-body { padding: 18px !important; }
      .details-box { padding: 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <center style="width:100%;background-color:#f5f0e8">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f5f0e8" style="background-color:#f5f0e8;margin:0;padding:32px 0;width:100%">
      <tr>
        <td align="center" valign="top" style="text-align:center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e2d2;box-shadow:0 4px 24px rgba(0,0,0,0.08);margin:0 auto;text-align:left" align="center">
            <tr>
              <td>
                <!-- Header -->
                <div style="background:linear-gradient(135deg,#0f3d3e 0%,#185c5d 100%);padding:36px 28px;text-align:center;border-bottom:3px solid #fbbf24">
                  <div style="margin-bottom:14px;text-align:center">
                    <div style="width:72px;height:72px;border-radius:50%;overflow:hidden;margin:0 auto;box-shadow:0 4px 14px rgba(0,0,0,0.35);background-color:#FAF5EF;border:2px solid #fbbf24;display:inline-block">
                      <img src="https://themorascafe.in/images/brand/secondary-badge-light.png" alt="The Moras Cafe Seal" width="72" height="72" style="width:100%;height:100%;object-fit:contain;display:block;border:0" />
                    </div>
                  </div>
                  <div style="color:#fbbf24;font-size:12px;letter-spacing:4px;text-transform:uppercase;font-weight:800;margin-bottom:6px">The Moras Cafe</div>
                  <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;font-family:'Playfair Display', Georgia, serif;letter-spacing:-0.5px">Tax Invoice &amp; Bill Receipt &#x1F9FE;</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;font-family:'Playfair Display', Georgia, serif">Vijayapura's Warm Sanctuary &bull; 100% Pure Vegetarian</p>
                </div>

                <!-- Body -->
                <div class="email-body" style="padding:28px">
                  <p style="color:#2d2d2d;font-size:15px;line-height:1.6;margin:0 0 20px;font-family:'Plus Jakarta Sans', Arial, sans-serif">
                    Dear <strong>${name}</strong>, &#x2728;<br/><br/>
                    Thank you for dining with <strong>The Moras Cafe</strong>. Here is your official digital bill receipt for your order:
                  </p>

                  <!-- Bill Meta Box -->
                  <div class="details-box" style="background:#faf8f5;border-radius:14px;padding:20px;margin-bottom:20px;border:1px solid #e8e2d2;box-shadow:inset 0 1px 3px rgba(0,0,0,0.02)">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;width:100%">
                      <tr>
                        <td style="padding-bottom:12px;border-bottom:2px dashed #e8e2d2">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:11px;color:#8e8a7e;letter-spacing:1.5px;text-transform:uppercase;font-weight:700">Invoice Reference</td>
                              <td style="text-align:right;font-size:11px;color:#8e8a7e;letter-spacing:1.5px;text-transform:uppercase;font-weight:700">Date &amp; Time</td>
                            </tr>
                            <tr>
                              <td style="font-size:16px;color:#0f3d3e;font-weight:800;font-family:monospace">#TMC-INV-${refCode}</td>
                              <td style="text-align:right;font-size:13px;color:#0f3d3e;font-weight:600">${dateStr}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #e8e2d2">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px;color:#666">Billed To:</td>
                              <td style="text-align:right;font-size:13px;font-weight:700;color:#0f3d3e">${name}</td>
                            </tr>
                            <tr>
                              <td style="font-size:13px;color:#666">Seated At:</td>
                              <td style="text-align:right;font-size:13px;font-weight:700;color:#0f3d3e">${address}</td>
                            </tr>
                            <tr>
                              <td style="font-size:13px;color:#666">Payment Mode:</td>
                              <td style="text-align:right;font-size:13px;font-weight:700;color:#047857">${(payment || 'Counter').toUpperCase()}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:12px">
                          <div style="font-size:11px;color:#8e8a7e;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin-bottom:8px">Itemized Breakdown</div>
                          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;width:100%">
                            ${buildItemRows(items)}
                            <tr>
                              <td width="65%" style="padding:12px 0 4px;font-size:14px;color:#555">Item Subtotal</td>
                              <td width="35%" style="padding:12px 0 4px;text-align:right;font-size:14px;color:#333;font-weight:600">&#x20B9;${total}</td>
                            </tr>
                            <tr>
                              <td width="65%" style="padding:4px 0 8px;font-size:12px;color:#888">Taxes (GST All Inclusive)</td>
                              <td width="35%" style="padding:4px 0 8px;text-align:right;font-size:12px;color:#059669;font-weight:600">&#x20B9;0.00</td>
                            </tr>
                            <tr>
                              <td width="65%" style="padding:14px 0 0;font-size:16px;font-weight:800;color:#0f3d3e;border-top:2px solid #0f3d3e">${totalLabel}</td>
                              <td width="35%" style="padding:14px 0 0;text-align:right;font-size:22px;font-weight:900;color:#0f3d3e;border-top:2px solid #0f3d3e">&#x20B9;${total}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Live Order Tracking CTA -->
                  ${trackingToken ? `
                  <div style="text-align:center;margin-bottom:20px">
                    <a href="https://themorascafe.in/track/${orderId}#token=${trackingToken}" 
                       style="display:inline-block;background:linear-gradient(135deg,#c3912d,#dfaa38);color:#1a1a1a;text-decoration:none;padding:14px 28px;border-radius:50px;font-weight:800;font-size:14px;letter-spacing:1px;box-shadow:0 4px 14px rgba(195,145,45,0.35);border:2px solid #f5c862">
                      &#x1F4CD; Live Order Tracking
                    </a>
                  </div>
                  ` : ''}

                  <!-- Rate Us on Google Banner -->
                  <div style="background:#fffbeb;border-radius:12px;padding:14px 18px;border:1px solid #fde68a;text-align:center;margin-bottom:20px">
                    <div style="font-size:14px;font-weight:700;color:#92400e;margin-bottom:4px">&#x2B50; Loved Your Experience?</div>
                    <div style="font-size:12px;color:#b45309;line-height:1.5;margin-bottom:10px">
                      Your feedback helps our independent café flourish! Please take 10 seconds to share a 5-star review.
                    </div>
                    <a href="https://themorascafe.in/rate" 
                       style="display:inline-block;background:#0f3d3e;color:#fff;text-decoration:none;padding:8px 20px;border-radius:20px;font-weight:700;font-size:12px">
                      Write a Google Review &rarr;
                    </a>
                  </div>

                  <!-- Café Address & Legal Notice -->
                  <div style="background:#faf8f5;border-radius:12px;padding:14px;text-align:center;border:1px solid #e8e2d2">
                    <p style="color:#5e5a50;font-size:12px;line-height:1.6;margin:0">
                      <strong>The Moras Cafe</strong> &middot; B.M. Patil Circle, Ring Rd, Solapur Bypass, Vijayapura, KA 586102<br/>
                      &#x1F4DE; Host Desk / WhatsApp: <a href="https://wa.me/919945446137" style="color:#0f3d3e;font-weight:700">+91 99454 46137</a><br/>
                      <em>This is an official computer-generated digital bill receipt.</em>
                    </p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background:#0f3d3e;padding:20px 28px;text-align:center;border-top:3px solid #fbbf24">
                  <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.7);line-height:1.6">
                    &copy; 2026 The Moras Cafe &middot; Vijayapura<br/>
                    Follow our journey on Instagram 
                    <a href="https://www.instagram.com/themorascafe/" style="color:#fbbf24;font-weight:700;text-decoration:none">@themorascafe</a>
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

// ── Plain-Text Email Template: Tax Invoice & Bill Receipt ─────────────────────
function buildCustomerEmailText({ name, items, total, payment, address, orderId, trackingToken }) {
  const isPaid = payment && (payment.toLowerCase() === 'online' || payment.toLowerCase() === 'upi');
  const totalLabel = isPaid ? 'Total Paid' : 'Total Amount Due';
  const refCode = orderId ? String(orderId).slice(-6).toUpperCase() : 'RECEIPT';
  const itemsText = (items || [])
    .map((i) => ` - ${i.name}${i.variant ? ` (${i.variant})` : ''} x ${i.qty} @ Rs.${i.price}: Rs.${i.price * i.qty}`)
    .join('\n');

  return `THE MORAS CAFE — TAX INVOICE & BILL RECEIPT 🧾
===================================================
Invoice No: #TMC-INV-${refCode}
Billed To: ${name}
Location: ${address}
Payment Method: ${(payment || 'Counter').toUpperCase()}

ORDERED ITEMS:
---------------------------------------------------
${itemsText}
---------------------------------------------------
Item Subtotal: Rs.${total}
Taxes (GST): Included (Rs.0.00 Extra)
${totalLabel}: Rs.${total}

${trackingToken ? `Live Order Tracking: https://themorascafe.in/track/${orderId}#token=${trackingToken}\n` : ''}
Rate Us on Google: https://themorascafe.in/rate

Cafe Address: B.M. Patil Circle, Ring Rd, Solapur Bypass, Vijayapura, KA 586102
Host Desk / WhatsApp: +91 99454 46137
*This is an official computer-generated digital bill receipt.*
Thank you for dining with The Moras Cafe!
`;
}

// ── HTML Birthday Reservation Email Template ──────────────────────────────────
function buildReservationEmailHTML(reservationData) {
  const { 
    name = 'Guest', 
    date = '', 
    time = '', 
    guests = 1, 
    notes = '', 
    amount = 59, 
    packagePrice = 199,
    remainingBalance = 140,
    birthdayPerson = '',
    upiRef = '', 
    _id 
  } = reservationData;
  const refCode = _id ? String(_id).slice(-6).toUpperCase() : 'CONFIRMED';
  const celebrateWho = birthdayPerson || name;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Birthday Celebration Confirmed &mdash; The Moras Cafe</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; }
    @media only screen and (max-width: 480px) {
      .email-wrapper { margin: 10px auto !important; border-radius: 8px !important; width: 100% !important; }
      .email-body { padding: 18px !important; }
      .details-box { padding: 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
  <center style="width:100%;background-color:#f5f0e8">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f5f0e8" style="background-color:#f5f0e8;margin:0;padding:32px 0;width:100%">
      <tr>
        <td align="center" valign="top" style="text-align:center">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e2d2;box-shadow:0 4px 24px rgba(0,0,0,0.08);margin:0 auto;text-align:left" align="center">
            <tr>
              <td>
                <!-- Header -->
                <div style="background:linear-gradient(135deg,#0f3d3e 0%,#185c5d 100%);padding:36px 28px;text-align:center;border-bottom:3px solid #fbbf24">
                  <div style="margin-bottom:14px;text-align:center">
                    <div style="width:72px;height:72px;border-radius:50%;overflow:hidden;margin:0 auto;box-shadow:0 4px 14px rgba(0,0,0,0.35);background-color:#FAF5EF;border:2px solid #fbbf24;display:inline-block">
                      <img src="https://themorascafe.in/images/brand/secondary-badge-light.png" alt="The Moras Cafe Seal" width="72" height="72" style="width:100%;height:100%;object-fit:contain;display:block;border:0" />
                    </div>
                  </div>
                  <div style="color:#fbbf24;font-size:12px;letter-spacing:4px;text-transform:uppercase;font-weight:800;margin-bottom:6px">The Moras Cafe</div>
                  <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;font-family:'Playfair Display', Georgia, serif;letter-spacing:-0.5px">Birthday Celebration Confirmed! &#x1F382;&#x2728;</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;font-style:italic;font-family:'Playfair Display', Georgia, serif">Vijayapura's Warm Celebration Sanctuary</p>
                </div>

                <!-- Body -->
                <div class="email-body" style="padding:28px">
                  <p style="color:#2d2d2d;font-size:15px;line-height:1.6;margin:0 0 20px;font-family:'Plus Jakarta Sans', Arial, sans-serif">
                    Dear <strong>${name}</strong>, &#x1F389;<br/><br/>
                    We are thrilled to confirm your birthday celebration booking for <strong>${celebrateWho}</strong> at <strong>The Moras Cafe</strong>! Your illuminated "Happy Birthday" stand with glowing lights and celebration area are ready.
                  </p>

                  <!-- Important Bring Cake Notice -->
                  <div style="background:#fff7ed;border-radius:12px;padding:16px 20px;border:1px solid #fed7aa;margin-bottom:20px">
                    <div style="font-size:11px;color:#c2410c;text-transform:uppercase;letter-spacing:1.5px;font-weight:800;margin-bottom:4px">&#x1F382; BRING YOUR OWN CAKE (BYOC)</div>
                    <div style="font-size:13px;color:#9a3412;line-height:1.5">
                      <strong>Please bring your favorite birthday cake with you!</strong> We do not offer or bake cakes. We provide the illuminated "Happy Birthday" backdrop with ambient lights, cake stand, cutting knife, celebration plates, and party assistance.
                    </div>
                  </div>

                  <!-- Details Box -->
                  <div class="details-box" style="background:#faf8f5;border-radius:14px;padding:20px;margin-bottom:24px;border:1px solid #e8e2d2;box-shadow:inset 0 1px 3px rgba(0,0,0,0.02)">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;width:100%">
                      <tr>
                        <td style="padding-bottom:14px;border-bottom:2px dashed #e8e2d2">
                          <div style="font-size:11px;color:#8e8a7e;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:4px">Booking Reference</div>
                          <div style="font-size:16px;color:#0f3d3e;font-weight:800;font-family:monospace">#TMC-BDAY-${refCode}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:14px">
                          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                            <tr>
                              <td style="padding:7px 0;font-size:14px;color:#666">&#x1F389; Celebration For</td>
                              <td style="padding:7px 0;text-align:right;font-size:15px;font-weight:700;color:#0f3d3e">${celebrateWho}</td>
                            </tr>
                            <tr>
                              <td style="padding:7px 0;font-size:14px;color:#666">&#x1F4C5; Date</td>
                              <td style="padding:7px 0;text-align:right;font-size:15px;font-weight:700;color:#0f3d3e">${date}</td>
                            </tr>
                            <tr>
                              <td style="padding:7px 0;font-size:14px;color:#666">&#x23F0; Time Slot</td>
                              <td style="padding:7px 0;text-align:right;font-size:15px;font-weight:700;color:#0f3d3e">${time}</td>
                            </tr>
                            <tr>
                              <td style="padding:7px 0;font-size:14px;color:#666">&#x1F465; Number of People</td>
                              <td style="padding:7px 0;text-align:right;font-size:15px;font-weight:700;color:#0f3d3e">${guests} People</td>
                            </tr>
                            <tr>
                              <td style="padding:7px 0;font-size:14px;color:#666">&#x1F380; Birthday Setup Fee</td>
                              <td style="padding:7px 0;text-align:right;font-size:15px;font-weight:700;color:#0f3d3e">&#x20B9;${packagePrice}</td>
                            </tr>
                            <tr>
                              <td style="padding:7px 0;font-size:14px;color:#666">&#x1F4B3; Advance Paid (UPI)</td>
                              <td style="padding:7px 0;text-align:right;font-size:15px;font-weight:800;color:#047857">&#x20B9;${amount} (Confirmed)</td>
                            </tr>
                            <tr>
                              <td style="padding:7px 0;font-size:14px;color:#666">&#x1F4B0; Balance Due at Cafe</td>
                              <td style="padding:7px 0;text-align:right;font-size:15px;font-weight:800;color:#c2410c">&#x20B9;${remainingBalance} + food &amp; drinks ordered</td>
                            </tr>
                            ${upiRef ? `
                            <tr>
                              <td style="padding:7px 0;font-size:14px;color:#666">&#x1F522; UPI Ref / UTR</td>
                              <td style="padding:7px 0;text-align:right;font-size:13px;font-weight:600;color:#555;font-family:monospace">${upiRef}</td>
                            </tr>` : ''}
                            ${notes ? `
                            <tr>
                              <td style="padding:7px 0;font-size:14px;color:#666">&#x1F4DD; Special Notes</td>
                              <td style="padding:7px 0;text-align:right;font-size:14px;font-weight:500;color:#333">${notes}</td>
                            </tr>` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Billing Formula Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-collapse:separate;border-spacing:0 8px">
                    <tr>
                      <td style="background:#f0fdf4;border-radius:12px;padding:14px 18px;border:1px solid #bbf7d0">
                        <div style="font-size:10px;color:#047857;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:2px">How Your Final Cafe Bill Works</div>
                        <div style="font-size:13px;color:#065f46;line-height:1.5">
                          <strong>Final Bill = Total amount of food/drinks you eat in cafe + &#x20B9;140</strong> (which is &#x20B9;199 setup package minus &#x20B9;59 advance already paid).
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#faf8f5;border-radius:12px;padding:14px 18px;border:1px solid #e8e2d2">
                        <div style="font-size:10px;color:#5e5a50;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:2px">Location</div>
                        <div style="font-size:14px;font-weight:700;color:#0f3d3e">B.M. Patil Circle, Ring Road, Vijayapura</div>
                      </td>
                    </tr>
                  </table>

                  <!-- WhatsApp Button -->
                  <div style="text-align:center;margin-bottom:24px">
                    <a href="https://wa.me/919945446137?text=Hi%20The%20Moras%20Cafe%2C%20regarding%20my%20birthday%20booking%20%23TMC-BDAY-${refCode}" 
                       style="display:inline-block;background:linear-gradient(135deg,#0f3d3e,#185c5d);color:#fff;text-decoration:none;padding:14px 28px;border-radius:50px;font-weight:700;font-size:14px;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(15,61,62,0.25);border:2px solid #fbbf24">
                      &#x1F4AC; WhatsApp Birthday Coordinator
                    </a>
                  </div>

                  <!-- Directions Footer -->
                  <div style="background:#faf8f5;border-radius:12px;padding:14px;text-align:center;border:1px solid #e8e2d2">
                    <p style="color:#5e5a50;font-size:12px;line-height:1.6;margin:0">
                      &#x1F4CD; Google Maps: <a href="https://www.google.com/maps/search/?api=1&query=The+Moras+Cafe+B+M+Patil+Circle+Vijayapura" style="color:#0f3d3e;font-weight:700">Get Directions</a> &middot;
                      &#x1F4DE; Host Desk: <a href="tel:+919945446137" style="color:#0f3d3e;font-weight:700">+91 99454 46137</a>
                    </p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background:#0f3d3e;padding:20px 28px;text-align:center;border-top:3px solid #fbbf24">
                  <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.7);line-height:1.6">
                    &copy; 2026 The Moras Cafe &middot; Vijayapura<br/>
                    Follow our celebrations on Instagram 
                    <a href="https://www.instagram.com/themorascafe/" style="color:#fbbf24;font-weight:700;text-decoration:none">@themorascafe</a>
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

// ── Plain-Text Birthday Email Template ────────────────────────────────────────
function buildReservationEmailText(reservationData) {
  const { 
    name = 'Guest', 
    date = '', 
    time = '', 
    guests = 1, 
    notes = '', 
    amount = 59, 
    packagePrice = 199,
    remainingBalance = 140,
    birthdayPerson = '',
    upiRef = '', 
    _id 
  } = reservationData;
  const refCode = _id ? String(_id).slice(-6).toUpperCase() : 'CONFIRMED';
  const celebrateWho = birthdayPerson || name;

  return `THE MORAS CAFE — Birthday Celebration Confirmed! 🎂✨

Dear ${name},

We are thrilled to host your birthday celebration for ${celebrateWho} at The Moras Cafe!

Booking Reference: #TMC-BDAY-${refCode}
Celebration For: ${celebrateWho}
Date: ${date}
Time Slot: ${time}
Number of People: ${guests} People
Birthday Setup Package: Rs.${packagePrice}
Advance Paid (UPI): Rs.${amount} (Confirmed)
Balance Setup Fee: Rs.${remainingBalance} (Payable at cafe)

IMPORTANT NOTE (CAKE POLICY):
🎂 Please bring your own birthday cake with you — we do not offer cakes!
We provide the illuminated Happy Birthday stand with ambient warm lights, table setup, plates, and cake knife.

BILLING CALCULATION:
Final Bill = Total amount of food/drinks ordered in cafe + Rs.140 (Rs.199 package - Rs.59 advance already paid).

Location: B.M. Patil Circle, Ring Rd, Solapur Bypass, Vijayapura, KA 586102
Contact: +91 99454 46137
WhatsApp: https://wa.me/919945446137?text=Hi%20The%20Moras%20Cafe%2C%20regarding%20my%20birthday%20booking%20%23TMC-BDAY-${refCode}
`;
}

// ── Multi-Tier Email Dispatch Engine ──────────────────────────────────────────
async function dispatchEmail({ to, toName, subject, htmlContent, textContent }) {
  if (!to) {
    console.log('[Email] No recipient email provided — skipping.');
    return { success: false, error: 'No recipient email provided' };
  }

  const errors = [];

  // 1️⃣ Priority: Brevo Transactional Email HTTPS API (Branded sender: orders@themorascafe.in)
  if (BREVO_API_KEY) {
    try {
      console.log(`[Email] Attempting Brevo HTTPS send from "${EMAIL_FROM_NAME}" <${EMAIL_FROM}> to ${to}...`);
      const brevoResult = await sendBrevoEmail({ to, toName, subject, htmlContent, textContent });
      console.log(`[Email] Confirmation sent via Brevo HTTPS API → ${to} | MessageID: ${brevoResult.messageId}`);
      return brevoResult;
    } catch (err) {
      errors.push(`Brevo Error: ${err.message}`);
      console.error('[Email] Brevo HTTPS send failed:', err.message);
      console.log('[Email] Falling back to secondary email provider...');
    }
  } else {
    errors.push('BREVO_API_KEY not configured');
  }

  // 2️⃣ Fallback: Google Apps Script HTTPS Proxy (Bypasses Render free tier SMTP blocks)
  if (GMAIL_PROXY_URL) {
    try {
      console.log(`[Email] Attempting Google HTTP Proxy send to ${to}...`);
      const result = await sendPostRequest(GMAIL_PROXY_URL, {
        to,
        subject,
        htmlBody: htmlContent,
        token: GMAIL_PROXY_TOKEN,
      });

      if (result && result.success) {
        console.log(`[Email] Confirmation sent via Google HTTP Proxy fallback → ${to}`);
        return { success: true, method: 'proxy', result };
      } else {
        throw new Error((result && result.error) || 'Proxy execution failed');
      }
    } catch (err) {
      errors.push(`Proxy Error: ${err.message}`);
      console.error('[Email] Google HTTP Proxy send failed:', err.message);
      console.log('[Email] Falling back to direct SMTP...');
    }
  } else {
    errors.push('GMAIL_PROXY_URL not configured');
  }

  // 3️⃣ Final Fallback: Direct SMTP (Gmail)
  if (!GMAIL_USER || !GMAIL_PASS) {
    errors.push('SMTP credentials not configured');
    console.warn('[Email] Direct SMTP credentials not set — skipping SMTP fallback.');
    return { success: false, errors };
  }

  const transporter = createTransporter();
  try {
    const info = await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${GMAIL_USER}>`,
      replyTo: EMAIL_REPLY_TO,
      to,
      subject,
      html: htmlContent,
      text: textContent || undefined,
      textEncoding: 'base64',
    });
    console.log(`[Email] Confirmation sent via SMTP fallback → ${to} | MessageID: ${info.messageId}`);
    return { success: true, method: 'smtp', info };
  } catch (err) {
    errors.push(`SMTP Error: ${err.message}`);
    console.error('[Email] Direct SMTP send failed:', err.message);
  }

  return { success: false, errors };
}

// ── Main Order Email ──────────────────────────────────────────────────────────
async function sendOrderEmail(orderData) {
  if (!orderData || !orderData.email) {
    console.log('[Email] No customer email provided for order — skipping.');
    return { success: false, error: 'No customer email provided' };
  }
  const refCode = orderData.orderId ? String(orderData.orderId).slice(-6).toUpperCase() : 'RECEIPT';
  const subject = `Tax Invoice & Bill Receipt (#TMC-INV-${refCode}) - The Moras Cafe 🧾`;
  const htmlContent = buildCustomerEmailHTML(orderData);
  const textContent = buildCustomerEmailText(orderData);
  return dispatchEmail({
    to: orderData.email,
    toName: orderData.name,
    subject,
    htmlContent,
    textContent,
  });
}

// ── Table Reservation Email ───────────────────────────────────────────────────
async function sendReservationEmail(reservationData) {
  if (!reservationData || !reservationData.email) {
    console.log('[Email] No customer email provided for reservation — skipping.');
    return { success: false, error: 'No customer email provided' };
  }
  const refCode = reservationData._id ? String(reservationData._id).slice(-6).toUpperCase() : 'CONFIRMED';
  const subject = `Birthday Celebration Confirmed (#TMC-BDAY-${refCode}) - The Moras Cafe 🎉`;
  const htmlContent = buildReservationEmailHTML(reservationData);
  const textContent = buildReservationEmailText(reservationData);
  return dispatchEmail({
    to: reservationData.email,
    toName: reservationData.name,
    subject,
    htmlContent,
    textContent,
  });
}

// ── Test Delivery Function (Internal Validation) ──────────────────────────────
async function sendTestEmail({ to }) {
  if (!to) {
    throw new Error('Recipient email is required for test email');
  }
  const subject = `Test Delivery: Branded Email Verification - THE MORAS CAFE`;
  const htmlContent = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 24px; color: #2d2d2d; max-width: 560px; margin: 0 auto; border: 1px solid #e8e2d2; border-radius: 12px; background: #faf8f5;">
      <h2 style="color: #0f3d3e; margin-top: 0;">THE MORAS CAFE — Branded Email Verification</h2>
      <p style="font-size: 15px; line-height: 1.6;">
        This is an internal delivery test dispatched from THE MORAS CAFE backend email subsystem.
      </p>
      <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e8e2d2; margin: 16px 0;">
        <div style="margin-bottom: 8px;"><strong>Configured Sender:</strong> ${EMAIL_FROM_NAME} &lt;${EMAIL_FROM}&gt;</div>
        <div style="margin-bottom: 8px;"><strong>Configured Reply-To:</strong> ${EMAIL_REPLY_TO}</div>
        <div><strong>Active Primary Service:</strong> ${BREVO_API_KEY ? 'Brevo HTTPS API' : 'Google Proxy / SMTP Fallback'}</div>
      </div>
      <p style="font-size: 13px; color: #666; margin-bottom: 0;">
        Timestamp: ${new Date().toISOString()} &middot; Environment: ${process.env.NODE_ENV || 'development'}
      </p>
    </div>
  `;
  const textContent = `THE MORAS CAFE — Branded Email Verification\n\nThis is an internal delivery test dispatched from THE MORAS CAFE backend.\nSender: ${EMAIL_FROM_NAME} <${EMAIL_FROM}>\nReply-To: ${EMAIL_REPLY_TO}\nActive Service: ${BREVO_API_KEY ? 'Brevo HTTPS API' : 'Fallback System'}\nTimestamp: ${new Date().toISOString()}`;

  return dispatchEmail({
    to,
    toName: 'Internal Tester',
    subject,
    htmlContent,
    textContent,
  });
}

// ── Export Configuration Diagnostic ───────────────────────────────────────────
function getEmailConfigDiagnostic() {
  return {
    emailFrom: EMAIL_FROM,
    emailFromName: EMAIL_FROM_NAME,
    emailReplyTo: EMAIL_REPLY_TO,
    hasBrevoKey: Boolean(BREVO_API_KEY),
    brevoKeyPrefix: BREVO_API_KEY ? `${BREVO_API_KEY.slice(0, 8)}...` : 'not_set',
    hasGmailProxy: Boolean(GMAIL_PROXY_URL),
    hasSmtpUser: Boolean(GMAIL_USER),
  };
}

module.exports = {
  sendOrderEmail,
  sendReservationEmail,
  sendTestEmail,
  getEmailConfigDiagnostic,
};
