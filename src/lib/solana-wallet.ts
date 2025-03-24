// src/lib/solana-wallet.ts
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState, useCallback } from 'react';
import { getAssociatedTokenAddress } from '@solana/spl-token';

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

interface WalletBalance {
  sol: number;
  tokens: { [mintAddress: string]: number };
  loading: boolean;
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

// Function to format public key for display
export const formatPublicKey = (key: string | null): string => {
  if (!key) return '';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
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
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState<number>(0);
  const [balance, setBalance] = useState<WalletBalance>({
    sol: 0,
    tokens: {},
    loading: false
  });

  // Check for available wallet providers - only once on mount
  useEffect(() => {
    const checkForWallets = () => {
      const wallets: WalletProviderProps[] = [];
      
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
      
      setAvailableWallets(wallets);
      return wallets;
    };
    
    // Check immediately
    const wallets = checkForWallets();
    
    // Auto-connect to previously used wallet if it's available
    const storedWalletName = localStorage.getItem('selectedWallet');
    if (storedWalletName && wallets.length > 0) {
      const savedWallet = wallets.find(w => w.name === storedWalletName);
      if (savedWallet) {
        // Try to auto-connect on page load
        setTimeout(() => {
          autoConnect(savedWallet.provider, savedWallet.name).catch(console.error);
        }, 1000);
      }
    }
    
    // Also check after window loads (some wallets might initialize later)
    window.addEventListener('load', checkForWallets);
    
    return () => {
      window.removeEventListener('load', checkForWallets);
    };
  }, []);

  // Helper function to create wallet adapter
  const createWalletAdapter = useCallback((provider: any, publicKeyObj: PublicKey) => {
    setWallet({
      publicKey: publicKeyObj,
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

  // Auto-connect function with trusted flag
  const autoConnect = async (provider: any, walletName: string) => {
    try {
      if (!provider) return false;
      
      const resp = await provider.connect({ onlyIfTrusted: true });
      const walletPubkey = resp.publicKey.toString();
      
      setSelectedWalletName(walletName);
      localStorage.setItem('selectedWallet', walletName);
      
      setPublicKey(walletPubkey);
      setConnected(true);
      createWalletAdapter(provider, resp.publicKey);
      
      // Fetch the wallet balance
      fetchBalance(walletPubkey);
      
      return true;
    } catch (error) {
      console.log("Auto-connect failed (this is normal for non-trusted connections):", error);
      return false;
    }
  };

  // Connect wallet - add rate limiting protection
  const connect = async (walletProvider?: any) => {
    try {
      // If no wallet provider is specified and we have multiple options, show the selector
      if (!walletProvider && availableWallets.length > 1) {
        setShowWalletSelector(true);
        return;
      }
      
      // If no wallets are available, check again
      if (availableWallets.length === 0) {
        throw new Error('No wallet providers found. Please install a Solana wallet like Phantom.');
      }
      
      // Prevent multiple connection attempts in quick succession (1 second cooldown)
      const now = Date.now();
      if (connecting || (now - lastConnectionAttempt < 1000)) {
        console.log('Connection attempt in progress or rate limited');
        return;
      }
      
      setConnecting(true);
      setLastConnectionAttempt(now);

      let provider;
      let walletName: string;
      
      if (walletProvider) {
        provider = walletProvider;
        walletName = availableWallets.find(w => w.provider === walletProvider)?.name || 'Unknown Wallet';
      } else if (availableWallets.length > 0) {
        provider = availableWallets[0].provider;
        walletName = availableWallets[0].name;
      } else {
        throw new Error('No wallet providers found');
      }

      try {
        const resp = await provider.connect();
        const walletPubkey = resp.publicKey.toString();
        
        setSelectedWalletName(walletName);
        localStorage.setItem('selectedWallet', walletName);
        
        setPublicKey(walletPubkey);
        setConnected(true);
        createWalletAdapter(provider, resp.publicKey);
        
        // Fetch the wallet balance
        fetchBalance(walletPubkey);
      } catch (connectError) {
        console.error('Wallet connection error:', connectError);
        
        if (connectError instanceof Error && 
            (connectError.message.includes('rate limit') || 
             connectError.message.includes('timeout'))) {
          throw new Error('Wallet connection timed out. Please try again in a few seconds.');
        }
        
        throw connectError;
      }
    } catch (error) {
      console.error('Failed to connect wallet', error);
      throw error;
    } finally {
      setTimeout(() => {
        setConnecting(false);
      }, 1000);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    if (wallet) {
      await wallet.disconnect();
      setWallet(null);
      setConnected(false);
      setPublicKey(null);
      setSelectedWalletName(null);
      localStorage.removeItem('selectedWallet');
      setBalance({ sol: 0, tokens: {}, loading: false });
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

  // Fetch SOL balance
  const fetchSOLBalance = useCallback(async (walletPubkey: string): Promise<number> => {
    try {
      const connection = getSolanaConnection();
      const pubkey = new PublicKey(walletPubkey);
      const balance = await connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      return 0;
    }
  }, []);

  // Fetch token balance
  const fetchTokenBalance = useCallback(async (
    walletPubkey: string, 
    tokenMintAddress: string
  ): Promise<number | null> => {
    try {
      const connection = getSolanaConnection();
      const walletPublicKey = new PublicKey(walletPubkey);
      const tokenMintPublicKey = new PublicKey(tokenMintAddress);
      
      // Get the associated token account address
      const tokenAccount = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        walletPublicKey
      );
      
      try {
        // Try to get the balance
        const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccount);
        return Number(tokenAccountInfo.value.uiAmount);
      } catch (error) {
        // Token account might not exist
        console.log('Token account not found:', error);
        return 0;
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return null;
    }
  }, []);

  // Fetch all balances (SOL and tokens)
  const fetchBalance = useCallback(async (walletPubkey: string | null) => {
    if (!walletPubkey) return;
    
    setBalance(prev => ({ ...prev, loading: true }));
    
    try {
      const solBalance = await fetchSOLBalance(walletPubkey);
      
      // Update tokens if needed
      const tokens: { [mintAddress: string]: number } = {};
      
      // Check for BIJLEE token if we have its address
      const bijleeTokenMint = process.env.NEXT_PUBLIC_BIJLEE_TOKEN_MINT;
      if (bijleeTokenMint) {
        const bijleeBalance = await fetchTokenBalance(walletPubkey, bijleeTokenMint);
        if (bijleeBalance !== null) {
          tokens[bijleeTokenMint] = bijleeBalance;
        }
      }
      
      setBalance({
        sol: solBalance,
        tokens: tokens,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      setBalance(prev => ({ ...prev, loading: false }));
    }
  }, [fetchSOLBalance, fetchTokenBalance]);

  // Update balance when wallet changes
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance(publicKey);
      
      // Set up interval to refresh balance every 30 seconds
      const intervalId = setInterval(() => {
        fetchBalance(publicKey);
      }, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [connected, publicKey, fetchBalance]);

  // Listen for wallet connection/disconnection events
  useEffect(() => {
    const handleWalletChange = () => {
      // Check if wallet is still connected
      if (wallet?.publicKey && connected) {
        fetchBalance(wallet.publicKey.toString());
      } else {
        // If we detect a wallet change but we're not connected, try to reconnect
        const storedWalletName = localStorage.getItem('selectedWallet');
        if (storedWalletName) {
          const savedWallet = availableWallets.find(w => w.name === storedWalletName);
          if (savedWallet) {
            autoConnect(savedWallet.provider, savedWallet.name).catch(() => {
              // Clear connection state if auto-connect fails
              setWallet(null);
              setConnected(false);
              setPublicKey(null);
            });
          }
        }
      }
    };

    // Add event listeners for wallet changes
    window.addEventListener('focus', handleWalletChange);
    
    // Some wallets dispatch custom events
    window.addEventListener('wallet-disconnected', disconnect);
    window.addEventListener('wallet-connected', handleWalletChange);
    
    return () => {
      window.removeEventListener('focus', handleWalletChange);
      window.removeEventListener('wallet-disconnected', disconnect);
      window.removeEventListener('wallet-connected', handleWalletChange);
    };
  }, [wallet, connected, availableWallets, autoConnect, disconnect, fetchBalance]);

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
    connectToWallet,
    balance,
    fetchBalance
  };
};