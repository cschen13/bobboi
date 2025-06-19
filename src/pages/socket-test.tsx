import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { io, Socket } from 'socket.io-client';

const SocketTest: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    // Initialize socket connection
    fetch('/api/socket')
      .then(() => {
        addLog('API route fetched, initializing socket...');
        
        const socketInstance = io('/', {
          path: '/api/socket',
          transports: ['polling', 'websocket'],
          reconnectionAttempts: 5,
        });

        setSocket(socketInstance);
        addLog('Socket initialized');

        socketInstance.on('connect', () => {
          addLog('Connected to server');
          setConnected(true);
          setError(null);
        });

        socketInstance.on('connect_error', (err) => {
          addLog(`Connection error: ${err.message}`);
          setConnected(false);
          setError(`Connection error: ${err.message}`);
        });

        socketInstance.on('disconnect', () => {
          addLog('Disconnected from server');
          setConnected(false);
        });

        return () => {
          socketInstance.disconnect();
        };
      })
      .catch((err) => {
        addLog(`Error fetching API route: ${err.message}`);
        setError(`Error fetching API route: ${err.message}`);
      });
  }, []);

  const handlePing = () => {
    if (socket && connected) {
      addLog('Sending ping...');
      socket.emit('ping', { time: new Date().toISOString() }, (response: any) => {
        addLog(`Received pong: ${JSON.stringify(response)}`);
      });
    } else {
      addLog('Cannot ping: socket not connected');
    }
  };

  return (
    <>
      <Head>
        <title>Socket.IO Test</title>
      </Head>
      <div className="min-h-screen p-8 bg-gray-100">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Socket.IO Connection Test</h1>
          
          <div className="mb-6">
            <div className={`p-3 rounded ${connected ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className="font-bold">Status: {connected ? 'Connected' : 'Disconnected'}</p>
              {error && <p className="text-red-600 mt-1">{error}</p>}
            </div>
          </div>
          
          <div className="mb-6">
            <button 
              onClick={handlePing}
              disabled={!connected}
              className={`px-4 py-2 rounded ${
                connected ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
              }`}
            >
              Send Ping
            </button>
          </div>
          
          <div className="border rounded bg-black text-green-400 p-4 font-mono text-sm h-96 overflow-auto">
            <h2 className="text-white mb-2">Connection Log:</h2>
            {log.map((entry, i) => (
              <div key={i} className="mb-1">{entry}</div>
            ))}
            {log.length === 0 && <div className="text-gray-500">No log entries yet...</div>}
          </div>
        </div>
      </div>
    </>
  );
};

export default SocketTest; 