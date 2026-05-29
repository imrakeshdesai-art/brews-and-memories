const nodemailer = require('nodemailer');

// ── Config ───────────────────────────────────────────────────────────────────
const GMAIL_USER = process.env.GMAIL_USER;   // e.g. brewsandmemories@gmail.com
const GMAIL_PASS = process.env.GMAIL_APP_PASS; // Gmail App Password (16 chars)

// ── Transporter ──────────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });
}

// ── Format items as HTML rows ─────────────────────────────────────────────────
function buildItemRows(items) {
  return items.map((item) => {
    const variant = item.variant ? ` <span style="color:#888;font-size:13px">(${item.variant})</span>` : '';
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ece0;font-size:15px;color:#2d2d2d">
          ${item.name}${variant} × ${item.qty}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ece0;text-align:right;font-weight:700;color:#1a4a3a;font-size:15px">
          ₹${item.price * item.qty}
        </td>
      </tr>`;
  }).join('');
}

// ── HTML Email Template ───────────────────────────────────────────────────────
function buildCustomerEmailHTML({ name, items, total, payment, address, orderId }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Order Confirmed — Brews & Memories</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a4a3a 0%,#2d6b54 100%);padding:36px 32px;text-align:center">
      <div style="font-size:40px;margin-bottom:8px">☕</div>
      <div style="color:#fbbf24;font-size:13px;letter-spacing:3px;text-transform:uppercase;font-weight:700;margin-bottom:6px">Brews & Memories</div>
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800">Order Confirmed! 🎉</h1>
      <p style="color:rgba(255,255,255,0.8);margin:10px 0 0;font-size:14px">Vijayapura's Favourite Cozy Café</p>
    </div>

    <!-- Body -->
    <div style="padding:32px">

      <p style="color:#2d2d2d;font-size:16px;margin:0 0 24px">
        Hi <strong>${name}</strong>! 👋<br/><br/>
        Thank you for your order. We've received it and our team is preparing everything fresh for you right now!
      </p>

      <!-- Order Details Box -->
      <div style="background:#f9f6ef;border-radius:12px;padding:20px 24px;margin-bottom:24px;border:1px solid #e8e0cc">
        <div style="font-size:12px;color:#888;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:4px">Order ID</div>
        <div style="font-size:14px;color:#1a4a3a;font-weight:700;font-family:monospace;margin-bottom:16px">${orderId}</div>
        
        <table width="100%" cellpadding="0" cellspacing="0">
          ${buildItemRows(items)}
          <tr>
            <td style="padding:14px 0 0;font-size:16px;font-weight:800;color:#1a4a3a">Total</td>
            <td style="padding:14px 0 0;text-align:right;font-size:20px;font-weight:900;color:#1a4a3a">₹${total}</td>
          </tr>
        </table>
      </div>

      <!-- Info Grid -->
      <div style="display:flex;gap:12px;margin-bottom:24px">
        <div style="flex:1;background:#f0fdf4;border-radius:10px;padding:14px;border:1px solid #bbf7d0;text-align:center">
          <div style="font-size:22px">💳</div>
          <div style="font-size:11px;color:#888;margin:4px 0 2px;text-transform:uppercase;letter-spacing:1px">Payment</div>
          <div style="font-size:14px;font-weight:700;color:#1a4a3a">${payment.toUpperCase()}</div>
        </div>
        <div style="flex:1;background:#fff7ed;border-radius:10px;padding:14px;border:1px solid #fed7aa;text-align:center">
          <div style="font-size:22px">🪑</div>
          <div style="font-size:11px;color:#888;margin:4px 0 2px;text-transform:uppercase;letter-spacing:1px">Table</div>
          <div style="font-size:14px;font-weight:700;color:#1a4a3a">${address}</div>
        </div>
        <div style="flex:1;background:#fdf4ff;border-radius:10px;padding:14px;border:1px solid #e9d5ff;text-align:center">
          <div style="font-size:22px">🕐</div>
          <div style="font-size:11px;color:#888;margin:4px 0 2px;text-transform:uppercase;letter-spacing:1px">Hours</div>
          <div style="font-size:14px;font-weight:700;color:#1a4a3a">10AM–10:30PM</div>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px">
        <a href="https://brews-and-memories.vercel.app" 
           style="display:inline-block;background:linear-gradient(135deg,#1a4a3a,#2d6b54);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px">
          🍕 Order Again
        </a>
      </div>

      <p style="color:#888;font-size:13px;text-align:center;line-height:1.6;margin:0">
        Questions? WhatsApp us at <strong>+91 99454 46137</strong><br/>
        📍 B.M. Patil Circle, Vijayapura, Karnataka
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9f6ef;padding:20px 32px;text-align:center;border-top:1px solid #e8e0cc">
      <p style="margin:0;font-size:12px;color:#aaa">
        © 2026 Brews & Memories Café · Vijayapura<br/>
        Follow us on 
        <a href="https://www.instagram.com/brews_and_memories_/" style="color:#1a4a3a;font-weight:700;text-decoration:none">@brews_and_memories_</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Main send function ────────────────────────────────────────────────────────
async function sendOrderEmail(orderData) {
  if (!GMAIL_USER || !GMAIL_PASS) {
    console.warn('[Email] Gmail credentials not set — skipping email notification.');
    return;
  }
  if (!orderData.email) {
    console.log('[Email] No customer email provided — skipping.');
    return;
  }

  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: `"Brews & Memories ☕" <${GMAIL_USER}>`,
      to: orderData.email,
      subject: `✅ Order Confirmed — Brews & Memories (#${String(orderData.orderId).slice(-6)})`,
      html: buildCustomerEmailHTML(orderData),
    });
    console.log(`[Email] Confirmation sent → ${orderData.email} | MessageID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
  }
}

module.exports = { sendOrderEmail };
