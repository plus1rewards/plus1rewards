// Quick SMS Test Script
import https from 'https';

const API_KEY = 'atsk_57e9c7a0d8e41c7006f0e1a6b8d69ee927cc5d743baa1aa3ccd2f41852a4fadc4365b377';
const USERNAME = 'theodutoit';
const SENDER_ID = 'plus1rewards';
const MODE = 'sandbox'; // Changed to sandbox for testing

const PHONE = '+27795320781';
const MESSAGE = 'Hello from Plus1 Rewards! 🎉 This is a test message.';

const endpoint = MODE === 'sandbox' 
  ? 'api.sandbox.africastalking.com'
  : 'api.africastalking.com';

console.log('📱 Sending SMS to', PHONE);
console.log('Mode:', MODE);
console.log('Endpoint:', endpoint);
console.log('Message:', MESSAGE);

const formData = `username=${encodeURIComponent(USERNAME)}&to=${encodeURIComponent(PHONE)}&message=${encodeURIComponent(MESSAGE)}`;

const options = {
  hostname: endpoint,
  path: '/version1/messaging',
  method: 'POST',
  headers: {
    'apiKey': API_KEY,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'Content-Length': Buffer.byteLength(formData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n✅ Response:', data);
    try {
      const result = JSON.parse(data);
      if (result.SMSMessageData && result.SMSMessageData.Recipients) {
        const recipient = result.SMSMessageData.Recipients[0];
        console.log('\n🎉 Status:', recipient.status);
        console.log('Cost:', recipient.cost);
        console.log('Message ID:', recipient.messageId);
      }
    } catch (e) {
      console.log('Response received');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(formData);
req.end();
