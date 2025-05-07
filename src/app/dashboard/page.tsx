"use client";

import { useUser } from "@civic/auth/react";
import { useState, useEffect} from "react";
import { useRouter } from 'next/navigation';

import { SolanaProvider } from '@/app/components/solana-provider';
import WalletButtonClient from '@/app/components/WalletButtonClient';

import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress} from "@solana/spl-token";
import { Idl } from '@project-serum/anchor';
import idlJson from "@/app/lib/idl/energy_trading.json";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

import { FaCopy, FaExternalLinkAlt, FaBolt, FaUserFriends, FaExchangeAlt, FaTag, FaMapMarkerAlt } from 'react-icons/fa';
import Listing from '@/app/models/Listing';

// Cast the imported JSON to the Idl type
const idl: Idl = idlJson as unknown as Idl;

const PAYMENT_RECEIVER = new PublicKey(process.env.NEXT_PUBLIC_SELLER_WALLET!);
const BIJLEE_TOKEN_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_BIJLEE_TOKEN_MINT || 
  // Use the correct Bijlee token
  "HQbqWP4LSUYLySNXP8gRbXuKRy6bioH15CsrePQnfT86"
);

const PROGRAM_ID = new PublicKey('2AR9XUwfsHxnNQkQU3jzMcqct55X9TUiK5TBCAxDNygB');

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
  _id?: string;
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

interface EnergyLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  type: string;
}

export default function Dashboard() {
  return (
    <SolanaProvider>
      <DashboardWithSidebar />
    </SolanaProvider>
  );
}

