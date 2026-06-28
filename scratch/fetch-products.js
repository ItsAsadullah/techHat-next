const http = require('http');

console.log("Fetching /admin/products...");
const start = Date.now();

http.get('http://localhost:3000/admin/products', (res) => {
  console.log(`Status: ${res.statusCode} in ${Date.now() - start}ms`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Finished receiving data in ${Date.now() - start}ms. Total size: ${data.length} bytes`);
  });
}).on('error', (err) => {
  console.error("Error:", err.message);
});
