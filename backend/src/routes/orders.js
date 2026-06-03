const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();

const Order = require('../models/Order');
const { sendOrderWhatsApp } = require('../utils/whatsapp');
const { sendOrderEmail } = require('../utils/email');


// ==================== CREATE ORDER ====================
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, items, total, payment } = req.body;

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

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    if (items.some(i => !i.name || Number(i.qty) < 1 || Number(i.price) < 0)) {
      return res.status(400).json({ message: 'Invalid item data' });
    }

    if (Number(total) <= 0) {
      return res.status(400).json({ message: 'Invalid total amount' });
    }

    // Normalize items
    const normalizedItems = items.map((item) => ({
      name: String(item.name).trim(),
      qty: Number(item.qty),
      price: Number(item.price),
      variant: item.variant || '',
    }));

    const newOrder = await Order.create({
      name: name.trim(),
      phone: normalizedPhone,
      email: (email || '').trim().toLowerCase(),
      address: address.trim(),
      items: normalizedItems,
      total: Number(total),
      payment: payment || 'cod',
      status: 'pending',
      createdAt: new Date(),
    });

    res.status(201).json(newOrder);

    // 📲 Fire WhatsApp notifications (non-blocking — never fails the order)
    sendOrderWhatsApp({
      name:    newOrder.name,
      phone:   newOrder.phone,
      address: newOrder.address,
      items:   newOrder.items,
      total:   newOrder.total,
      payment: newOrder.payment,
    }).catch((err) => console.error('[WhatsApp] Unexpected error:', err.message));

    // 📧 Fire email confirmation (non-blocking — never fails the order)
    sendOrderEmail({
      name:    newOrder.name,
      email:   newOrder.email,
      orderId: newOrder._id,
      address: newOrder.address,
      items:   newOrder.items,
      total:   newOrder.total,
      payment: newOrder.payment,
    }).catch((err) => console.error('[Email] Unexpected error:', err.message));

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Could not create order' });
  }
});




// ==================== GET ALL ORDERS ====================
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ message: 'Could not fetch orders' });
  }
});


// ==================== UPDATE ORDER STATUS ====================
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'preparing', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
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



// ==================== DELETE ALL ORDERS ====================
router.delete('/clean-all-tests', auth, async (req, res) => {
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