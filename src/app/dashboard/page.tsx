"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { 
  useWallet, 
} from '@solana/wallet-adapter-react';
import { SolanaProvider} from '@/app/components/solana-provider';

import { PublicKey } from '@solana/web3.js';
import { 
  
  getAssociatedTokenAddress 
} from "@solana/spl-token";
import { Program, AnchorProvider, web3, Wallet } from '@project-serum/anchor';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import BN from 'bn.js';
import idl from '@/app/lib/idl/bijlee_transaction.json';

// Dynamically import the wallet button to avoid SSR issues
const WalletButton = dynamic(
  () => import('@/app/components/solana-provider').then(mod => mod.WalletButton),
  { ssr: false }
);

// Define TypeScript interfaces
interface Listing {
  _id: string;
  sellerId: string;
  name: string;
  location: string;
  pricePerUnit: number;
  maxUnitsAvailable: number;
  availableUnits: number;
  createdAt: string;
  updatedAt: string;
}

interface Purchase {
  id: string;
  listingId: string;
  listingName: string;
  amount: number;
  pricePerUnit: number;
  total: number;
  date: string;
  transactionHash: string;
  status: string;
}


const PAYMENT_RECEIVER = new PublicKey("5PL4kXp3Ezz9uzn9jtLtjQfndKRNoQtgGPccM2kvvRad");
const BIJLEE_TOKEN_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_BIJLEE_TOKEN_MINT || 
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // Default to USDC for development
);



