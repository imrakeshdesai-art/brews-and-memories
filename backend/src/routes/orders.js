const crypto = require('crypto');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const express = require('express');
const router = express.Router();

const Order = require('../models/Order');
const MenuAvailability = require('../models/MenuAvailability');
const { calculateOrderTotal } = require('../data/menuCatalog');
const { sendOrderWhatsApp } = require('../utils/whatsapp');
const { sendOrderEmail } = require('../utils/email');

// Dedicated rate limiter for order tracking endpoint (30 requests per minute per IP)
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many tracking requests. Please slow down.' },
});


/**
 * Canonicalizes an array of items for order comparison.
 * Normalizes item names to lowercase, variants to uppercase, and sorts deterministically.
 */
function canonicalizeOrderItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      name: String(item.name || '').trim().toLowerCase(),
      variant: String(item.variant || '').trim().toUpperCase(),
      qty: Number(item.qty || 0),
      price: Number(item.price || 0),
    }))
    .sort((a, b) => {
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      const variantCmp = a.variant.localeCompare(b.variant);
      if (variantCmp !== 0) return variantCmp;
      return a.qty - b.qty;
    });
}

/**
 * Compares an existing order document against an incoming order payload.
 * Verifies that customer identity, delivery table, payment mode, calculated total,
 * and canonical item list (names, variants, quantities) are identical.
 */
