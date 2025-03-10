// src/lib/solana-wallet.ts
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { useEffect, useState, useCallback } from 'react';

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
  
  // Create connection with more reliable configuration
  return new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000, // 60 seconds
    disableRetryOnRateLimit: false,
    httpHeaders: {
      'Content-Type': 'application/json'
    }
  });
};

// Hook to use wallet
export const useSolanaWallet = () => {
  const [wallet, setWallet] = useState<SolanaWallet | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletProviderProps[]>([]);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [selectedWalletName, setSelectedWalletName] = useState<string | null>(null);
  const [showWalletSelector, setShowWalletSelector] = useState<boolean>(false);

  // Helper function to create wallet adapter
  const createWalletAdapter = useCallback((provider: any, publicKey: PublicKey) => {
    setWallet({
      publicKey: publicKey,
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
  }, []);

  // Connect wallet
  const connect = useCallback(async (walletProvider?: any, isAutoConnect: boolean = false) => {
    try {
      // If no wallet provider is specified and we have multiple options, show the selector
      if (!walletProvider && availableWallets.length > 1 && !isAutoConnect) {
        setShowWalletSelector(true);
        return;
      }
      
      setConnecting(true);

      let provider;
      if (walletProvider) {
        provider = walletProvider;
      } else if (availableWallets.length > 0) {
        provider = availableWallets[0].provider;
        setSelectedWalletName(availableWallets[0].name);
      } else {
        throw new Error('No wallet providers found');
      }

      // Save the selected wallet name
      const walletName = availableWallets.find(w => w.provider === provider)?.name;
      if (walletName) {
        setSelectedWalletName(walletName);
        localStorage.setItem('selectedWallet', walletName);
      }

      // Check if wallet is already connected
      if (provider.isConnected) {
        try {
          const resp = await provider.connect({ onlyIfTrusted: true });
          setPublicKey(resp.publicKey.toString());
          setConnected(true);
          
          // Create wallet adapter
          createWalletAdapter(provider, resp.publicKey);
          return;
        } catch {
          // If connecting with trusted fails, attempt normal connect
          console.log('Not a trusted app, trying normal connect');
        }
      }

      const resp = await provider.connect();
      setPublicKey(resp.publicKey.toString());
      setConnected(true);

      // Create wallet adapter
      createWalletAdapter(provider, resp.publicKey);

    } catch (error) {
      console.error('Failed to connect wallet', error);
      throw new Error('Failed to connect wallet');
    } finally {
      setConnecting(false);
      setShowWalletSelector(false);
    }
  }, [availableWallets, createWalletAdapter]);

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

      // Add more wallet providers as needed

      setAvailableWallets(wallets);
    };

    checkForWallets();
    window.addEventListener('load', checkForWallets);
    return () => window.removeEventListener('load', checkForWallets);
  }, []);

  // Check for previously connected wallet in localStorage
  useEffect(() => {
    const savedWalletName = localStorage.getItem('selectedWallet');
    if (savedWalletName) {
      setSelectedWalletName(savedWalletName);
      
      // Try to auto-connect if we have a saved wallet
      const savedWallet = availableWallets.find(w => w.name === savedWalletName);
      if (savedWallet) {
        connect(savedWallet.provider, true);
      }
    }
  }, [availableWallets, connect]);

  // Disconnect wallet
  const disconnect = async () => {
    if (wallet) {
      await wallet.disconnect();
      setWallet(null);
      setConnected(false);
      setPublicKey(null);
      setSelectedWalletName(null);
      localStorage.removeItem('selectedWallet');
    }
  };

  // Connect to a specific wallet from the list
  const connectToWallet = async (walletName: string) => {
    const selectedWallet = availableWallets.find(w => w.name === walletName);
    if (selectedWallet) {
      await connect(selectedWallet.provider);
    } else {
      throw new Error(`Wallet ${walletName} not found`);
    }
  };

  return {
    wallet,
    connecting,
    connected,
    publicKey,
    availableWallets,
    selectedWalletName,
    showWalletSelector,
    setShowWalletSelector,
    connect,
    disconnect,
    connectToWallet
  };
};

// Format wallet address
export const formatPublicKey = (key: string | null): string => {
  if (!key) return '';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};