"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaProvider } from '@/app/components/solana-provider';

import { PublicKey, Connection,  Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress,  createTransferInstruction } from "@solana/spl-token";
import { Program, AnchorProvider, Wallet, Idl } from '@project-serum/anchor';
import idlJson from "@/app/lib/idl/energy_trading.json";

// Cast the imported JSON to the Idl type
const idl: Idl = idlJson as unknown as Idl;

const WalletButton = dynamic(
  () => import('@/app/components/solana-provider').then(mod => mod.WalletButton),
  { ssr: false }
);

const PAYMENT_RECEIVER = new PublicKey("5PL4kXp3Ezz9uzn9jtLtjQfndKRNoQtgGPccM2kvvRad");
const BIJLEE_TOKEN_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_BIJLEE_TOKEN_MINT || 
  // Use the correct Bijlee token
  "HQbqWP4LSUYLySNXP8gRbXuKRy6bioH15CsrePQnfT86"
);

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

export default function Dashboard() {
  return (
    <SessionProvider>
      <SolanaProvider>
        <DashboardContent />
      </SolanaProvider>
    </SessionProvider>
  );
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [purchaseAmount, setPurchaseAmount] = useState<Record<string, number>>({});
  const [processingPurchase, setProcessingPurchase] = useState<string | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();

  const wallet = useWallet();
  const connected = !!wallet.publicKey;

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `.wallet-adapter-button { height: auto !important; padding: 8px 12px !important; font-size: 14px !important; max-width: 200px !important; }`;
    document.head.appendChild(styleTag);
    return () => {
      if (document.head.contains(styleTag)) {
        document.head.removeChild(styleTag);
      }
    };
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchListings();
  }, [status]);

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/listings");
      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }
      const data = await response.json();
      setListings(data?.listings || []);
    } catch (fetchError) {
      console.error("Fetch listings error:", fetchError);
      setError("Failed to load energy listings. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const executeTransaction = async (listingId: string, units: number, pricePerUnit: number) => {
    if (!wallet || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com");
      
      const anchorWallet = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction ? wallet.signTransaction : (/* tx */) => {
            console.error("Attempted to use signTransaction, but the connected wallet does not support it.");
            return Promise.reject(new Error("signTransaction is not supported by this wallet."));
        },
        signAllTransactions: wallet.signAllTransactions ? wallet.signAllTransactions : (/* txs */) => {
            console.error("Attempted to use signAllTransactions, but the connected wallet does not support it.");
            return Promise.reject(new Error("signAllTransactions is not supported by this wallet."));
        },
      } as Wallet;

      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: 'confirmed',
      });

      let programAddress;
      if ((idl as any).address) {
        programAddress = new PublicKey((idl as any).address);
      } else if (idl.metadata && (idl.metadata as any).address) {
        programAddress = new PublicKey((idl.metadata as any).address);
      } else {
        console.warn('Program address not found in IDL, continuing with direct transfer.');
      }
      const program = programAddress ? new Program(idl, programAddress, provider) : null;
      if(program) console.log("Program Initialized (though maybe not used for transfer)");

      const buyerTokenAccount = await getAssociatedTokenAddress(
        BIJLEE_TOKEN_MINT,
        wallet.publicKey
      );

      console.log("Checking seller token account...");
      const { getOrCreateAssociatedTokenAccount } = await import('@solana/spl-token');

      const pricePerUnitInt = Math.floor(pricePerUnit);

      console.log("--- Pre-Transaction Data ---");
      console.log("Listing ID:", listingId);
      console.log("Units:", units);
      console.log("Price Per Unit (Int):", pricePerUnitInt);
      console.log("Buyer Pubkey:", wallet.publicKey.toBase58());
      console.log("Buyer Token Acc Address:", buyerTokenAccount.toBase58());
      console.log("Seller Pubkey:", PAYMENT_RECEIVER.toBase58());
      console.log("BIJLEE Token Mint:", BIJLEE_TOKEN_MINT.toBase58());
      console.log("--- End Pre-Transaction Data ---");

      console.log("SIMPLIFIED: Direct token transfer");

      try {
        const DECIMALS = 2;
        const totalAmount = units * pricePerUnitInt * Math.pow(10, DECIMALS);
        console.log("Total amount to transfer (with decimals):", totalAmount);

        console.log("Getting or creating buyer token account...");
        const buyerAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          anchorWallet as any,
          BIJLEE_TOKEN_MINT,
          wallet.publicKey
        );
        console.log("Buyer account:", buyerAccount.address.toBase58());

        console.log("Getting or creating seller token account...");
        const sellerAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          anchorWallet as any,
          BIJLEE_TOKEN_MINT,
          PAYMENT_RECEIVER
        );
        console.log("Seller account:", sellerAccount.address.toBase58());

        if (!sellerAccount.owner.equals(PAYMENT_RECEIVER)) {
            throw new Error("Created seller account is not properly owned by the seller!");
        }

        console.log("Transferring tokens...");
        const transferTx = new Transaction();
        transferTx.add(
          createTransferInstruction(
            buyerAccount.address,
            sellerAccount.address,
            wallet.publicKey,
            totalAmount
          )
        );

        transferTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transferTx.feePayer = wallet.publicKey;

        if (!wallet.signTransaction) {
          throw new Error("Wallet does not support signTransaction");
        }
        console.log("Signing transaction...");
        const signedTransaction = await wallet.signTransaction(transferTx);

        console.log("Sending signed transaction...");
        const txid = await connection.sendRawTransaction(signedTransaction.serialize());
        console.log("Transfer transaction sent:", txid);

        console.log("Confirming transaction...");
        const confirmation = await connection.confirmTransaction(txid, 'confirmed');
        if (confirmation.value.err) {
          console.error("Transaction Confirmation Error:", confirmation.value.err);
          try {
            const txDetails = await connection.getTransaction(txid, {commitment: 'confirmed', maxSupportedTransactionVersion: 0});
            console.error("Failed Transaction Logs:", txDetails?.meta?.logMessages);
          } catch (logError) {
            console.error("Could not fetch logs for failed transaction:", logError);
          }
          throw new Error("Transaction failed: " + JSON.stringify(confirmation.value.err));
        }

        console.log("Transaction confirmed successfully!");
        return txid;

      } catch (directError) {
        console.error('Direct transfer failed:', directError);
        if (directError instanceof Error) {
            if (directError.message.includes("Account does not exist")) {
                setError("Token account error. Please ensure accounts exist or try again.");
            } else if (directError.message.includes("insufficient funds")) {
                setError("Insufficient BIJLEE tokens for purchase.");
            } else {
                setError(`Transfer failed: ${directError.message}`);
            }
        } else {
            setError("An unknown error occurred during the transfer.");
        }
        throw directError;
      }

    } catch (error) {
      console.error("Transaction setup error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to initiate purchase";
      setError(errorMessage);
    } finally {
      setProcessingPurchase(null);
    }
    return undefined;
  };

  const handlePurchase = async (listingId: string) => {
    if (!wallet.publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    const amount = purchaseAmount[listingId];
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const listing = listings.find(l => l._id === listingId);
    if (!listing) {
      setError("Listing not found");
      return;
    }

    if (amount > listing.availableUnits) {
      setError(`Only ${listing.availableUnits} units available for purchase`);
      return;
    }

    // Add logging for values before transaction
    console.log(`handlePurchase: listingId=${listingId}, amount=${amount}`);

    if (!listing || amount <= 0) {
      setError("Invalid listing or amount");
      setProcessingPurchase(null);
      return;
    }

    setError(null); // Clear previous errors
    setSuccessMessage(null); // Clear previous success messages
    setProcessingPurchase(listingId);

    try {
      const tx = await executeTransaction(listingId, amount, listing.pricePerUnit);

      // Only update history and show success if tx is a valid string (transaction ID)
      if (typeof tx === 'string' && tx) {
        // Update purchase history
        setPurchaseHistory([{
          id: Date.now().toString(),
          listingId,
          listingName: listing.name,
          amount,
          pricePerUnit: listing.pricePerUnit,
          total: amount * listing.pricePerUnit * Math.pow(10, 2), // Use 10^2 multiplier
          date: new Date().toISOString(),
          transactionHash: tx,
          status: "completed"
        }, ...purchaseHistory]);

        // Reset purchase amount
        setPurchaseAmount({ ...purchaseAmount, [listingId]: 0 });

        // Set success message
        setSuccessMessage("Purchase completed successfully!");

        // Automatically show the purchase history
        setShowHistory(true);

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        // If tx is undefined, an error likely occurred in executeTransaction and was handled there
        console.log("Transaction did not return a valid ID, likely failed before sending.");
        // setError might already be set by executeTransaction's catch block
      }

    } catch (error) {
      // This catch block primarily catches errors re-thrown from executeTransaction
      console.error("Error during handlePurchase -> executeTransaction:", error);
      // setError is likely already set within executeTransaction's catch blocks
      // If not, set a generic error here:
      if (!error) { // Check if error state is already set
          const errorMessage = error instanceof Error ? error.message : "Failed to complete purchase";
          setError(errorMessage);
      }
    } finally {
      setProcessingPurchase(null);
    }
  };

  if (status === "unauthenticated") {
    router.push("/auth");
    return null;
  }

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen bg-[#0f1422]">
      <div className="w-12 h-12 border-t-2 border-blue-600 border-solid rounded-full animate-spin"></div>
      <p className="ml-3 text-white">Loading...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#0f1422] text-white">
      {/* Navigation Bar */}
      <nav className="bg-gray-900/90 backdrop-blur-md border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-400 hover:text-blue-300 transition-colors">
                EnergyPro
              </Link>
            </div>
            <div className="flex items-center">
              {session?.user?.name && (
                <span className="text-gray-300 mr-4">
                  Welcome, {session.user.name}
                </span>
              )}
            <button 
                onClick={() => signOut()}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
        </div>
      </nav>

      <div className="px-6 py-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Energy Marketplace</h2>

        {error && (
          <div className="bg-red-900/70 backdrop-blur-md p-4 rounded-lg border border-red-500/30 mb-6 text-white">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-900/70 backdrop-blur-md p-4 rounded-lg border border-green-500/30 mb-6 text-white">
            {successMessage}
          </div>
        )}

        <div className="bg-gray-900/70 backdrop-blur-md p-4 rounded-lg shadow-md border border-blue-500/20 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">Solana Wallet</h3>
              <p className="text-sm text-gray-400">Connect your wallet to buy Bijlee energy units.</p>
            </div>
            <div style={{ maxWidth: '200px' }}>
              <WalletButton />
              {connected && (
                <p className="mt-2 text-sm text-green-400 text-center">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                  {wallet.publicKey?.toString().slice(0, 6)}...{wallet.publicKey?.toString().slice(-4)}
                </p>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-400">Loading listings...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {listings.map(listing => (
                <div key={listing._id} className="bg-gray-800/50 p-6 rounded-lg border border-gray-700/50">
                  <h3 className="text-xl font-semibold text-white mb-2">{listing.name}</h3>
                  <p className="text-gray-300 mb-2">{listing.location}</p>
                  <p className="text-blue-400 font-medium mb-2">{listing.pricePerUnit.toFixed(2)} BIJLEE per unit</p>
                  <p className="text-sm text-gray-400 mb-4">Available: {listing.availableUnits}</p>
                  <div className="flex items-center mb-3">
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
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-r-md px-4 py-2"
                    >
                      {processingPurchase === listing._id ? 'Processing...' : 'Buy Now'}
                    </button>
                  </div>
                  {purchaseAmount[listing._id] > 0 && (
                    <p className="text-sm text-right text-white">
                      Total: {(purchaseAmount[listing._id] * listing.pricePerUnit * Math.pow(10, 2)).toFixed(0)} BIJLEE tokens
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Purchase History Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Purchase History</h3>
                <button 
                  onClick={() => setShowHistory(!showHistory)} 
                  className="text-blue-400 hover:text-blue-300 flex items-center"
                >
                  {showHistory ? 'Hide' : 'Show'} History
                  <span className="ml-1">{showHistory ? '▲' : '▼'}</span>
                </button>
              </div>
              
              {showHistory && (
                <>
                  {purchaseHistory.length === 0 ? (
                    <p className="text-gray-400">No purchase history yet.</p>
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-700/50">
                          <tr>
                            <th className="py-3 px-4 text-left">Date</th>
                            <th className="py-3 px-4 text-left">Listing</th>
                            <th className="py-3 px-4 text-left">Units</th>
                            <th className="py-3 px-4 text-left">Total</th>
                            <th className="py-3 px-4 text-left">Transaction</th>
                            <th className="py-3 px-4 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseHistory.map(purchase => (
                            <tr key={purchase.id} className="border-t border-gray-700/50">
                              <td className="py-3 px-4">{new Date(purchase.date).toLocaleString()}</td>
                              <td className="py-3 px-4">{purchase.listingName}</td>
                              <td className="py-3 px-4">{purchase.amount}</td>
                              <td className="py-3 px-4">{purchase.total.toFixed(0)} BIJLEE</td>
                              <td className="py-3 px-4">
                                <a 
                                  href={`https://explorer.solana.com/tx/${purchase.transactionHash}?cluster=devnet`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  {purchase.transactionHash.slice(0, 8)}...
                                </a>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-900/50 text-green-400">
                                  {purchase.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