function DashboardContent() {
  const { data: session, status } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [purchaseAmount, setPurchaseAmount] = useState<Record<string, number>>({});
  const [processingPurchase, setProcessingPurchase] = useState<string | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Solana wallet connection
  const wallet = useWallet();
  const connected = !!wallet.publicKey;

  // Add global styles to fix the wallet button
  useEffect(() => {
    // Add a style tag to the document head
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      .wallet-adapter-button {
        height: auto !important;
        padding: 8px 12px !important;
        font-size: 14px !important;
        max-width: 200px !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    // Clean up when component unmounts
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  // Fetch listings from the database
  useEffect(() => {
    if (status === "authenticated") {
      fetchListings();
    }
  }, [status]);

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching listings...");
      const response = await fetch("/api/listings");
      
      if (!response.ok) {
        console.error("Response not OK:", response.status, response.statusText);
        throw new Error("Failed to fetch listings");
      }
      
      const data = await response.json();
      console.log("API Response:", data);
      
      if (data?.listings) {
        console.log("Setting listings:", data.listings);
        setListings(data.listings);
      } else {
        console.log("No listings in response");
        setListings([]);
      }
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Failed to load energy listings. Please try again later.");
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // SIMPLIFIED transaction function that avoids BN completely
  const executeTransaction = async (listingId: string, amount: number, pricePerUnit: number) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setError("Wallet not connected or doesn't support signing");
      return null;
    }

    try {
      console.log("Preparing to execute transaction...");
      
      // Calculate the total payment amount
      const totalAmount = amount * pricePerUnit;
      console.log(`Total payment amount: ${totalAmount} Bijlee tokens`);
      
      // Get the buyer's token account
      const buyerTokenAccount = await getAssociatedTokenAddress(
        BIJLEE_TOKEN_MINT,
        wallet.publicKey
      );
      console.log(`Buyer's token account: ${buyerTokenAccount.toString()}`);
      
      // Get the seller's token account
      const sellerTokenAccount = await getAssociatedTokenAddress(
        BIJLEE_TOKEN_MINT,
        PAYMENT_RECEIVER
      );
      console.log(`Seller's token account: ${sellerTokenAccount.toString()}`);

      // Create connection and provider
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com");
      const anchorWallet = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions || (async (txs) => txs),
      } as Wallet;
      const provider = new AnchorProvider(connection, anchorWallet, {});
      
      // Initialize the program
      const program = new Program(idl as any, new PublicKey("71p7sfU3FKyP2hv9aVqZV1ha6ZzJ2VkReNjsGDoqtdRQ"), provider);

      // Create the transaction
      const tx = await program.methods
        .processPurchase(new BN(amount))
        .accounts({
          buyer: wallet.publicKey,
          buyerTokenAccount,
          sellerTokenAccount,
          seller: PAYMENT_RECEIVER,
          tokenProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction confirmed:", tx);
      return tx;

    } catch (error) {
      console.error("Transaction execution error:", error);
      throw error;
    }
  };

  // Process purchase function with Solana smart contract
  const handlePurchase = async (listingId: string) => {
    // Check if wallet is connected
    if (!connected) {
      setError("Please connect your wallet first");
      return;
    }

    const amount = purchaseAmount[listingId];
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const listing = listings.find(l => l._id === listingId);
    if (!listing) return;

    if (amount > listing.availableUnits) {
      setError(`Only ${listing.availableUnits} units available for purchase`);
      return;
    }

    setProcessingPurchase(listingId);
    setError(null);

    try {
      // First, execute the blockchain transaction
      const transactionSignature = await executeTransaction(
        listingId, 
        amount, 
        listing.pricePerUnit
      );
      
      if (!transactionSignature) {
        throw new Error("Failed to execute blockchain transaction");
      }
      
      // After successful blockchain transaction, update our local state
      // In a real app, you would also update the backend here
      
      // Update listings to reflect the purchase
      setListings(listings.map(l => {
        if (l._id === listingId) {
          return { ...l, availableUnits: l.availableUnits - amount };
        }
        return l;
      }));
      
      // Add to local purchase history
      const purchase: Purchase = {
        id: Date.now().toString(),
        listingId,
        listingName: listing.name,
        amount,
        pricePerUnit: listing.pricePerUnit,
        total: amount * listing.pricePerUnit,
        date: new Date().toISOString(),
        transactionHash: transactionSignature,
        status: "completed"
      };
      
      setPurchaseHistory([purchase, ...purchaseHistory]);
      
      // Reset purchase amount
      setPurchaseAmount({...purchaseAmount, [listingId]: 0});
      
      // Show success message
      alert("Purchase completed successfully!");

    } catch (error) {
      console.error("Error processing purchase:", error);
      setError(error instanceof Error ? error.message : "Failed to complete purchase. Please try again.");
    } finally {
      setProcessingPurchase(null);
    }
  };

  const handleSignOut = () => {
    signOut({ redirect: true, callbackUrl: "/auth" });
  };

  // If not authenticated, redirect to login
  if (status === "unauthenticated") {
    router.push("/auth");
    return null;
  }

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0f1422]">
        <div className="w-12 h-12 border-t-2 border-blue-600 border-solid rounded-full animate-spin"></div>
        <p className="ml-3 text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1422] text-white">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center px-6 py-4 bg-[#161b2b] border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h1 className="text-xl font-semibold">EnergyPro</h1>
        </div>

        {/* User Info & Sign Out */}
        {session?.user && (
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm text-gray-300">{session.user.name || session.user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Energy Marketplace</h2>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/70 backdrop-blur-md p-4 rounded-lg border border-red-500/30 mb-6 text-white">
            {error}
          </div>
        )}
        
        {/* Solana Wallet Connection */}
        <div className="bg-gray-900/70 backdrop-blur-md p-4 rounded-lg shadow-md border border-blue-500/20 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold mb-1 text-white">Solana Wallet</h3>
              <p className="text-sm text-gray-400">
                Connect your Solana wallet to make energy purchases with Bijlee tokens
              </p>
            </div>
            <div className="mt-3 sm:mt-0">
              {/* Apply inline max-width constraint to the wallet button container */}
              <div style={{ maxWidth: '200px' }}>
                <WalletButton />
              </div>
              {connected && (
                <div className="mt-2 text-sm text-green-400 text-center">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                  Connected: {wallet.publicKey?.toString().slice(0, 6)}...{wallet.publicKey?.toString().slice(-4)}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Energy Listings */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
            <p className="ml-3 text-gray-300">Loading energy listings...</p>
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {listings.map((listing) => (
              <div key={listing._id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-2">{listing.name}</h3>
                <p className="text-gray-300 mb-3">
                  {listing.location}
                </p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-blue-400 font-medium">${listing.pricePerUnit.toFixed(2)} per unit</span>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Available: {listing.availableUnits} units</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${listing.maxUnitsAvailable 
                          ? Math.min(100, (listing.availableUnits / listing.maxUnitsAvailable) * 100) 
                          : Math.min(100, (listing.availableUnits / (listing.availableUnits + 10)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center mt-4">
                  <input
                    type="number"
                    min="1"
                    max={listing.availableUnits}
                    value={purchaseAmount[listing._id] || ''}
                    onChange={(e) => setPurchaseAmount({
                      ...purchaseAmount,
                      [listing._id]: parseInt(e.target.value) || 0
                    })}
                    className="bg-gray-700 border border-gray-600 rounded-l-md px-3 py-2 text-white w-24"
                    placeholder="Units"
                  />
                  <button
                    onClick={() => handlePurchase(listing._id)}
                    disabled={processingPurchase === listing._id || !connected}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-r-md px-4 py-2"
                  >
                    {processingPurchase === listing._id ? (
                      <div className="flex items-center">
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                        Processing...
                      </div>
                    ) : "Buy Now"}
                  </button>
                </div>
                
                {purchaseAmount[listing._id] > 0 && (
                  <div className="mt-2 text-right text-sm">
                    <span className="text-gray-400">Total: </span>
                    <span className="text-white font-medium">${(purchaseAmount[listing._id] * listing.pricePerUnit).toFixed(2)}</span>
                    <span className="text-gray-400 ml-1">({purchaseAmount[listing._id] * listing.pricePerUnit} Bijlee tokens)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/70 backdrop-blur-md p-8 rounded-lg text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Energy Listings Available</h3>
            <p className="text-gray-500">Check back later for available energy packages.</p>
          </div>
        )}
        
        {/* Purchase History */}
        {purchaseHistory.length > 0 && (
          <div className="bg-gray-900/70 backdrop-blur-md p-6 rounded-lg shadow-md border border-blue-500/20 mt-8">
            <h3 className="text-lg font-semibold mb-4 text-white">Your Purchase History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800/70">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Energy Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Units</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Transaction</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/40 divide-y divide-gray-700">
                  {purchaseHistory.map((purchase) => (
                    <tr key={purchase.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(purchase.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {purchase.listingName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {purchase.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${purchase.pricePerUnit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${purchase.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          purchase.status === "completed"
                            ? "bg-green-900 text-green-200"
                            : purchase.status === "pending"
                            ? "bg-yellow-900 text-yellow-200"
                            : "bg-red-900 text-red-200"
                        }`}>
                          {purchase.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">
                        <a 
                          href={`https://explorer.solana.com/tx/${purchase.transactionHash}?cluster=devnet`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Make sure the SolanaProvider wraps the entire component
export default function Dashboard() {
  return (
    <SessionProvider>
      <SolanaProvider>
        <DashboardContent />
      </SolanaProvider>
    </SessionProvider>
  );
}