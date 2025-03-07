// src/lib/solana-wallet.ts
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { useEffect, useState } from 'react';

// Interfaces for wallet functionality
export interface SolanaWallet {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
}

export interface WalletProviderProps {
  provider: any;
  name: string;
  icon: string;
}

// Default connection to Devnet
export const getSolanaConnection = (): Connection => {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet');
  return new Connection(endpoint, 'confirmed');
};

// Hook to use wallet
export const useSolanaWallet = () => {
  const [wallet, setWallet] = useState<SolanaWallet | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletProviderProps[]>([]);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  // Check for available wallet providers
  useEffect(() => {
    const checkForWallets = () => {
      const wallets: WalletProviderProps[] = [];

      if ((window as any)?.phantom?.solana) {
        wallets.push({
          provider: (window as any).phantom.solana,
          name: 'Phantom',
          icon: '/phantom-icon.png'
        });
      }

      if ((window as any)?.solana) {
        wallets.push({
          provider: (window as any).solana,
          name: 'Solana',
          icon: '/solana-icon.png'
        });
      }

      if ((window as any)?.backpack?.solana) {
        wallets.push({
          provider: (window as any).backpack.solana,
          name: 'Backpack',
          icon: '/backpack-icon.png'
        });
      }

      setAvailableWallets(wallets);
    };

    checkForWallets();
    window.addEventListener('load', checkForWallets);
    return () => window.removeEventListener('load', checkForWallets);
  }, []);

  // Connect wallet
  const connect = async (walletProvider?: any) => {
    try {
      setConnecting(true);

      let provider;
      if (walletProvider) {
        provider = walletProvider;
      } else if (availableWallets.length > 0) {
        provider = availableWallets[0].provider;
      } else {
        throw new Error('No wallet providers found');
      }

      // Check if wallet is already connected
      if (provider.isConnected) {
        try {
          const resp = await provider.connect({ onlyIfTrusted: true });
          setPublicKey(resp.publicKey.toString());
          setConnected(true);
          return;
        } catch (error) {
          // If connecting with trusted fails, attempt normal connect
          console.log('Not a trusted app, trying normal connect');
        }
      }

      const resp = await provider.connect();
      setPublicKey(resp.publicKey.toString());
      setConnected(true);

      // Create wallet adapter
      setWallet({
        publicKey: resp.publicKey,
        connected: true,
        connecting: false,
        connect: async () => {
          await provider.connect();
        },
        disconnect: async () => {
          if (provider.disconnect) {
            await provider.disconnect();
          }
          setConnected(false);
          setPublicKey(null);
        },
        signTransaction: async (transaction: any) => {
          return await provider.signTransaction(transaction);
        },
        signAllTransactions: async (transactions: any[]) => {
          return await provider.signAllTransactions(transactions);
        }
      });

    } catch {
      console.error('Failed to connect wallet');
      throw new Error('Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    if (wallet) {
      await wallet.disconnect();
      setWallet(null);
      setConnected(false);
      setPublicKey(null);
    }
  };

  return {
    wallet,
    connecting,
    connected,
    publicKey,
    availableWallets,
    connect,
    disconnect
  };
};

// Format wallet address
export const formatPublicKey = (key: string | null): string => {
  if (!key) return '';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};