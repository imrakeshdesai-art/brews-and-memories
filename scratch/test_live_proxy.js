const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const { sendOrderEmail } = require('../backend/src/utils/email');

async function test() {
  console.log('PROXY URL:', process.env.GMAIL_PROXY_URL || process.env.GMAIL_PROXY_URI);
  console.log('PROXY TOKEN:', process.env.GMAIL_PROXY_TOKEN);
  
  const orderData = {
    name: "Test Emoji User 🎉",
    email: "brewsandmemoriescafe@gmail.com",
    orderId: "6a272301b09af2598d223571",
    address: "Table 3 🪑",
    items: [
      { name: "Chocolate Milk Shake 🥤", qty: 1, price: 139 }
    ],
    total: 139,
    payment: "counter"
  };
  
  const result = await sendOrderEmail(orderData);
  console.log('RESULT:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
