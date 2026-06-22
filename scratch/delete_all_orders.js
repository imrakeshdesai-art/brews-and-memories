const mongoose = require('mongoose');
const Order = require('../backend/src/models/Order');

const uri = 'mongodb+srv://testuser:Brew%40Cafe%2394821%21Admin@cluster0.u5jjdfm.mongodb.net/brews-memories?retryWrites=true&w=majority';

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB successfully!');

  // Check the number of orders before deleting
  const countBefore = await Order.countDocuments({});
  console.log(`Current total orders in database: ${countBefore}`);

  if (countBefore > 0) {
    console.log('Deleting all orders...');
    const result = await Order.deleteMany({});
    console.log(`Deleted ${result.deletedCount} orders.`);
  } else {
    console.log('No orders to delete.');
  }

  await mongoose.disconnect();
  console.log('Disconnected from DB.');
}

main().catch(error => {
  console.error('Error during cleanup:', error);
  process.exit(1);
});
