const net = require('net');

const server = net.createServer(socket => {
  console.log('Connected:', socket.remoteAddress);
  socket.write('Hello from Laptop A!\n');
  socket.end();
});

server.listen(3000, '192.168.1.189', () => {
  console.log('Server listening on port 3000');
});

