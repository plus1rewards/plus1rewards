// Check Africa's Talking Account Balance
import https from 'https';

const API_KEY = 'atsk_57e9c7a0d8e41c7006f0e1a6b8d69ee927cc5d743baa1aa3ccd2f41852a4fadc4365b377';
const USERNAME = 'theodutoit';

console.log('🔍 Checking Africa\'s Talking Account...\n');

// Check account balance
const options = {
  hostname: 'api.africastalking.com',
  path: `/version1/user?username=${USERNAME}`,
  method: 'GET',
  headers: {
    'apiKey': API_KEY,
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response:', data);
    
    try {
      const result = JSON.parse(data);
      console.log('\n📊 Account Details:');
      console.log('Username:', result.UserData?.username);
      console.log('Balance:', result.UserData?.balance);
      
      if (result.UserData?.balance === 'ZAR 0.00' || result.UserData?.balance === '0') {
        console.log('\n⚠️  WARNING: Your account has no SMS credits!');
        console.log('You need to add airtime/credits to send SMS.');
        console.log('Go to: https://account.africastalking.com/');
      }
    } catch (e) {
      console.log('Could not parse response');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();
