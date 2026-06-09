async function test() {
  console.time('Order API Latency');
  try {
    const res = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Latency Test',
        customerPhone: '01700000001',
        shippingAddress: 'Test Address',
        district: 'Dhaka',
        division: 'Dhaka',
        paymentMethod: 'CASH',
        items: [
          {
            productId: 'c1e73b70-6f94-41a4-a1b7-210a8fe3faf5', // Maxell Battery
            productName: 'Battery',
            quantity: 1,
            unitPrice: 39,
          }
        ]
      })
    });
    console.log('Status:', res.status);
    console.log(await res.text());
  } finally {
    console.timeEnd('Order API Latency');
  }
}
test();
