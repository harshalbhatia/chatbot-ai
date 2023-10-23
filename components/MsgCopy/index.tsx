// pages/index.tsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { RECEIVER_IP } from '../../utils/app/const';
let isBrowser = typeof window !== 'undefined'

const socket = io(RECEIVER_IP); // Change the URL if needed

export default function Sender() {
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);

  const sendMessage = () => {
    socket.emit('message', message);
    setMessage('');
  };

  useEffect(() => {
    socket.on('message', (message: string) => {
      setReceivedMessages((prevMessages) => [...prevMessages, message]);
    });
  }, []);

  return (
    <div>
      <input
        type="text"
        value={message}
        style={{ color: 'blue' }}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send Message</button>

      <div>
        <h2>Received Messages:</h2>
        <ul>
          {receivedMessages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
