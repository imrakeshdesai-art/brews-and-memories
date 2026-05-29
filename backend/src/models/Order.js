const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  variant: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true },
  address: { type: String, required: true, trim: true },
  items: { type: [itemSchema], default: [] },
  total: { type: Number, required: true, min: 0 },
  payment: { type: String, required: true, trim: true, default: 'cod' },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'completed'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
