import fetch from 'node-fetch';

async function test() {
  const apiKey = "vrf_9rokHcZDkzWp5gun1-YOiDrHH7-E6njn";
  const callback = "https://bileghurgelt.mn/api/verify-mn/callback";
  const phone = "90097785";
  
  // Test without custom text to see if verify.mn auto-generates it
  const response = await fetch("https://api.verify.mn/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone,
      callback,
    }),
  });
  
  const data = await response.json();
  console.log("Response without custom text:", data);
}

test();
