const express = require('express');
const Order = process.env.USE_MOCK_DB === 'true' ? require('../config/mockDb').Order : require('../models/Order');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, phone, address, items, total, payment } = req.body;
    if (!name || !phone || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid order payload' });
    }

    const normalizedItems = items.map((item) => ({
      name: item.name,
      qty: Number(item.qty) || 1,
      price: Number(item.price) || 0,
      variant: item.variant || '',
    }));

    const newOrder = await Order.create({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      items: normalizedItems,
      total: Number(total) || 0,
      status: 'pending',
      createdAt: new Date(),
      payment: payment || 'cod',
    });

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Could not create order', error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = process.env.USE_MOCK_DB === 'true' ? await Order.find() : await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Could not fetch orders', error: error.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
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
    res.status(500).json({ message: 'Could not update order', error: error.message });
  }
});

module.exports = router;
