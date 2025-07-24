import { useP2P } from '../hooks/useP2P';
import { useEffect } from 'react';

interface P2PTestProps {
  initiator: boolean;
  onSignal: (data: any) => void;
  remoteSignal: any;
}

export default function P2PTest({ initiator, onSignal, remoteSignal }: P2PTestProps) {
  const { createOffer, signal, send, onData, isConnected, lastError, lastSignal } = useP2P(initiator);

  // Send local signal to parent when it changes
  useEffect(() => {
    if (lastSignal) {
      onSignal(lastSignal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSignal]);

  useEffect(() => {
    if (remoteSignal) {
      signal(remoteSignal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteSignal]);

  useEffect(() => {
    onData((data) => {
      alert('Received: ' + data);
    });
  }, [onData]);

  return (
    <div>
      <div>P2P {initiator ? 'Initiator' : 'Receiver'}</div>
      <button onClick={() => createOffer()}>Create Offer</button>
      <button onClick={() => send('Hello peer!')} disabled={!isConnected}>Send Hello</button>
      {lastError && <div>Error: {lastError.message}</div>}
    </div>
  );
}
