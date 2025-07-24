import { useRef, useEffect, useCallback, useState } from 'react';
import Peer, { Instance, SignalData } from 'simple-peer';

export interface UseP2PReturn {
  peer: Instance | null;
  createOffer: () => void;
  signal: (data: SignalData) => void;
  send: (data: any) => void;
  onData: (cb: (data: any) => void) => void;
  isConnected: boolean;
  lastError: Error | null;
  lastSignal: SignalData | null;
}

export function useP2P(initiator: boolean): UseP2PReturn {
  const peerRef = useRef<Instance | null>(null);
  const dataCallback = useRef<((data: any) => void) | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [lastSignal, setLastSignal] = useState<SignalData | null>(null);

  useEffect(() => {
    const peer = new Peer({ initiator, trickle: false });
    peerRef.current = peer;

    peer.on('signal', (data: SignalData) => {
      setLastSignal(data);
    });

    peer.on('connect', () => {
      setIsConnected(true);
    });

    peer.on('data', (data: any) => {
      if (dataCallback.current) {
        dataCallback.current(data);
      }
    });

    peer.on('error', (err: Error) => {
      setLastError(err);
    });

    peer.on('close', () => {
      setIsConnected(false);
    });

    return () => {
      peer.destroy();
    };
  }, [initiator]);

  const createOffer = useCallback(() => {
    // No-op: offer is created automatically on Peer creation if initiator
  }, []);

  const signal = useCallback((data: SignalData) => {
    if (peerRef.current) {
      peerRef.current.signal(data);
    }
  }, []);

  const send = useCallback((data: any) => {
    if (peerRef.current && isConnected) {
      peerRef.current.send(data);
    }
  }, [isConnected]);

  const onData = useCallback((cb: (data: any) => void) => {
    dataCallback.current = cb;
  }, []);

  return {
    peer: peerRef.current,
    createOffer,
    signal,
    send,
    onData,
    isConnected,
    lastError,
    lastSignal,
  };
}
