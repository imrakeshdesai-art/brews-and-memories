const mongoose = require('mongoose');
const Order = require('./models/Order');

const uri = 'mongodb+srv://testuser:Brew%40Cafe%2394821%21Admin@cluster0.u5jjdfm.mongodb.net/brews-memories?retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');
  
  const orderId = '6a1f079ca92fbf30a6ce8f07';
  const order = await Order.findById(orderId);
  console.log('ORDER:', JSON.stringify(order, null, 2));
  
  // Also query the 3 most recent orders
  const recent = await Order.find().sort({ createdAt: -1 }).limit(3);
  console.log('3 RECENT ORDERS:', JSON.stringify(recent, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
