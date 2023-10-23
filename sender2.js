const dgram = require('dgram');

const sender = dgram.createSocket('udp4');

const message = Buffer.from('Hello from Laptop A! Pratheesh');

sender.send(message, 0, message.length, 41234, '192.168.1.189', (err) => {
  if (err) {
    console.error('Error sending message:', err);
  } else {
    console.log('Message sent successfully.');
  }
  
  sender.close();
});