function isOrderPayloadEquivalent(existingOrder, incoming) {
  const { name, normalizedPhone, email, address, calculation, payment } = incoming;

  // 1. Customer identity and delivery table
  const phoneMatch = String(existingOrder.phone || '').trim() === normalizedPhone;
  const addressMatch = String(existingOrder.address || '').trim() === address.trim();
  const nameMatch = String(existingOrder.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase();
  const emailMatch = String(existingOrder.email || '').trim().toLowerCase() === String(email || '').trim().toLowerCase();

  // 2. Payment method
  const incomingPayment = String(payment || 'counter').trim().toLowerCase();
  const existingPayment = String(existingOrder.payment || 'counter').trim().toLowerCase();
  const paymentMatch = existingPayment === incomingPayment;

  if (!phoneMatch || !addressMatch || !nameMatch || !emailMatch || !paymentMatch) {
    return false;
  }

  // 3. Total amount
  if (Math.abs(Number(existingOrder.total) - Number(calculation.total)) > 0.01) {
    return false;
  }

  // 4. Detailed item verification (names, variants, quantities)
  const existingItems = canonicalizeOrderItems(existingOrder.items);
  const incomingItems = canonicalizeOrderItems(calculation.items);

  if (existingItems.length !== incomingItems.length) {
    return false;
  }

  for (let i = 0; i < existingItems.length; i++) {
    const a = existingItems[i];
    const b = incomingItems[i];
    if (a.name !== b.name || a.variant !== b.variant || a.qty !== b.qty) {
      return false;
    }
  }

  return true;
}

// ==================== CREATE ORDER ====================
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, items, total, payment } = req.body;
    const rawIdempotencyKey = req.body.idempotencyKey || req.headers['x-idempotency-key'] || req.headers['idempotency-key'];

    // 🔒 Strong validation
    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate table number structure (e.g. "Table 1" to "Table X")
    const totalTables = Number(process.env.TOTAL_TABLES) || 5;
    const allowedTables = Array.from(
      { length: totalTables },
      (_, i) => `Table ${i + 1}`
    );
    if (!allowedTables.includes(address.trim())) {
      return res.status(400).json({ message: 'Invalid Table Number' });
    }

    // Normalize phone number: remove all non-digits, strip India country code if 12 digits
    const cleanPhone = String(phone).replace(/\D/g, '');
    const normalizedPhone = (cleanPhone.length === 12 && cleanPhone.startsWith('91'))
      ? cleanPhone.slice(2)
      : cleanPhone;

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    // ==================== SERVER-SIDE PRICE & ITEM VALIDATION ====================
    // Never trust client prices or client totals!
    const calculation = calculateOrderTotal(items);
    if (!calculation.valid) {
      return res.status(400).json({ message: calculation.reason });
    }

    // Check for client-side price tampering or stale cart mismatch
    if (total !== undefined && total !== null && total !== '') {
      const clientTotal = Number(total);
      if (isNaN(clientTotal) || Math.abs(clientTotal - calculation.total) > 0.01) {
        return res.status(400).json({
          message: `Price discrepancy detected: client total ₹${clientTotal} does not match authoritative menu total ₹${calculation.total}. Please refresh your cart.`,
        });
      }
    }

    // ==================== PERSISTENT IDEMPOTENCY ====================
    let idempotencyKey = rawIdempotencyKey ? String(rawIdempotencyKey).trim() : null;
    if (!idempotencyKey) {
      // 15-second collision window to protect rapid double-clicks if client omitted key
      const windowTime = Math.floor(Date.now() / 15000);
      const fingerprint = `${normalizedPhone}|${address.trim()}|${JSON.stringify(calculation.items)}|${windowTime}`;
      idempotencyKey = crypto.createHash('sha256').update(fingerprint).digest('hex');
    }

    // Check if an order with this idempotency key was already created
    const existingOrder = await Order.findOne({ idempotencyKey });
    if (existingOrder) {
      // Verify complete payload to enforce idempotency contract
      const isMatch = isOrderPayloadEquivalent(existingOrder, {
        name,
        normalizedPhone,
        email,
        address,
        calculation,
        payment,
      });

      if (!isMatch) {
        return res.status(409).json({
          message: 'Idempotency key was previously used with different order details.',
        });
      }

      return res.status(200).set('X-Idempotent-Replay', 'true').json(existingOrder);
    }

    // ==================== LIVE AVAILABILITY ENFORCEMENT ====================
    let soldOutDocs = [];
    if (mongoose.connection.readyState === 1 || MenuAvailability._isMocked) {
      soldOutDocs = await MenuAvailability.find({ isAvailable: false }).lean();
    }
    if (soldOutDocs.length > 0) {
      const unavailableSet = new Set(soldOutDocs.map((d) => d.itemKey));
      const unavailableFound = [];

      for (const item of calculation.items) {
        const itemKey = String(item.name || '').trim().toLowerCase();
        if (unavailableSet.has(itemKey)) {
          unavailableFound.push(item.name);
        }
      }

      if (unavailableFound.length > 0) {
        const uniqueNames = [...new Set(unavailableFound)];
        return res.status(400).json({
          message: `Item "${uniqueNames.join(', ')}" is currently sold out and unavailable.`,
          code: 'ITEM_UNAVAILABLE',
          unavailableItems: uniqueNames,
        });
      }
    }

    // Generate cryptographically secure 32-byte tracking token (256 bits entropy)
    const rawTrackingToken = crypto.randomBytes(32).toString('hex');
    const trackingTokenHash = crypto.createHash('sha256').update(rawTrackingToken).digest('hex');

    let newOrder;
    try {
      newOrder = await Order.create({
        name: name.trim(),
        phone: normalizedPhone,
        email: (email || '').trim().toLowerCase(),
        address: address.trim(),
        items: calculation.items,
        total: calculation.total,
        payment: payment || 'counter',
        status: 'pending',
        trackingTokenHash,
        idempotencyKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (createErr) {
      // Concurrency race: an identical order with this idempotency key was written concurrently
      if (createErr.code === 11000 && (createErr.keyPattern?.idempotencyKey || String(createErr.message).includes('idempotencyKey'))) {
        const racedOrder = await Order.findOne({ idempotencyKey });
        if (racedOrder) {
          const isMatch = isOrderPayloadEquivalent(racedOrder, {
            name,
            normalizedPhone,
            email,
            address,
            calculation,
            payment,
          });
          if (!isMatch) {
            return res.status(409).json({
              message: 'Idempotency key was previously used with different order details.',
            });
          }
          return res.status(200).set('X-Idempotent-Replay', 'true').json(racedOrder);
        }
      }
      throw createErr;
    }

    const orderResponse = typeof newOrder.toObject === 'function' ? newOrder.toObject() : { ...newOrder };
    delete orderResponse.trackingTokenHash;
    orderResponse.trackingToken = rawTrackingToken;
    orderResponse.trackingUrl = `/track/${newOrder._id}#token=${rawTrackingToken}`;

    res.status(201).json(orderResponse);

    // 📲 Fire WhatsApp notifications (non-blocking — never fails the order)
    sendOrderWhatsApp({
      name:    newOrder.name,
      phone:   newOrder.phone,
      address: newOrder.address,
      items:   newOrder.items,
      total:   newOrder.total,
      payment: newOrder.payment,
    }).catch((err) => console.error('[WhatsApp] Unexpected error:', err.message));

    // 📧 Fire email confirmation to customer (if provided)
    if (newOrder.email && newOrder.email.trim()) {
      sendOrderEmail({
        name:          newOrder.name,
        email:         newOrder.email.trim(),
        orderId:       newOrder._id,
        address:       newOrder.address,
        items:         newOrder.items,
        total:         newOrder.total,
        payment:       newOrder.payment,
        trackingToken: rawTrackingToken,
      }).catch((err) => console.error('[Email Customer] Unexpected error:', err.message));
    }

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Could not create order' });
  }
});




