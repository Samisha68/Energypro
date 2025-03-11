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

  // Check for available wallet providers
  const checkForWallets = () => {
    const wallets: WalletProviderProps[] = [];
    
    // Debug what's available in window
    console.log('Checking for wallets. Window objects:', {
      phantom: !!(window as any)?.phantom?.solana,
      solflare: !!(window as any)?.solflare,
      backpack: !!(window as any)?.backpack?.solana,
      slope: !!(window as any)?.slope,
      coin98: !!(window as any)?.coin98,
      glow: !!(window as any)?.glow,
      solana: !!(window as any)?.solana
    });
    
    // Check for Phantom wallet
    if ((window as any)?.phantom?.solana) {
      wallets.push({
        provider: (window as any).phantom.solana,
        name: 'Phantom',
        icon: '/wallets/phantom.png'
      });
    }
    
    // Check for Solflare wallet
    if ((window as any)?.solflare) {
      wallets.push({
        provider: (window as any).solflare,
        name: 'Solflare',
        icon: '/wallets/solflare.png'
      });
    }
    
    // Check for Backpack wallet
    if ((window as any)?.backpack?.solana) {
      wallets.push({
        provider: (window as any).backpack.solana,
        name: 'Backpack',
        icon: '/wallets/backpack.png'
      });
    }
    
    // Check for Slope wallet
    if ((window as any)?.slope) {
      wallets.push({
        provider: (window as any).slope,
        name: 'Slope',
        icon: '/wallets/slope.png'
      });
    }
    
    // Check for Coin98 wallet
    if ((window as any)?.coin98) {
      wallets.push({
        provider: (window as any).coin98,
        name: 'Coin98',
        icon: '/wallets/coin98.png'
      });
    }
    
    // Check for Glow wallet
    if ((window as any)?.glow) {
      wallets.push({
        provider: (window as any).glow,
        name: 'Glow',
        icon: '/wallets/glow.png'
      });
    }
    
    // Check for default Solana wallet (could be any of the above)
    // Only add if it's not already included
    if ((window as any)?.solana && !wallets.some(w => w.provider === (window as any).solana)) {
      wallets.push({
        provider: (window as any).solana,
        name: 'Solana',
        icon: '/wallets/solana.png'
      });
    }
    
    // Log available wallets for debugging
    console.log('Available wallets:', wallets.map(w => w.name));
    
    setAvailableWallets(wallets);
    return wallets;
  };

  // Initialize wallet detection
  useEffect(() => {
    // Check immediately
    checkForWallets();
    
    // Also check after window loads (some wallets might initialize later)
    window.addEventListener('load', checkForWallets);
    
    // Check periodically for wallets that might be injected after page load
    // But use a much longer interval to avoid rate limiting
    const intervalId = setInterval(checkForWallets, 10000); // Check every 10 seconds instead of every second
    
    return () => {
      window.removeEventListener('load', checkForWallets);
      clearInterval(intervalId);
    };
  }, []);

  // Helper function to create wallet adapter
  const createWalletAdapter = (provider: any, publicKey: PublicKey) => {
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
  };

  // Connect wallet - add rate limiting protection
  const connect = async (walletProvider?: any, isAutoConnect: boolean = false) => {
    try {
      // Debug available wallets
      console.log('Connect called. Available wallets:', availableWallets.map(w => w.name));
      
      // If no wallet provider is specified and we have multiple options, show the selector
      if (!walletProvider && availableWallets.length > 1 && !isAutoConnect) {
        console.log('Multiple wallets available, showing selector');
        setShowWalletSelector(true);
        return;
      }
      
      // If no wallets are available, check again
      if (availableWallets.length === 0) {
        console.log('No wallets available, checking again...');
        checkForWallets();
        
        // If still no wallets, show an error
        if (availableWallets.length === 0) {
          console.error('No wallet providers found');
          alert('No Solana wallets detected. Please install a wallet like Phantom, Solflare, or Backpack.');
          throw new Error('No wallet providers found');
        }
      }
      
      // Prevent multiple connection attempts in quick succession
      if (connecting) {
        console.log('Already attempting to connect, please wait...');
        return;
      }
      
      setConnecting(true);

      let provider;
      if (walletProvider) {
        provider = walletProvider;
        console.log('Using provided wallet provider');
      } else if (availableWallets.length > 0) {
        provider = availableWallets[0].provider;
        setSelectedWalletName(availableWallets[0].name);
        console.log('Using first available wallet:', availableWallets[0].name);
      } else {
        throw new Error('No wallet providers found');
      }

      // Save the selected wallet name
      const walletName = availableWallets.find(w => w.provider === provider)?.name;
      if (walletName) {
        setSelectedWalletName(walletName);
        localStorage.setItem('selectedWallet', walletName);
        console.log('Selected wallet:', walletName);
      }

      // Check if wallet is already connected
      if (provider.isConnected) {
        try {
          console.log('Wallet is already connected, trying trusted connect');
          const resp = await provider.connect({ onlyIfTrusted: true });
          setPublicKey(resp.publicKey.toString());
          setConnected(true);
          
          // Create wallet adapter
          createWalletAdapter(provider, resp.publicKey);
          console.log('Connected with trusted app');
          return;
        } catch (connectError: unknown) {
          // If connecting with trusted fails, attempt normal connect
          console.log('Not a trusted app, trying normal connect:', 
            connectError instanceof Error ? connectError.message : 'Unknown error');
          
          // If we get a rate limit error, don't try again immediately
          if (connectError instanceof Error && 
              connectError.message.includes('rate limit')) {
            throw new Error('Wallet connection rate limited. Please try again in a few seconds.');
          }
        }
      }

      console.log('Attempting normal wallet connect');
      const resp = await provider.connect();
      setPublicKey(resp.publicKey.toString());
      setConnected(true);
      console.log('Wallet connected successfully:', resp.publicKey.toString());

      // Create wallet adapter
      createWalletAdapter(provider, resp.publicKey);

    } catch (error) {
      console.error('Failed to connect wallet', error);
      
      // Show a user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          alert('Wallet connection is being rate limited. Please wait a few seconds before trying again.');
        } else {
          alert(`Failed to connect wallet: ${error.message}`);
        }
      } else {
        alert('Failed to connect wallet. Please try again later.');
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      // Add a delay before allowing another connection attempt
      setTimeout(() => {
        setConnecting(false);
        setShowWalletSelector(false);
      }, 2000); // 2 second cooldown between connection attempts
    }
  };

  // Check for previously connected wallet in localStorage
  useEffect(() => {
    // Only try to auto-connect if we have wallets available
    if (availableWallets.length === 0) return;
    
    const savedWalletName = localStorage.getItem('selectedWallet');
    if (savedWalletName) {
      setSelectedWalletName(savedWalletName);
      
      // Try to auto-connect if we have a saved wallet, but only once
      const savedWallet = availableWallets.find(w => w.name === savedWalletName);
      if (savedWallet) {
        // Use a timeout to avoid the React warning about state updates during render
        // And add a longer delay to avoid rate limiting
        setTimeout(() => {
          connect(savedWallet.provider, true).catch(err => {
            console.log('Auto-connect failed, will not retry:', err);
            // Don't retry on failure to avoid rate limiting
          });
        }, 2000); // Wait 2 seconds before trying to connect
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