const twilio = require('twilio');
const http = require('http');
const https = require('https');

// ── Config ──────────────────────────────────────────────────────────────────
const ACCOUNT_SID   = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN    = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER   = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox default
const NOTIFY_PHONE  = process.env.NOTIFY_WHATSAPP_PHONE; // Owner/café number e.g. 916361679241

const OPENWA_URL       = process.env.OPENWA_URL;
const OPENWA_API_KEY   = process.env.OPENWA_API_KEY;
const OPENWA_SESSION_ID = process.env.OPENWA_SESSION_ID || 'default';

// ── Helper: format Indian phone to WhatsApp address ─────────────────────────
function toWhatsApp(phone) {
  const digits = String(phone).replace(/\D/g, '');
  // Already has country code
  if (digits.length === 12 && digits.startsWith('91')) return `whatsapp:+${digits}`;
  // 10-digit Indian number
  if (digits.length === 10) return `whatsapp:+91${digits}`;
  return `whatsapp:+${digits}`;
}

// ── Helper: Send message via OpenWA Gateway ──────────────────────────────────
function sendOpenWAMessage(url, apiKey, sessionId, toPhone, text) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const requestLib = isHttps ? https : http;

      // format number to <country_code><digits>@c.us
      const digits = String(toPhone).replace(/\D/g, '');
      let formattedPhone = digits;
      if (digits.length === 10) {
        formattedPhone = '91' + digits; // default to India code if 10 digits
      }
      const chatId = `${formattedPhone}@c.us`;

      const postData = JSON.stringify({
        chatId: chatId,
        text: text
      });

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: `/api/sessions/${sessionId}/messages/send-text`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-API-Key': apiKey
        },
        timeout: 10000 // 10 seconds
      };

      const req = requestLib.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          console.log(`[WhatsApp-OpenWA] Response status=${res.statusCode} body=${body}`);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              resolve({ success: true, body });
            }
          } else {
            reject(new Error(`OpenWA server returned status ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('OpenWA connection timed out (10s)'));
      });

      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ── Format order items list ──────────────────────────────────────────────────
function formatItems(items) {
  return items
    .map((item) => {
      const variant = item.variant ? ` (${item.variant})` : '';
      return `  • ${item.name}${variant} × ${item.qty}  —  ₹${item.price * item.qty}`;
    })
    .join('\n');
}

// ── Customer confirmation message ────────────────────────────────────────────
function buildCustomerMessage({ name, items, total }) {
  return `✅ *Order Confirmed — Brews & Memories*

Hi ${name}! 👋

Your order has been received and is being prepared right now.

🧾 *Order Summary:*
${formatItems(items)}

💰 *Total: ₹${total}*
📍 *B.M. Patil Circle, Vijayapura*
🕐 *Open: 10:00 AM – 10:30 PM*

Thank you for choosing us! ☕🍕
— *Brews & Memories Team*`;
}

// ── Owner/café alert message ─────────────────────────────────────────────────
function buildOwnerMessage({ name, phone, address, items, total, payment }) {
  return `🔔 *New Order Received!*

👤 *Customer:* ${name}
📞 *Phone:* ${phone}
📍 *Address:* ${address}
💳 *Payment:* ${payment.toUpperCase()}

🧾 *Items:*
${formatItems(items)}

💰 *Total: ₹${total}*

Reply on WhatsApp to confirm with customer.`;
}

// ── Main send function ───────────────────────────────────────────────────────
async function sendOrderWhatsApp(orderData) {
  const results = [];
  const isOpenWAConfigured = !!(OPENWA_URL && OPENWA_API_KEY);
  let openWASuccess = false;

  // 1️⃣ Try OpenWA first if configured
  if (isOpenWAConfigured) {
    try {
      console.log(`[WhatsApp] Attempting send via OpenWA to customer ${orderData.phone}...`);
      
      // Send confirmation to customer
      const customerMsg = buildCustomerMessage(orderData);
      const customerRes = await sendOpenWAMessage(
        OPENWA_URL,
        OPENWA_API_KEY,
        OPENWA_SESSION_ID,
        orderData.phone,
        customerMsg
      );
      console.log(`[WhatsApp] OpenWA customer confirmation sent to ${orderData.phone}`);
      results.push({ gateway: 'openwa', to: 'customer', status: 'success', response: customerRes });

      // Send alert to owner if configured
      if (NOTIFY_PHONE) {
        console.log(`[WhatsApp] Attempting send via OpenWA to owner ${NOTIFY_PHONE}...`);
        const ownerMsg = buildOwnerMessage(orderData);
        const ownerRes = await sendOpenWAMessage(
          OPENWA_URL,
          OPENWA_API_KEY,
          OPENWA_SESSION_ID,
          NOTIFY_PHONE,
          ownerMsg
        );
        console.log(`[WhatsApp] OpenWA owner alert sent to ${NOTIFY_PHONE}`);
        results.push({ gateway: 'openwa', to: 'owner', status: 'success', response: ownerRes });
      }

      openWASuccess = true;
    } catch (err) {
      console.error('[WhatsApp] OpenWA sending failed, falling back to Twilio if available:', err.message);
    }
  }

  // 2️⃣ Fallback to Twilio Sandbox if OpenWA failed or was not configured
  if (!openWASuccess) {
    if (!ACCOUNT_SID || !AUTH_TOKEN) {
      console.warn('[WhatsApp] Twilio credentials not set and OpenWA failed/not-configured — skipping WhatsApp notification.');
      return results;
    }

    console.log('[WhatsApp] Proceeding with Twilio Sandbox dispatch...');
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

    // Send confirmation to customer
    try {
      const customerTo = toWhatsApp(orderData.phone);
      const msg = await client.messages.create({
        from: FROM_NUMBER,
        to: customerTo,
        body: buildCustomerMessage(orderData),
      });
      console.log(`[WhatsApp-Twilio] Customer confirmation sent → ${customerTo} | SID: ${msg.sid}`);
      results.push({ gateway: 'twilio', to: 'customer', sid: msg.sid });
    } catch (err) {
      console.error('[WhatsApp-Twilio] Failed to send customer message:', err.message);
    }

    // Send alert to café owner/notify number (if configured)
    if (NOTIFY_PHONE) {
      try {
        const ownerTo = toWhatsApp(NOTIFY_PHONE);
        const msg = await client.messages.create({
          from: FROM_NUMBER,
          to: ownerTo,
          body: buildOwnerMessage(orderData),
        });
        console.log(`[WhatsApp-Twilio] Owner alert sent → ${ownerTo} | SID: ${msg.sid}`);
        results.push({ gateway: 'twilio', to: 'owner', sid: msg.sid });
      } catch (err) {
        console.error('[WhatsApp-Twilio] Failed to send owner alert:', err.message);
      }
    }
  }

  return results;
}

module.exports = { sendOrderWhatsApp };
