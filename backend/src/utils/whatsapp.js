const twilio = require('twilio');

// ── Config ──────────────────────────────────────────────────────────────────
const ACCOUNT_SID   = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN    = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER   = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox default
const NOTIFY_PHONE  = process.env.NOTIFY_WHATSAPP_PHONE; // Owner/café number e.g. 916361679241

// ── Helper: format Indian phone to WhatsApp address ─────────────────────────
function toWhatsApp(phone) {
  const digits = String(phone).replace(/\D/g, '');
  // Already has country code
  if (digits.length === 12 && digits.startsWith('91')) return `whatsapp:+${digits}`;
  // 10-digit Indian number
  if (digits.length === 10) return `whatsapp:+91${digits}`;
  return `whatsapp:+${digits}`;
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
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    console.warn('[WhatsApp] Twilio credentials not set — skipping WhatsApp notification.');
    return;
  }

  const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
  const results = [];

  // 1️⃣  Send confirmation to customer
  try {
    const customerTo = toWhatsApp(orderData.phone);
    const msg = await client.messages.create({
      from: FROM_NUMBER,
      to: customerTo,
      body: buildCustomerMessage(orderData),
    });
    console.log(`[WhatsApp] Customer confirmation sent → ${customerTo} | SID: ${msg.sid}`);
    results.push({ to: 'customer', sid: msg.sid });
  } catch (err) {
    console.error('[WhatsApp] Failed to send customer message:', err.message);
  }

  // 2️⃣  Send alert to café owner/notify number (if configured)
  if (NOTIFY_PHONE) {
    try {
      const ownerTo = toWhatsApp(NOTIFY_PHONE);
      const msg = await client.messages.create({
        from: FROM_NUMBER,
        to: ownerTo,
        body: buildOwnerMessage(orderData),
      });
      console.log(`[WhatsApp] Owner alert sent → ${ownerTo} | SID: ${msg.sid}`);
      results.push({ to: 'owner', sid: msg.sid });
    } catch (err) {
      console.error('[WhatsApp] Failed to send owner alert:', err.message);
    }
  }

  return results;
}

module.exports = { sendOrderWhatsApp };