function DashboardWithSidebar() {
  const router = useRouter();
  const { user, signOut } = useUser();
  const [activeSection, setActiveSection] = useState<'home' | 'buy' | 'sell' | 'orders'>('buy');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loadingMyListings, setLoadingMyListings] = useState(false);
  const [myListingsError, setMyListingsError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [buyLoading, setBuyLoading] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buySuccess, setBuySuccess] = useState<string | null>(null);
  const [amountInputs, setAmountInputs] = useState<{ [listingId: string]: string }>({});
  const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);
  const [energyLocations] = useState<EnergyLocation[]>([
    { id: 1, name: "Solar Farm Alpha", lat: 37.7749, lng: -122.4194, capacity: 250, type: "solar" },
    { id: 2, name: "Solar Array Beta", lat: 40.7128, lng: -74.0060, capacity: 180, type: "solar" },
  ]);
  const [statistics] = useState({
    totalCapacity: 2005,
    activeSellers: 153,
    completedTransactions: 1842,
    averagePrice: 12.74,
  });
  const [copied, setCopied] = useState(false);

  // Theme colors
  const bgMain = '#0f1422';
  const bgSidebar = '#181f36';
  const accent = '#3b82f6'; // blue
  const textPrimary = '#fff';
  const textSecondary = '#cbd5e1';
  const sidebarWidth = 240;

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
    if (activeSection === 'buy') {
      fetchListings();
    }
    if (activeSection === 'sell') {
      fetchMyListings();
    }
    if (activeSection === 'orders' && publicKey) {
      fetchMyPurchases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, publicKey, user, router]);

  async function fetchListings() {
    setLoadingListings(true);
    setError(null);
    try {
      // TODO: Replace with the correct endpoint if needed
      const res = await fetch('/api/listings/all');
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data = await res.json();
      setListings(data.listings || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch listings');
    } finally {
      setLoadingListings(false);
    }
  }

  async function fetchMyListings() {
    setLoadingMyListings(true);
    setMyListingsError(null);
    try {
      const res = await fetch('/api/listings/all');
      if (!res.ok) throw new Error('Failed to fetch all listings');
      const data = await res.json();
      setMyListings(data.listings || []);
    } catch (err: any) {
      setMyListingsError(err.message || 'Failed to fetch all listings');
    } finally {
      setLoadingMyListings(false);
    }
  }

  async function fetchMyPurchases() {
    if (!publicKey) return;
    
    setLoadingPurchases(true);
    setPurchasesError(null);
    try {
      const res = await fetch(`/api/purchases?wallet=${publicKey.toBase58()}`);
      if (!res.ok) throw new Error('Failed to fetch your purchases');
      const data = await res.json();
      setMyPurchases(data.purchases || []);
    } catch (err: any) {
      setPurchasesError(err.message || 'Failed to fetch your purchases');
    } finally {
      setLoadingPurchases(false);
    }
  }

  async function handleDeleteListing(id: string) {
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete listing');
      setMyListings(listings => listings.filter(l => l._id !== id));
    } catch {
      alert('Failed to delete listing');
    } finally {
      setDeleteLoading(null);
    }
  }

  async function handleBuy(listing: Listing) {
    setBuyError(null);
    setBuySuccess(null);
    if (!connected || !publicKey) {
      setBuyError('Please connect your wallet.');
      return;
    }
    const amountStr = amountInputs[listing._id];
    if (!amountStr) {
      setBuyError('Please enter an amount.');
      return;
    }
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setBuyError('Invalid amount.');
      return;
    }
    if (amount > listing.availableUnits) {
      setBuyError('Amount exceeds available units.');
      return;
    }
    setBuyLoading(listing._id);
    try {
      // Log payload for debugging
      const payload: {
        listingId: string;
        quantity: number;
        buyerWalletAddress: string;
      } = {
        listingId: listing._id,
        quantity: amount,
        buyerWalletAddress: publicKey.toBase58(),
      };
      console.log('Sending to /api/purchase:', payload);
      // 1. Call backend API to reserve units and get transaction details
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: {
        success: boolean;
        error?: string;
        transaction: {
          listingId: string;
          amount: number;
          pricePerUnit: number;
        };
        purchaseId: string;
      } = await res.json();
      console.log('Response from /api/purchase:', data);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reserve units');
      }
      // 2. Prepare Anchor provider and program
      console.log('IDL loaded in frontend:', idl);
      console.log('IDL events field:', idl.events);
      console.log('Program ID:', PROGRAM_ID.toString());
      
      try {
        // BYPASS ANCHOR JS WITH DIRECT WEB3.JS TRANSACTION
        console.log('Bypassing Anchor JS with direct web3.js transaction...');
        
        // Get the latest blockhash
        const blockhash = await connection.getLatestBlockhash();
        
        // Create a new transaction
        const transaction = new Transaction({
          feePayer: publicKey,
          recentBlockhash: blockhash.blockhash
        });
        
        // Create instruction data buffer manually
        // Discriminator for processPurchase (first 8 bytes)
        const discriminator = new Uint8Array([38, 233, 48, 62, 162, 120, 177, 244]);
        
        // Encode listing_id as string, but truncate to max 32 bytes to prevent buffer overflow
        const truncatedListingId = data.transaction.listingId.substring(0, 32);
        const listingIdBytes = new TextEncoder().encode(truncatedListingId);
        const listingIdLen = new Uint8Array(4);
        new DataView(listingIdLen.buffer).setUint32(0, listingIdBytes.length, true);
        
        // Encode units and price_per_unit as u64 (8 bytes each)
        const unitsBytes = new Uint8Array(8);
        const pricePerUnitBytes = new Uint8Array(8);
        new DataView(unitsBytes.buffer).setBigUint64(0, BigInt(data.transaction.amount), true);
        new DataView(pricePerUnitBytes.buffer).setBigUint64(0, BigInt(data.transaction.pricePerUnit), true);
        
        // Combine all data
        const instructionData = Buffer.concat([
          discriminator,
          listingIdLen, Buffer.from(listingIdBytes),
          unitsBytes,
          pricePerUnitBytes
        ]);
        
        // Create accounts
        const buyerTokenAccount = await getAssociatedTokenAddress(BIJLEE_TOKEN_MINT, publicKey);
        const paymentReceiverPubkey = PAYMENT_RECEIVER;
        const paymentReceiverTokenAccount = await getAssociatedTokenAddress(BIJLEE_TOKEN_MINT, paymentReceiverPubkey);
        
        // Create instruction
        const instruction = {
          programId: PROGRAM_ID,
          keys: [
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: buyerTokenAccount, isSigner: false, isWritable: true },
            { pubkey: paymentReceiverPubkey, isSigner: false, isWritable: false },
            { pubkey: paymentReceiverTokenAccount, isSigner: false, isWritable: true },
            { pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), isSigner: false, isWritable: false },
            { pubkey: PublicKey.default, isSigner: false, isWritable: false },
          ],
          data: instructionData
        };
        
        // Add instruction to transaction
        transaction.add(instruction);
        
        // Send transaction
        const sig = await sendTransaction(transaction, connection);
        console.log('Transaction sent with signature:', sig);
        
        // Update purchase with transaction hash
        const updateRes = await fetch('/api/purchase', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purchaseId: data.purchaseId,
            transactionHash: sig,
            status: 'completed'
          }),
        });
        
        const updateData = await updateRes.json();
        console.log('Purchase updated:', updateData);
        
        setBuySuccess(`Transaction sent: ${sig}`);
        fetchListings();
        
        // If we're on the orders page, refresh orders
        if (activeSection === 'orders') {
          fetchMyPurchases();
        }
        
        return; // Skip regular Anchor code below
      } catch (err: any) {
        console.error('Direct transaction error:', err);
        setBuyError(err.message || 'Direct transaction failed');
        setBuyLoading(null);
        return; // Skip regular Anchor code below
      }
      
    } catch (err: any) {
      console.error('Anchor transaction error:', err);
      setBuyError(err.message || 'Transaction failed');
    } finally {
      setBuyLoading(null);
    }
  }

  const getEnergyTypeColor = () => '#f59e0b';
  const getEnergyTypeIcon = () => '☀️';

  // Copy wallet address
  const handleCopyWallet = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const handleSignOut = async () => {
    try {
      // Redirect immediately
      router.push('/auth');
      // Sign out in the background
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div 
        className="fixed left-0 top-0 h-full bg-gray-800 text-white p-4"
        style={{ width: sidebarWidth }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-8">
            <FaBolt className="text-blue-500 text-2xl" />
            <span className="text-xl font-bold">EnergyPro</span>
          </div>
          
          <nav className="flex-1">
            <button
              onClick={() => setActiveSection('home')}
              className={`w-full text-left px-4 py-2 rounded-lg mb-2 ${
                activeSection === 'home' ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveSection('buy')}
              className={`w-full text-left px-4 py-2 rounded-lg mb-2 ${
                activeSection === 'buy' ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              Buy Energy
            </button>
            <button
              onClick={() => setActiveSection('sell')}
              className={`w-full text-left px-4 py-2 rounded-lg mb-2 ${
                activeSection === 'sell' ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              Sell Energy
            </button>
            <button
              onClick={() => setActiveSection('orders')}
              className={`w-full text-left px-4 py-2 rounded-lg mb-2 ${
                activeSection === 'orders' ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              My Orders
            </button>
          </nav>

          <div className="mt-auto">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-700 text-red-400"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className="flex-1 ml-[240px] p-8 overflow-auto"
        style={{ backgroundColor: bgMain }}
      >
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <WalletButtonClient />
          {connected && publicKey && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#232b47',
              color: accent,
              fontFamily: 'Menlo, monospace',
              fontSize: 15,
              borderRadius: 20,
              padding: '6px 16px',
              boxShadow: '0 2px 8px 0 rgba(59,130,246,0.10)',
              border: '1px solid #334155',
              transition: 'background 0.2s',
            }}>
              <FaMapMarkerAlt style={{ color: '#3b82f6', fontSize: 16 }} />
              <span>{publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}</span>
              <button
                onClick={handleCopyWallet}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7dd3fc',
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: 2,
                  fontSize: 15,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Copy address"
              >
                <FaCopy style={{ fontSize: 15 }} />
              </button>
              <a
                href={`https://explorer.solana.com/address/${publicKey.toBase58()}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#7dd3fc', marginLeft: 2, display: 'flex', alignItems: 'center' }}
                title="View on Solana Explorer"
              >
                <FaExternalLinkAlt style={{ fontSize: 14 }} />
              </a>
              {copied && <span style={{ color: '#22c55e', fontSize: 13, marginLeft: 6 }}>Copied!</span>}
            </span>
          )}
        </div>
        <div style={{
          background: bgSidebar,
          borderRadius: 18,
          boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)',
          padding: '2.5rem 2rem',
          minHeight: 400,
          marginBottom: 24,
        }}>
          {activeSection === 'home' && (
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10, color: '#fff', letterSpacing: 1 }}>Welcome to EnergyPro</h2>
              <div style={{ color: textSecondary, fontSize: 18, marginBottom: 28, fontWeight: 500 }}>
                Your decentralized marketplace for renewable energy.
              </div>
              <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: 15, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 8, padding: '2px 10px', fontWeight: 700, fontSize: 13 }}>DUMMY DATA</span>
                <span>All locations and statistics below are for demonstration purposes only.</span>
              </div>
              {/* Statistics Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                gap: 20, 
                marginBottom: 30 
              }}>
                <div style={{
                  background: '#232b47',
                  borderRadius: 14,
                  padding: '24px 20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontWeight: 600,
                }}>
                  <FaBolt style={{ color: '#f59e0b', fontSize: 28 }} />
                  <div style={{ fontSize: 18, color: textSecondary }}>Total Capacity</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{statistics.totalCapacity} kWh</div>
                </div>
                <div style={{
                  background: '#232b47',
                  borderRadius: 14,
                  padding: '24px 20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontWeight: 600,
                }}>
                  <FaUserFriends style={{ color: '#3b82f6', fontSize: 28 }} />
                  <div style={{ fontSize: 18, color: textSecondary }}>Active Sellers</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>{statistics.activeSellers}</div>
                </div>
                <div style={{
                  background: '#232b47',
                  borderRadius: 14,
                  padding: '24px 20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontWeight: 600,
                }}>
                  <FaExchangeAlt style={{ color: '#10b981', fontSize: 28 }} />
                  <div style={{ fontSize: 18, color: textSecondary }}>Transactions</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{statistics.completedTransactions}</div>
                </div>
                <div style={{
                  background: '#232b47',
                  borderRadius: 14,
                  padding: '24px 20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontWeight: 600,
                }}>
                  <FaTag style={{ color: '#8b5cf6', fontSize: 28 }} />
                  <div style={{ fontSize: 18, color: textSecondary }}>Avg. Price</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6' }}>{statistics.averagePrice} BIJLEE</div>
                </div>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: '#fff' }}>Energy Locations (Demo)</h3>
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: 24,
                paddingBottom: 8,
                marginBottom: 10,
                scrollbarWidth: 'thin',
              }}>
                {energyLocations.map(loc => (
                  <div key={loc.id} style={{
                    minWidth: 270,
                    background: '#181f36',
                    borderRadius: 16,
                    boxShadow: '0 2px 8px 0 rgba(59,130,246,0.10)',
                    padding: '22px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 10,
                    border: '2px solid #232b47',
                    transition: 'border 0.2s, box-shadow 0.2s',
                    position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', top: 12, right: 12, background: '#f59e0b', color: '#fff', borderRadius: 8, padding: '2px 10px', fontWeight: 700, fontSize: 12 }}>DUMMY</span>
                    <div style={{ fontSize: 32 }}>{getEnergyTypeIcon()}</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 2 }}>{loc.name}</div>
                    <div style={{ color: getEnergyTypeColor(), fontWeight: 600, fontSize: 15, textTransform: 'capitalize' }}>{loc.type} energy</div>
                    <div style={{ color: textSecondary, fontSize: 15 }}>Capacity: <span style={{ color: '#fff', fontWeight: 600 }}>{loc.capacity} kWh</span></div>
                    <div style={{ color: textSecondary, fontSize: 15 }}>Lat/Lng: <span style={{ color: '#fff', fontWeight: 600 }}>{loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeSection === 'buy' && (
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Buy Energy</h2>
              {loadingListings ? (
                <p style={{ color: textSecondary }}>Loading listings...</p>
              ) : error ? (
                <p style={{ color: '#f87171' }}>{error}</p>
              ) : listings.length === 0 ? (
                <p style={{ color: textSecondary }}>No energy listings available right now.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                  {listings.map(listing => {
                    const amountValue = amountInputs[listing._id] || '';
                    const amountNum = Number(amountValue);
                    const isAmountInvalid = !amountValue || isNaN(amountNum) || amountNum <= 0 || amountNum > listing.availableUnits;
                    return (
                      <div key={listing._id} style={{
                        background: '#232b47',
                        borderRadius: 14,
                        boxShadow: '0 2px 8px 0 rgba(59,130,246,0.08)',
                        padding: '1.5rem 1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}>
                        <div style={{ fontWeight: 600, fontSize: 20, color: textPrimary }}>{listing.name || 'Energy Listing'}</div>
                        <div style={{ color: accent, fontWeight: 500, fontSize: 16 }}>{listing.pricePerUnit} BIJLEE / kWh</div>
                        <div style={{ color: textSecondary, fontSize: 15 }}>Available: {listing.availableUnits} kWh</div>
                        <div style={{ color: textSecondary, fontSize: 15 }}>Location: {listing.location}</div>
                        <div style={{ color: textSecondary, fontSize: 15 }}>Seller: <span style={{ color: '#7dd3fc' }}>{listing.sellerId}</span></div>
                        {connected ? (
                          <>
                            <input
                              type="number"
                              min="1"
                              max={listing.availableUnits}
                              placeholder="Amount to buy (kWh)"
                              value={amountValue}
                              onChange={e => setAmountInputs(inputs => ({ ...inputs, [listing._id]: e.target.value }))}
                              style={{
                                background: '#181f36',
                                color: '#fff',
                                border: '1px solid #3b82f6',
                                borderRadius: 8,
                                padding: '8px 10px',
                                fontSize: 15,
                                marginTop: 8,
                                marginBottom: 4,
                              }}
                            />
                            <button
                              onClick={() => handleBuy(listing)}
                              disabled={buyLoading === listing._id || isAmountInvalid}
                              style={{
                                marginTop: 4,
                                background: accent,
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '10px 0',
                                fontWeight: 600,
                                fontSize: 16,
                                cursor: buyLoading === listing._id || isAmountInvalid ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                                boxShadow: '0 2px 8px 0 rgba(59,130,246,0.10)',
                              }}
                            >
                              {buyLoading === listing._id ? 'Processing...' : 'Buy'}
                            </button>
                          </>
                        ) : (
                          <div style={{ color: '#f87171', fontSize: 15, marginTop: 8 }}>
                            Please connect your wallet to buy.
                          </div>
                        )}
                        {isAmountInvalid && amountValue && connected && (
                          <div style={{ color: '#f87171', fontSize: 14 }}>
                            {amountNum > listing.availableUnits
                              ? 'Amount exceeds available units.'
                              : 'Enter a valid amount.'}
                          </div>
                        )}
                        {buyError && buyLoading === listing._id && <div style={{ color: '#f87171', fontSize: 15 }}>{buyError}</div>}
                        {buySuccess && buyLoading === listing._id && <div style={{ color: '#22c55e', fontSize: 15 }}>{buySuccess}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeSection === 'sell' && (
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Sell Energy</h2>
              <CreateListingForm onListingCreated={fetchMyListings} sellerId={user?.email || ''} />
              <div style={{ marginTop: 40 }}>
                <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 18, color: '#fff' }}>My Listings</h3>
                {loadingMyListings ? (
                  <p style={{ color: textSecondary }}>Loading your listings...</p>
                ) : myListingsError ? (
                  <p style={{ color: '#f87171' }}>{myListingsError}</p>
                ) : myListings.length === 0 ? (
                  <p style={{ color: textSecondary }}>You have no listings yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {myListings.map(listing => (
                      <div key={listing._id} style={{
                        background: '#232b47',
                        borderRadius: 12,
                        boxShadow: '0 2px 8px 0 rgba(59,130,246,0.08)',
                        padding: '1.25rem 1rem',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 18, color: textPrimary }}>{listing.name}</div>
                          <div style={{ color: textSecondary, fontSize: 15 }}>Location: {listing.location}</div>
                          <div style={{ color: accent, fontWeight: 500, fontSize: 15 }}>Price: {listing.pricePerUnit} BIJLEE/kWh</div>
                          <div style={{ color: textSecondary, fontSize: 15 }}>Available: {listing.availableUnits} / {listing.maxUnitsAvailable} kWh</div>
                        </div>
                        <button
                          onClick={() => handleDeleteListing(listing._id!)}
                          disabled={deleteLoading === listing._id}
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 18px',
                            fontWeight: 600,
                            fontSize: 15,
                            cursor: deleteLoading === listing._id ? 'not-allowed' : 'pointer',
                            marginLeft: 12,
                          }}
                        >
                          {deleteLoading === listing._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeSection === 'orders' && (
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#fff' }}>My Orders</h2>
              
              {!connected ? (
                <p style={{ color: textSecondary, fontSize: 18 }}>Please connect your wallet to view your orders.</p>
              ) : loadingPurchases ? (
                <p style={{ color: textSecondary }}>Loading your orders...</p>
              ) : purchasesError ? (
                <p style={{ color: '#f87171' }}>{purchasesError}</p>
              ) : myPurchases.length === 0 ? (
                <p style={{ color: textSecondary }}>You have no orders yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {myPurchases.map(purchase => (
                    <div key={purchase._id || purchase.id} style={{
                      background: '#232b47',
                      borderRadius: 12,
                      boxShadow: '0 2px 8px 0 rgba(59,130,246,0.08)',
                      padding: '1.25rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: 18, color: textPrimary }}>{purchase.listingName}</div>
                        <div style={{ 
                          backgroundColor: purchase.status === 'completed' ? '#22c55e' : '#f59e0b',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                        }}>
                          {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                        </div>
                      </div>
                      <div style={{ color: textSecondary, fontSize: 15 }}>Amount: {purchase.amount} kWh</div>
                      <div style={{ color: accent, fontWeight: 500, fontSize: 15 }}>Price: {purchase.pricePerUnit} BIJLEE/kWh</div>
                      <div style={{ color: accent, fontWeight: 500, fontSize: 15 }}>Total: {purchase.total} BIJLEE</div>
                      <div style={{ color: textSecondary, fontSize: 15 }}>Date: {new Date(purchase.date).toLocaleString()}</div>
                      <div style={{ color: textSecondary, fontSize: 14, wordBreak: 'break-all' }}>
                        Transaction: <a 
                          href={`https://explorer.solana.com/tx/${purchase.transactionHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#7dd3fc' }}
                        >
                          {purchase.transactionHash.substring(0, 12)}...
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button 
                onClick={fetchMyPurchases} 
                style={{
                  marginTop: 20,
                  background: accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  display: connected ? 'block' : 'none',
                }}
                disabled={loadingPurchases}
              >
                {loadingPurchases ? 'Refreshing...' : 'Refresh Orders'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateListingForm({ onListingCreated, sellerId }: { onListingCreated: () => void, sellerId: string }) {
  const [form, setForm] = useState({
    name: '',
    location: '',
    pricePerUnit: '',
    maxUnitsAvailable: '',
    availableUnits: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    // Validate
    if (!form.name || !form.location || !form.pricePerUnit || !form.maxUnitsAvailable || !form.availableUnits) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          name: form.name,
          location: form.location,
          pricePerUnit: Number(form.pricePerUnit),
          maxUnitsAvailable: Number(form.maxUnitsAvailable),
          availableUnits: Number(form.availableUnits),
        }),
      });
      if (!res.ok) throw new Error('Failed to create listing');
      setForm({ name: '', location: '', pricePerUnit: '', maxUnitsAvailable: '', availableUnits: '' });
      setSuccess(true);
      onListingCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#232b47', borderRadius: 14, padding: '1.5rem 1.25rem', marginBottom: 32, boxShadow: '0 2px 8px 0 rgba(59,130,246,0.08)', maxWidth: 500 }}>
      <div style={{ fontWeight: 600, fontSize: 20, color: '#fff', marginBottom: 18 }}>Create New Listing</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={inputStyle} />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} style={inputStyle} />
        <input name="pricePerUnit" placeholder="Price per Unit (BIJLEE)" type="number" min="0" value={form.pricePerUnit} onChange={handleChange} style={inputStyle} />
        <input name="maxUnitsAvailable" placeholder="Max Units Available (kWh)" type="number" min="1" value={form.maxUnitsAvailable} onChange={handleChange} style={inputStyle} />
        <input name="availableUnits" placeholder="Available Units (kWh)" type="number" min="0" value={form.availableUnits} onChange={handleChange} style={inputStyle} />
        <button type="submit" disabled={loading} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
          {loading ? 'Creating...' : 'Create Listing'}
        </button>
        {error && <div style={{ color: '#f87171', fontSize: 15 }}>{error}</div>}
        {success && <div style={{ color: '#22c55e', fontSize: 15 }}>Listing created!</div>}
      </div>
    </form>
  );
}

const inputStyle = {
  background: '#181f36',
  color: '#fff',
  border: '1px solid #3b82f6',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 16,
  outline: 'none',
};
