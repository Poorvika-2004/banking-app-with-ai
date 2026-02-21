fetch('http://localhost:5000/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        customer_id: 'tester99',
        customer_name: 'Tester',
        email: 'tester@test.com',
        password: 'password123'
    })
}).then(res => res.json()).then(console.log).catch(console.error);
