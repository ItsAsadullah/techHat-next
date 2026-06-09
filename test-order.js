async function test() {
  const res = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Test',
      customerPhone: '01700000000',
      shippingAddress: 'Test Address',
      district: 'Dhaka',
      division: 'Dhaka',
      paymentMethod: 'CASH',
      items: [
        {
          productId: 'd2d0b5e3-8f0a-4b1a-9c7e-2a8d5f3b7c41',
          quantity: 1,
          price: 100,
        }
      ]
    })
  });
  console.log('Status:', res.status);
  console.log(await res.text());
}
test();
