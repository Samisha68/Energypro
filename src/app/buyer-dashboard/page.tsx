'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, Search, Package, MapPin} from 'lucide-react';
import Link from 'next/link';

// Types
interface Listing {
  id: string;
  sellerId: string;
  seller: {
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
  visibility: boolean;
  featured: boolean;
}




export default function BuyerDashboard() {
  // State Management
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Listing | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [walletProvider, setWalletProvider] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch listings on component mount
  useEffect(() => {
    fetchListings();
    checkWalletConnection();
  }, []);

  // Fetch listings from API
  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/listings');

      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch listings');
      }

      setListings(data.data);
      setError(null);
    } catch (error) {
      setError('Failed to load listings. Please try again later.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Wallet Connection Check
  const checkWalletConnection = async () => {
    try {
      const solanaProvider = (window as any)?.solana;
      const phantomProvider = (window as any)?.phantom?.solana;
      const backpackProvider = (window as any)?.backpack?.solana;
      const selectedProvider = solanaProvider || phantomProvider || backpackProvider;

      if (selectedProvider) {
        setWalletProvider(selectedProvider);
        if (selectedProvider.isConnected) {
          const resp = await selectedProvider.connect({ onlyIfTrusted: true });
          setPublicKey(resp.publicKey.toString());
          setIsWalletConnected(true);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  // Connect Wallet
  const connectWallet = async () => {
    try {
      if (!walletProvider) {
        alert('Please install a Solana wallet (Phantom, Solana, or Backpack)!');
        window.open('https://phantom.app/', '_blank');
        return;
      }

      const resp = await walletProvider.connect();
      setPublicKey(resp.publicKey.toString());
      setIsWalletConnected(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  // Handle Purchase
  const handlePurchase = async () => {
    if (!isWalletConnected || !selectedOffer || !quantity) {
      alert('Please connect wallet and select quantity first');
      return;
    }
  
    try {
      // Calculate the exact total with network fee
      const subtotal = selectedOffer.pricePerUnit * quantity;
      
      const totalAmount = subtotal; // Remove network fee from total since it's handled separately
  
      const purchaseData = {
        listingId: selectedOffer.id,
        buyerPublicKey: publicKey,
        quantity: Number(quantity),
        totalAmount: Number(totalAmount)
      };
  
      console.log('Sending purchase request:', purchaseData);
  
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Purchase failed');
      }
  
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Purchase failed');
      }
  
      alert('Purchase successful!');
      setQuantity(0);
      setSelectedOffer(null);
      fetchListings(); // Refresh listings
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(error instanceof Error ? error.message : 'Energy purchase failed. Please try again.');
    }
  };
  // Format wallet address
  const formatPublicKey = (key: string | null) => {
    if (!key) return '';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
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

  // Filter listings based on search
  const filteredListings = listings.filter((listing) =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.energyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.seller.name?.toLowerCase().includes(searchTerm.toLowerCase())
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

            <button
              onClick={connectWallet}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isWalletConnected
                  ? 'bg-green-600/20 text-green-300 hover:bg-green-600/40'
                  : 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/40'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span>
                {isWalletConnected ? formatPublicKey(publicKey) : 'Connect Wallet'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 px-4 container mx-auto">
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
              No listings found matching your search.
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
                </div>

                <button
                  onClick={() => setSelectedOffer(listing)}
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
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Listing Details */}
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedOffer.title}</h3>
                  <p className="text-gray-400">{selectedOffer.seller.name || 'Anonymous Seller'}</p>
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
                      const value = parseInt(e.target.value) || 0;
                      setQuantity(Math.max(
                        selectedOffer.minPurchase,
                        Math.min(selectedOffer.maxPurchase, value)
                      ));
                    }}
                    className="w-full bg-gray-700/50 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={selectedOffer.minPurchase}
                    max={selectedOffer.maxPurchase}
                    required
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
                    <span>Network Fee</span>
                    <span>₹0.50</span>
                  </div>

                  <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-gray-700">
                    <span>Total</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={handlePurchase}
                  disabled={!isWalletConnected || quantity === 0}
                  className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold 
                           disabled:opacity-50 disabled:cursor-not-allowed 
                           hover:bg-blue-700 transition-colors"
                >
                  {!isWalletConnected 
                    ? 'Connect Wallet to Purchase' 
                    : quantity === 0 
                      ? 'Enter Quantity to Purchase' 
                      : 'Confirm Purchase'}
                </button>

                {!isWalletConnected && (
                  <p className="text-sm text-gray-400 text-center mt-2">
                    Please connect your wallet to make a purchase
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="mt-8 container mx-auto px-4">
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