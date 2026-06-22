const http = require('https');

const data = JSON.stringify({
  name: "Test Counter User",
  phone: "9945446137",
  email: "brewsandmemoriescafe@gmail.com",
  address: "Table 1",
  items: [{
    name: "Hot Coffee",
    qty: 1,
    price: 30
  }],
  total: 30,
  payment: "counter"
});

const options = {
  hostname: 'brews-backend.onrender.com',
  port: 443,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (d) => {
    body += d;
  });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', JSON.stringify(res.headers));
    console.log('BODY:', body);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
