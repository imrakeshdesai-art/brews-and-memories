const crypto = require('crypto');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const express = require('express');
const router = express.Router();

const Order = require('../models/Order');
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
      return res.status(200).set('X-Idempotent-Replay', 'true').json(existingOrder);
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