// ==================== GET ALL ORDERS ====================
router.get('/', auth, checkRole(['admin', 'kitchen']), async (req, res) => {
  try {
    const orders = await Order.find().select('-trackingTokenHash').sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ message: 'Could not fetch orders' });
  }
});


// ==================== UPDATE ORDER STATUS ====================
router.patch('/:id', auth, checkRole(['admin', 'kitchen']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'preparing', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(updatedOrder);

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Could not update order' });
  }
});

// ==================== SEND BILL RECEIPT TO CUSTOMER EMAIL ====================
router.post('/:id/send-bill', auth, checkRole(['admin', 'kitchen']), async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const targetEmail = (email || order.email || '').trim().toLowerCase();
    if (!targetEmail) {
      return res.status(400).json({ message: 'Customer email address is required to send the bill' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!order.email || order.email !== targetEmail) {
      order.email = targetEmail;
      await order.save();
    }

    const result = await sendOrderEmail({
      name: order.name,
      email: targetEmail,
      orderId: order._id,
      address: order.address,
      items: order.items,
      total: order.total,
      payment: order.payment,
      trackingToken: '',
    });

    if (result && result.success === false) {
      return res.status(500).json({ message: 'Failed to send bill email', error: result.error || result.errors });
    }

    res.json({ message: `Bill receipt sent successfully to ${targetEmail}`, order });
  } catch (error) {
    console.error('Send bill email error:', error);
    res.status(500).json({ message: 'Could not send bill email' });
  }
});





// ==================== LIVE CUSTOMER ORDER TRACKING ====================
// Authenticates tracking requests via X-Tracking-Token header
// Returns strictly sanitized operational data (ZERO customer PII)
router.get('/track/:id', trackLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const rawToken = req.headers['x-tracking-token'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');

    // Validate MongoDB ObjectId format and non-empty token string
    if (!mongoose.Types.ObjectId.isValid(id) || !rawToken || typeof rawToken !== 'string') {
      return res.status(404).json({ message: 'Order not found' });
    }

    const trimmedToken = rawToken.trim();
    if (trimmedToken.length < 16) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Compute SHA-256 hash of provided token
    const tokenHash = crypto.createHash('sha256').update(trimmedToken).digest('hex');

    // Query order ensuring trackingTokenHash matches
    const order = await Order.findOne({ _id: id, trackingTokenHash: tokenHash });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Return strictly sanitized operational data (NO name, phone, email, total, payment)
    return res.json({
      orderId: String(order._id),
      status: order.status,
      table: order.address,
      items: (order.items || []).map((item) => ({
        name: item.name,
        variant: item.variant || '',
        qty: item.qty,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt || order.createdAt,
    });
  } catch (error) {
    console.error('Order tracking lookup error:', error.message);
    res.status(500).json({ message: 'Could not fetch order tracking details' });
  }
});

// ==================== DELETE ALL ORDERS ====================
router.delete('/clean-all-tests', auth, checkRole(['admin']), async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    res.json({ message: 'All test orders deleted successfully', count: result.deletedCount });
  } catch (error) {
    console.error('Clean orders error:', error);
    res.status(500).json({ message: 'Could not delete test orders', error: error.message });
  }
});


// ==================== EXPORT ====================
module.exports = router;