const fetch = require('node-fetch');

async function testPaylink() {
  const payload = {
    amount_total: 100,
    count_total: 1,
    amount: 100,
    txndesc: "Test",
    merchant_ref: "TEST_REF_123",
    fee_percent: 0
  };

  const username = "batmagnai.ui@gmail.com";
  const signature = "vfl4QBd0obvVzIFD94rCr3bbj6uOD27OHeRtp6Krtwe57dwkVBQVYwaXc+N4P0eTikHPZ20/4HhGdjNMVNkC1Q==";

  const res = await fetch("https://paylink.mn/api/v1/external/process", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "pc": "cu0900",
      "X-USERNAME": username,
      "X-SIGNATURE": signature
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log(data);
}

testPaylink();
