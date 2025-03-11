'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import * as Nimiq from '@nimiq/core';

// Define TypeScript interfaces for Nimiq
interface NimiqClient {
  disconnect: () => Promise<void>;
  // Remove the getHeadBlock method as it doesn't exist
}

export default function NimiqClient() {
  // Use proper typing for the client state
  const [client, setClient] = useState<NimiqClient | null>(null);
  const [status, setStatus] = useState<'initializing' | 'loading' | 'connected' | 'error'>('initializing');
  const [error, setError] = useState<string | null>(null);

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
        
        // Type cast the client to our interface
        setClient(nimiqClient as unknown as NimiqClient);
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
    
    // Cleanup function
    return () => {
      if (client) {
        client.disconnect().catch((err: unknown) => {
          console.error('Error disconnecting:', err);
        });
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
