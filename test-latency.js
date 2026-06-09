const start = Date.now();
fetch('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerName: 'Test Latency',
    customerPhone: '01711111111',
    shippingAddress: 'Test, Dhaka',
    division: 'Dhaka',
    items: [{ productId: '69427b3e-e6de-4cf4-aa61-46bb6f78f142', quantity: 1, productName: 'Test Product', unitPrice: 100 }],
    paymentMethod: 'CASH_ON_DELIVERY'
  })
})
  .then(res => res.json())
  .then(data => {
    console.log(`Total time: ${Date.now() - start}ms`);
    console.log(data);
  })
  .catch(console.error);
