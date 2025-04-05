// lib/wallet-helper.ts
import { WalletContextState } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';

// Define a proper Wallet adapter interface that matches what's used in bijlee-exchange.ts
export interface Wallet {
  publicKey: PublicKey;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}

// Create a wallet adapter that can be used with the Solana client
export function createWalletAdapter(walletContext: WalletContextState): Wallet {
  // Check if wallet is connected
  if (!walletContext.connected || !walletContext.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  // Access the actual wallet adapter
  const adapter = walletContext.wallet?.adapter;
  
  if (!adapter) {
    throw new Error('Wallet adapter not found');
  }
  
  // Check if the adapter has the required signing method
  if (!adapter.sendTransaction) {
    throw new Error('Wallet does not support required signing methods');
  }
  
  // Create a function for signAllTransactions with type safety
  const signAllTransactions = async (transactions: Transaction[]): Promise<Transaction[]> => {
    // Check if the adapter has native signAllTransactions support (using type assertion)
    if (typeof (adapter as any).signAllTransactions === 'function') {
      return await (adapter as any).signAllTransactions(transactions);
    } else {
      // Fallback implementation that signs transactions one by one
      const signedTransactions: Transaction[] = [];
      for (const transaction of transactions) {
        // Make sure transaction is a Transaction object
        if (!(transaction instanceof Transaction)) {
          throw new Error('Invalid transaction: Expected Transaction object');
        }
        // Use signTransaction if available
        if (typeof (adapter as any).signTransaction === 'function') {
          signedTransactions.push(await (adapter as any).signTransaction(transaction));
        } else {
          // We can't use sendTransaction directly as a fallback as it requires more parameters
          throw new Error('Wallet adapter does not support signTransaction method');
        }
      }
      return signedTransactions;
    }
  };
  
  // Create properly bound method for signTransaction
  const signTransaction = async (transaction: Transaction): Promise<Transaction> => {
    // Make sure transaction is a Transaction object
    if (!(transaction instanceof Transaction)) {
      throw new Error('Invalid transaction: Expected Transaction object');
    }
    // Use signTransaction method
    if (typeof (adapter as any).signTransaction === 'function') {
      return await (adapter as any).signTransaction(transaction);
    } else {
      // The sendTransaction requires additional parameters (connection)
      // and returns a transaction signature, not a signed transaction
      throw new Error('Wallet adapter does not support signTransaction method');
    }
  };
  
  // Optional signMessage method with type safety
  let signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | undefined = undefined;
  if (typeof (adapter as any).signMessage === 'function') {
    signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
      return await (adapter as any).signMessage(message);
    };
  }
  
  return {
    publicKey: walletContext.publicKey,
    signTransaction,
    signAllTransactions,
    signMessage
  };
}

// Format an address to show a shortened version (e.g., Gk3H...j29d)
export function formatAddress(address: string, prefixLength = 4, suffixLength = 4): string {
  if (!address) return '';
  if (address.length <= prefixLength + suffixLength) return address;
  
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

// Validate a Solana wallet address
export function isValidSolanaAddress(address: string): boolean {
  try {
    if (!address || address.trim() === '') return false;
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}


// Get the wallet address from a connected wallet
export function getWalletAddress(walletContext: WalletContextState): string | null {
  if (!walletContext.connected || !walletContext.publicKey) {
    return null;
  }
  return walletContext.publicKey.toString();
}