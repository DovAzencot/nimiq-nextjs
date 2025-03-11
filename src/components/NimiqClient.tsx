'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import * as Nimiq from '@nimiq/core';

// Define TypeScript interfaces for Nimiq
interface NimiqClient {
  disconnect: () => Promise<void>;
}

// Define interface for head change events
interface HeadChangeEvent {
  hash: string;
  reason: string;
  revertedBlocks: string[];
  adoptedBlocks: string[];
  timestamp: number;
}

export default function NimiqClient() {
  // Use a ref instead of state to store the client object
  const clientRef = useRef<Nimiq.Client | null>(null);
  const [status, setStatus] = useState<'initializing' | 'loading' | 'connected' | 'error'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [headChanges, setHeadChanges] = useState<HeadChangeEvent[]>([]);
  const [listenerId, setListenerId] = useState<number | null>(null);

  useEffect(() => {
    const initNimiq = async () => {
      try {
        setStatus('loading');
        
        // Create a configuration builder with direct import
        const config = new Nimiq.ClientConfiguration();
        
        // Set network to testnet (you can change this as needed)
        config.network('testalbatross');
        
        // Initialize the client
        const nimiqClient = await Nimiq.Client.create(config.build());
        
        // Set up head change listener
        const id = await nimiqClient.addHeadChangedListener(
          (hash, reason, revertedBlocks, adoptedBlocks) => {
            const event: HeadChangeEvent = {
              hash,
              reason,
              revertedBlocks,
              adoptedBlocks,
              timestamp: Date.now()
            };
            setHeadChanges(prev => [event, ...prev].slice(0, 10)); // Keep last 10 events
          }
        );
        
        setListenerId(id);
        // Store the client in the ref instead of state
        clientRef.current = nimiqClient;
        setStatus('connected');

      } catch (err: unknown) {
        console.error('Failed to initialize Nimiq:', err);
        // Properly handle the unknown type
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
        setStatus('error');
      }
    };

    initNimiq();
    
    // Clean up listener on unmount
    return () => {
      if (clientRef.current && listenerId !== null) {
        clientRef.current.removeListener(listenerId).catch(console.error);
      }
    };
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-black/[.05] dark:bg-white/[.06]">
      <div className="flex items-center gap-3 mb-3">
        <Image 
          src="/nimiq-logo.svg" 
          alt="Nimiq Logo" 
          width={24} 
          height={24}
          onError={(e) => {
            e.currentTarget.src = "https://www.nimiq.com/favicon.ico";
          }}
        />
        <h3 className="font-semibold">Nimiq Client</h3>
      </div>
      
      <div className="text-sm font-[family-name:var(--font-geist-mono)]">
        {status === 'initializing' && <p>Initializing Nimiq client...</p>}
        {status === 'loading' && <p>Connecting to Nimiq network...</p>}
        {status === 'connected' && (
          <div>
            <p className="text-green-600">Connected to Nimiq network!</p>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Blockchain Head Changes</h4>
              {headChanges.length === 0 ? (
                <p className="text-gray-500 text-xs">Waiting for blockchain updates...</p>
              ) : (
                <div className="max-h-60 overflow-auto">
                  {headChanges.map((event, index) => (
                    <div key={`${event.hash}-${event.timestamp}`} className="mb-2 p-2 border border-gray-200 rounded text-xs">
                      <p>Hash: <span className="font-medium">{event.hash.substring(0, 10)}...</span></p>
                      <p>Reason: <span className="font-medium">{event.reason}</span></p>
                      <p>Reverted blocks: {event.revertedBlocks.length}</p>
                      <p>Adopted blocks: {event.adoptedBlocks.length}</p>
                      <p className="text-gray-400 mt-1">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {status === 'error' && (
          <p className="text-red-500">
            Error: {error || 'Failed to connect to Nimiq'}
          </p>
        )}
      </div>
    </div>
  );
}
