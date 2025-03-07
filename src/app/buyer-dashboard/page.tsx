// src/app/buyer-dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Search, Package, MapPin, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { PublicKey } from '@solana/web3.js';
import { useSolanaWallet, formatPublicKey, getSolanaConnection } from '@/lib/solana-wallet';
import { processPurchase } from '@/lib/bijlee-exchange'
import { getAssociatedTokenAddress } from '@solana/spl-token';

// Constants
const BIJLEE_TOKEN_MINT = new PublicKey("HQbqWP4LSUYLySNXP8gRbXuKRy6bioH15CsrePQnfT86");

// Types
interface Listing {
  id: string;
  sellerId: string;
  seller?: {
    name: string | null;
    email: string;
  };
  title: string;
  description: string | null;
  energyType: string;
  location: string;
  state: string;
  address: string;
  totalCapacity: number;
  availableUnits: number;
  minPurchase: number;
  maxPurchase: number;
  pricePerUnit: number;
  discount: number | null;
  deliveryMethod: string;
  sourceType: string;
  certification: string | null;
  status: string;
  visibility: boolean | string;
  featured: boolean | string;
  sellerWalletAddress: string;
}

export default function BuyerDashboard() {
  // State Management
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Listing | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [buyerTokenBalance, setBuyerTokenBalance] = useState<number | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<string | null>(null);

  // Solana wallet integration
  const { wallet, connected, connect, connecting, publicKey } = useSolanaWallet();

  // Fetch listings on component mount
  useEffect(() => {
    fetchListings();
    if (connected && publicKey) {
      checkTokenBalance(publicKey);
    }
  }, [connected, publicKey]);

  // Fetch listings from API
  const fetchListings = async () => {
    try {
      setIsLoading(true);
      // Don't add any sellerId param here to get all listings
      const response = await fetch('/api/listings');

      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch listings');
      }

      console.log('Fetched listings:', data.data);
      
      // Normalize the data to ensure consistent types
      const normalizedListings = data.data.map((listing: any) => ({
        ...listing,
        // Ensure numeric properties are numbers
        totalCapacity: Number(listing.totalCapacity),
        availableUnits: Number(listing.availableUnits),
        minPurchase: Number(listing.minPurchase),
        maxPurchase: Number(listing.maxPurchase),
        pricePerUnit: Number(listing.pricePerUnit),
        discount: listing.discount ? Number(listing.discount) : null,
        // Ensure boolean values are actual booleans
        visibility: typeof listing.visibility === 'string' 
          ? listing.visibility.toLowerCase() === 'true' 
          : Boolean(listing.visibility)
      }));
      
      setListings(normalizedListings.filter((listing: Listing) => 
        // Only show active and visible listings with available units
        listing.status === 'ACTIVE' && 
        Boolean(listing.visibility) === true &&
        listing.availableUnits > 0
      ));
      
      setError(null);
    } catch {
      setError('Failed to load listings. Please try again later.');
      console.error('Error loading listings');
    } finally {
      setIsLoading(false);
    }
  };

  // Check BIJLEE token balance
  const checkTokenBalance = async (walletAddress: string) => {
    try {
      const connection = getSolanaConnection();
      
      try {
        const tokenAddress = await getAssociatedTokenAddress(
          BIJLEE_TOKEN_MINT,
          new PublicKey(walletAddress)
        );

        const tokenAccount = await connection.getTokenAccountBalance(tokenAddress);
        setBuyerTokenBalance(Number(tokenAccount.value.uiAmount));
      } catch (e) {
        console.log("Token account may not exist yet:", e);
        setBuyerTokenBalance(0);
      }
    } catch (error) {
      console.error('Error checking token balance:', error);
      setBuyerTokenBalance(null);
    }
  };

  // Connect Wallet
  const connectWallet = async () => {
    try {
      await connect();
    } catch {
      console.error('Error connecting wallet');
      alert('Failed to connect wallet. Please try again.');
    }
  };

  // Handle Purchase
  const handlePurchase = async () => {
    if (!connected || !wallet) {
      try {
        await connect();
        return; // We'll exit and let the useEffect trigger a re-render
      } catch (error) {
        setError('Failed to connect wallet. Please try again.');
        return;
      }
    }
  
    if (!selectedOffer || !quantity) {
      alert('Please select quantity first');
      return;
    }
    
    setError(null);
    setProcessingPurchase(true);
    setPurchaseSuccess(false);
    setTransactionSignature(null);
    setTransactionDetails(null);
  
    try {
      // Check if buyer has enough tokens
      if (buyerTokenBalance === null) {
        await checkTokenBalance(publicKey!);
      }
      
      const totalCost = selectedOffer.pricePerUnit * quantity;
      const networkFee = totalCost * 0.005; // 0.5% fee
      const totalPurchaseCost = totalCost + networkFee;
      
      if (buyerTokenBalance !== null && buyerTokenBalance < totalPurchaseCost) {
        throw new Error(`Insufficient BIJLEE tokens. You need ${totalPurchaseCost.toFixed(2)} but have ${buyerTokenBalance.toFixed(2)}`);
      }
      
      const connection = getSolanaConnection();
      
      // Use the seller's wallet address for the transaction
      const sellerWalletAddress = selectedOffer.sellerWalletAddress;
      
      // Call the processPurchase function from bijlee-exchange.ts
      const result = await processPurchase(
        wallet,
        connection,
        selectedOffer.id, // This should be the listing pubkey on Solana
        selectedOffer.id, // This is the listing ID in your database
        sellerWalletAddress, // This is the seller's pubkey
        quantity, // Number of units to purchase
        selectedOffer.pricePerUnit // Price per unit in rupees
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process purchase');
      }
      
      // Record the purchase in your backend API
      const purchaseData = {
        listingId: selectedOffer.id,
        buyerPublicKey: publicKey,
        quantity: quantity,
        totalAmount: totalCost,
        sellerWalletAddress: sellerWalletAddress,
        transactionSignature: result.tx
      };
  
      const apiResponse = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });
  
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.warn('Backend API reported an issue:', errorData);
        // We don't throw here because the blockchain transaction already succeeded
      }
  
      setPurchaseSuccess(true);
      setTransactionSignature(result.tx || null);
      setTransactionDetails(JSON.stringify(result.data || {}, null, 2));
      
      // Refresh listings and token balance after successful purchase
      fetchListings();
      if (publicKey) {
        checkTokenBalance(publicKey);
      }
    } catch {
      setError('Failed to process purchase. Please try again.');
    } finally {
      setProcessingPurchase(false);
    }
  };

  // Calculate total cost
  const calculateTotal = () => {
    if (!selectedOffer || !quantity) return '0.00';
    const subtotal = selectedOffer.pricePerUnit * quantity;
    const discount = selectedOffer.discount 
      ? (subtotal * selectedOffer.discount) / 100 
      : 0;
    return (subtotal - discount).toFixed(2);
  };

  // Calculate network fee (0.5%)
  const calculateNetworkFee = () => {
    const total = parseFloat(calculateTotal());
    return (total * 0.005).toFixed(2);
  };

  // Filter listings based on search
  const filteredListings = listings.filter((listing) =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.energyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (listing.seller?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">EnergyPro</span>
            </Link>

            <div className="flex items-center space-x-4">
              {buyerTokenBalance !== null && connected && (
                <div className="bg-blue-900/50 px-4 py-2 rounded-lg">
                  <span className="text-blue-300 text-sm mr-2">BIJLEE Balance:</span>
                  <span className="text-white font-medium">{buyerTokenBalance.toFixed(2)}</span>
                </div>
              )}
              
              <button
                onClick={connectWallet}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  connected
                    ? 'bg-green-600/20 text-green-300 hover:bg-green-600/40'
                    : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/40'
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span>
                  {connecting ? 'Connecting...' : connected ? formatPublicKey(publicKey) : 'Connect Wallet'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 px-4 container mx-auto">
        {/* Refresh Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={fetchListings}
            className="bg-blue-600/50 text-white px-4 py-2 rounded-lg hover:bg-blue-600/70 transition-colors"
          >
            Refresh Listings
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title, energy type, location, or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="col-span-full text-center text-red-500 py-12">{error}</div>
          ) : filteredListings.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-12">
              {searchTerm ? 'No listings found matching your search.' : 'No listings available at this time.'}
            </div>
          ) : (
            filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-gray-800/50 rounded-xl p-6 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{listing.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{listing.description}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-gray-300">
                    <Package className="w-4 h-4 mr-2 text-blue-400" />
                    <span>
                      {listing.energyType} - {listing.availableUnits}/{listing.totalCapacity} kWh
                    </span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                    <span>{listing.location}, {listing.state}</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-xl font-bold text-blue-400">₹{listing.pricePerUnit}</span>
                    <span className="text-gray-400 text-sm">/kWh</span>
                    {listing.discount && listing.discount > 0 && (
                      <span className="ml-2 text-green-400 text-sm">
                        {listing.discount}% off
                      </span>
                    )}
                  </div>
                  
                  {/* Display seller wallet info */}
                  {listing.sellerWalletAddress && (
                    <div className="mt-1 text-xs text-gray-400 truncate">
                      Seller: {listing.sellerWalletAddress.substring(0, 6)}...{listing.sellerWalletAddress.substring(listing.sellerWalletAddress.length - 4)}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedOffer(listing);
                    setQuantity(listing.minPurchase);
                  }}
                  className="mt-4 w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-colors"
                >
                  Purchase
                </button>
              </div>
            ))
          )}
        </div>

        {/* Purchase Modal */}
        {selectedOffer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl w-full max-w-md p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-white">Purchase Energy</h2>
                <button 
                  onClick={() => {
                    setSelectedOffer(null);
                    setQuantity(0);
                    setPurchaseSuccess(false);
                    setTransactionSignature(null);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Success Message */}
                {purchaseSuccess && (
                  <div className="bg-green-500/10 border-l-4 border-green-500 text-green-300 p-4 mb-4">
                    <p className="font-medium">Purchase successful!</p>
                    {transactionSignature && (
                      <div className="mt-2 text-sm">
                        <p>Transaction: {formatPublicKey(transactionSignature)}</p>
                        <a 
                          href={`https://solscan.io/tx/${transactionSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline mt-1 inline-block"
                        >
                          View on Solscan
                        </a>
                      </div>
                    )}
                    
                    {transactionDetails && (
                      <div className="mt-2">
                        <div className="flex items-center cursor-pointer" 
                             onClick={() => setTransactionDetails(null)}>
                          <p className="text-sm text-blue-300">Transaction Details</p>
                          <ChevronDown className="h-4 w-4 ml-1 text-blue-300" />
                        </div>
                        <pre className="mt-2 text-xs overflow-auto max-h-32 bg-black/20 p-2 rounded">
                          {transactionDetails}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 p-4 mb-4">
                    {error}
                  </div>
                )}

                {/* Listing Details */}
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedOffer.title}</h3>
                  <p className="text-gray-400">{selectedOffer.seller?.name || 'Anonymous Seller'}</p>
                  
                  {/* Display seller wallet address */}
                  {selectedOffer.sellerWalletAddress && (
                    <p className="text-xs text-gray-400 mt-1">
                      Seller wallet: {selectedOffer.sellerWalletAddress.substring(0, 6)}...{selectedOffer.sellerWalletAddress.substring(selectedOffer.sellerWalletAddress.length - 4)}
                    </p>
                  )}
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quantity (kWh)
                  </label>
                  <input
                    type="number"
                    value={quantity || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setQuantity(Math.max(
                        selectedOffer.minPurchase,
                        Math.min(selectedOffer.maxPurchase, value)
                      ));
                    }}
                    className="w-full bg-gray-700/50 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={selectedOffer.minPurchase}
                    max={selectedOffer.maxPurchase}
                    required
                    disabled={processingPurchase || purchaseSuccess}
                  />
                  <div className="mt-1 text-sm text-gray-400">
                    Min: {selectedOffer.minPurchase} kWh | Max: {selectedOffer.maxPurchase} kWh
                    <br />
                    Available: {selectedOffer.availableUnits} kWh
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 border-t border-gray-700 pt-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Price per kWh</span>
                    <span>₹{selectedOffer.pricePerUnit}</span>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Quantity</span>
                    <span>{quantity} kWh</span>
                  </div>

                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>₹{(selectedOffer.pricePerUnit * quantity).toFixed(2)}</span>
                  </div>

                  {selectedOffer.discount && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount ({selectedOffer.discount}%)</span>
                      <span>-₹{((selectedOffer.pricePerUnit * quantity * selectedOffer.discount) / 100).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-300">
                    <span>Network Fee (0.5%)</span>
                    <span>₹{calculateNetworkFee()}</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-gray-700">
                    <span>Total</span>
                    <span>₹{(parseFloat(calculateTotal()) + parseFloat(calculateNetworkFee())).toFixed(2)}</span>
                  </div>

                  {buyerTokenBalance !== null && (
                    <div className="flex justify-between text-gray-300">
                      <span>Your BIJLEE Balance</span>
                      <span className={buyerTokenBalance < parseFloat(calculateTotal()) + parseFloat(calculateNetworkFee()) 
                        ? "text-red-400" 
                        : "text-green-400"
                      }>
                        {buyerTokenBalance.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Purchase Button */}
                <button
                  onClick={handlePurchase}
                  disabled={
                    !connected ||
                    !quantity || 
                    processingPurchase || 
                    purchaseSuccess || 
                    (buyerTokenBalance !== null && buyerTokenBalance < parseFloat(calculateTotal()) + parseFloat(calculateNetworkFee()))
                  }
                  className={`w-full bg-blue-600 text-white rounded-lg py-3 font-semibold 
                           disabled:opacity-50 disabled:cursor-not-allowed 
                           hover:bg-blue-700 transition-colors`}
                >
                  {processingPurchase ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : purchaseSuccess ? (
                    'Purchase Complete'
                  ) : !connected ? (
                    'Connect Wallet to Purchase'
                  ) : buyerTokenBalance !== null && buyerTokenBalance < parseFloat(calculateTotal()) + parseFloat(calculateNetworkFee()) ? (
                    'Insufficient BIJLEE Balance'
                  ) : quantity === 0 ? (
                    'Enter Quantity to Purchase'
                  ) : (
                    'Confirm Purchase with Phantom'
                  )}
                </button>

                {!connected && (
                  <p className="text-sm text-gray-400 text-center mt-2">
                    Please connect your Phantom wallet to make a purchase
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="mt-8 container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm">Total Available Energy</h3>
            <p className="text-2xl font-bold text-white mt-2">
              {listings.reduce((total, listing) => total + listing.availableUnits, 0)} kWh
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm">Active Sellers</h3>
            <p className="text-2xl font-bold text-white mt-2">
              {new Set(listings.map(listing => listing.sellerId)).size}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm">Average Price</h3>
            <p className="text-2xl font-bold text-white mt-2">
              ₹{listings.length > 0 
                  ? (listings.reduce((sum, listing) => sum + listing.pricePerUnit, 0) / listings.length).toFixed(2) 
                  : '0.00'}/kWh
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}