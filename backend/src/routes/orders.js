const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();

const Order = process.env.USE_MOCK_DB === 'true'
  ? require('../config/mockDb').Order
  : require('../models/Order');


// ==================== CREATE ORDER ====================
router.post('/', async (req, res) => {
  try {
    const { name, phone, address, items, total, payment } = req.body;

    // 🔒 Strong validation
    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!/^\d{10}$/.test(phone)) {
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
      phone: phone.trim(),
      address: address.trim(),
      items: normalizedItems,
      total: Number(total),
      payment: payment || 'cod',
      status: 'pending',
      createdAt: new Date(),
    });

    res.status(201).json(newOrder);

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Could not create order' });
  }
});


// ==================== GET ALL ORDERS ====================
router.get('/', auth, async (req, res) => {
  try {
    const orders = process.env.USE_MOCK_DB === 'true'
      ? await Order.find()
      : await Order.find().sort({ createdAt: -1 });

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


// ==================== EXPORT ====================
module.exports = router;