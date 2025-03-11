'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// Define TypeScript interfaces for Nimiq
interface NimiqClient {
  disconnect: () => Promise<void>;
  getBlockNumber: () => Promise<number>;
  // Remove the getHeadBlock method as it doesn't exist
}

export default function NimiqClient() {
  // Use proper typing for the client state
  const [client, setClient] = useState<NimiqClient | null>(null);
  const [status, setStatus] = useState<'initializing' | 'loading' | 'connected' | 'error'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);

  useEffect(() => {
    const initNimiq = async () => {
      try {
        setStatus('loading');
        // Dynamically import Nimiq core
        const Nimiq = await import('@nimiq/core');
        
        // Create a configuration builder
        const config = new Nimiq.ClientConfiguration();
        
        // Set network to testnet (you can change this as needed)
        config.network('testalbatross');
        
        // Initialize the client
        const nimiqClient = await Nimiq.Client.create(config.build());
        
        // Type cast the client to our interface
        setClient(nimiqClient as unknown as NimiqClient);
        setStatus('connected');

        // Get initial block number using getBlockNumber
        const currentBlockNumber = await nimiqClient.getHeadBlock();
        setBlockNumber(currentBlockNumber.height);
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

  // Update block number periodically
  useEffect(() => {
    if (status !== 'connected' || !client) return;

    const updateBlockNumber = async () => {
      try {
        // Use getBlockNumber since getHeadBlock is not available
        const currentBlock = await client.getBlockNumber();
        setBlockNumber(currentBlock);
      } catch (err) {
        console.error('Error fetching block number:', err);
      }
    };

    // Update immediately, then set interval
    updateBlockNumber();
    
    // Poll every 10 seconds
    const interval = setInterval(updateBlockNumber, 10000);
    
    return () => clearInterval(interval);
  }, [client, status]);

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
            {blockNumber !== null && (
              <p className="mt-1">Current block: <span className="font-medium">{blockNumber.toLocaleString()}</span></p>
            )}
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
