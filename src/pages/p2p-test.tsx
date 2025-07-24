import { useState } from 'react';
import P2PTest from '../components/P2PTest';

export default function P2PTestPage() {
  const [initiator, setInitiator] = useState(true);
  const [localSignal, setLocalSignal] = useState<any>(null);
  const [remoteSignal, setRemoteSignal] = useState<any>(null);

  return (
    <div style={{ padding: 32 }}>
      <h1>P2P Test Page</h1>
      <label>
        <input
          type="checkbox"
          checked={initiator}
          onChange={() => setInitiator((v) => !v)}
        />
        Initiator
      </label>
      <P2PTest
        initiator={initiator}
        onSignal={setLocalSignal}
        remoteSignal={remoteSignal}
      />
      <div style={{ marginTop: 16 }}>
        <div>Local Signal:</div>
        <textarea
          value={localSignal ? JSON.stringify(localSignal, null, 2) : ''}
          readOnly
          rows={6}
          cols={60}
        />
        <div>Paste remote signal here:</div>
        <textarea
          value={remoteSignal ? JSON.stringify(remoteSignal, null, 2) : ''}
          onChange={e => {
            try {
              setRemoteSignal(JSON.parse(e.target.value));
            } catch {
              setRemoteSignal(e.target.value);
            }
          }}
          rows={6}
          cols={60}
        />
      </div>
    </div>
  );
}
