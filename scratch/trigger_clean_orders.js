const http = require('https');

const host = 'brews-backend.onrender.com';
const loginPath = '/api/auth/login';
const deletePath = '/api/orders/clean-all-tests';

// Admin credentials from production local environment config
const email = 'brewsandmemoriescafe@gmail.com';
const password = 'Brews&MemoriesCafe!@2025';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    req.on('error', (e) => reject(e));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function main() {
  console.log('Logging in as admin...');
  const loginData = JSON.stringify({ user: email, pass: password });
  const loginRes = await makeRequest({
    hostname: host,
    port: 443,
    path: loginPath,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  }, loginData);

  console.log('Login Status:', loginRes.statusCode);
  if (loginRes.statusCode !== 200) {
    console.error('Failed to log in:', loginRes.body);
    process.exit(1);
  }

  const loginObj = JSON.parse(loginRes.body);
  const token = loginObj.token;
  console.log('Login successful, token obtained!');

  console.log('Sending secure DELETE request to clean all orders...');
  const deleteRes = await makeRequest({
    hostname: host,
    port: 443,
    path: deletePath,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('Delete Status:', deleteRes.statusCode);
  console.log('Response Body:', deleteRes.body);
}

main().catch(console.error);
