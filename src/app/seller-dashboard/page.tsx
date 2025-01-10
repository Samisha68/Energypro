
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Package, MapPin, Edit, Trash, BarChart4, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Listing, EnergyType, DeliveryMethod, SourceType } from '@/lib/types/listing';

interface ListingFormData {
  id?: string;
  title: string;
  description: string;
  energyType: EnergyType;
  location: string;
  state: string;
  pincode: string;
  address: string;
  totalCapacity: number;
  availableUnits: number;
  minPurchase: number;
  maxPurchase: number;
  pricePerUnit: number;
  deliveryMethod: DeliveryMethod;
  sourceType: SourceType;
  certification?: string;
  discount?: number;
}

export default function SellerDashboard() {
  // State Management
  const [listings, setListings] = useState<Listing[]>([]);
  const [isAddingListing, setIsAddingListing] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  
  const [walletProvider, setWalletProvider] = useState<any>(null);

  const initialFormState: ListingFormData = {
    title: '',
    description: '',
    energyType: EnergyType.SOLAR,
    location: '',
    state: '',
    pincode: '',
    address: '',
    totalCapacity: 0,
    availableUnits: 0,
    minPurchase: 0,
    maxPurchase: 0,
    pricePerUnit: 0,
    deliveryMethod: DeliveryMethod.GRID,
    sourceType: SourceType.RESIDENTIAL,
    certification: '',
    discount: 0
  };
  const [formData, setFormData] = useState<ListingFormData>(initialFormState);

  // Wallet Connection
  const connectWallet = async () => {
    try {
      if (!walletProvider) {
        const wallets = [];
        if ((window as any)?.phantom?.solana) wallets.push("Phantom");
        if ((window as any)?.solana) wallets.push("Solana");
        if ((window as any)?.backpack?.solana) wallets.push("Backpack");

        if (wallets.length === 0) {
          alert('Please install a Solana wallet (Phantom, Solana, or Backpack)!');
          window.open('https://phantom.app/', '_blank');
          return;
        }

        if (wallets.length > 1) {
          const walletChoice = window.confirm(
            `Multiple wallets detected. Click OK to use ${wallets[0]} or Cancel to use ${wallets[1]}`
          );
           
          setWalletProvider(walletChoice ? 
            (window as any)?.phantom?.solana : 
            (window as any)?.solana || (window as any)?.backpack?.solana
          );
        } else {
          setWalletProvider((window as any)?.phantom?.solana || 
                          (window as any)?.solana || 
                          (window as any)?.backpack?.solana);
        }
      }

      if (walletProvider) {
        const resp = await walletProvider.connect();
        setPublicKey(resp.publicKey.toString());
        setIsWalletConnected(true);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  // Fetch Listings
  useEffect(() => {
    fetchListings();
  }, []);

  // Update these parts in your SellerDashboard component
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWalletConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setError(null);
    
    try {
      const processedFormData = {
        ...formData,
        ...(editingListing?.id && { id: editingListing.id }),
        totalCapacity: Number(formData.totalCapacity),
        availableUnits: Number(formData.availableUnits),
        minPurchase: Number(formData.minPurchase),
        maxPurchase: Number(formData.maxPurchase),
        pricePerUnit: Number(formData.pricePerUnit),
        discount: formData.discount ? Number(formData.discount) : null,
        // sellerId will be extracted from JWT token in the API
        energyType: formData.energyType,
        deliveryMethod: formData.deliveryMethod,
        sourceType: formData.sourceType,
      };
  
      const response = await fetch('/api/listings', {
        method: editingListing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedFormData),
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save listing');
      }
  
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save listing');
      }
  
      await fetchListings();
      setIsAddingListing(false);
      setEditingListing(null);
      setFormData(initialFormState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save listing';
      setError(errorMessage);
      console.error('Submission Error:', error);
    }
  };
  const fetchListings = async () => {
    try {
      const response = await fetch('/api/listings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      
      const data = await response.json();
      if (data.success) {
        setListings(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch listings');
      }
    } catch (error) {
      setError('Failed to load listings. Please try again later.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this listing?')) return;

  try {
    const response = await fetch(`/api/listings?id=${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete listing');
    }

    await fetchListings();
  } catch (error) {
    setError('Failed to delete listing. Please try again.');
    console.error('Error:', error);
  }
};// Edit Listing
  const handleEdit = (listing: Listing) => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first');
      return;
    }
    setEditingListing(listing);
    setFormData({
      id: listing.id,
      title: listing.title,
      description: listing.description || '',
      energyType: listing.energyType,
      location: listing.location,
      state: listing.state,
      pincode: listing.pincode,
      address: listing.address,
      totalCapacity: listing.totalCapacity,
      availableUnits: listing.availableUnits,
      minPurchase: listing.minPurchase,
      maxPurchase: listing.maxPurchase,
      pricePerUnit: listing.pricePerUnit,
      deliveryMethod: listing.deliveryMethod,
      sourceType: listing.sourceType,
      certification: listing.certification || '',
      discount: listing.discount || 0
    });
    setIsAddingListing(true);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <BarChart4 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Seller Portal</span>
            </Link>
            
            <div className="flex items-center space-x-4">
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
                  {isWalletConnected ? `${publicKey?.slice(0, 4)}...${publicKey?.slice(-4)}` : 'Connect Wallet'}
                </span>
              </button>

              <button
                onClick={() => {
                  if (!isWalletConnected) {
                    alert('Please connect your wallet first');
                    return;
                  }
                  setIsAddingListing(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/40 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>New Listing</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 px-4 container mx-auto pb-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm">Total Listings</h3>
            <p className="text-2xl font-bold text-white mt-2">{listings.length}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm">Total Energy</h3>
            <p className="text-2xl font-bold text-white mt-2">
              {listings.reduce((total, listing) => total + listing.totalCapacity, 0)} kWh
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-gray-400 text-sm">Available Energy</h3>
            <p className="text-2xl font-bold text-white mt-2">
              {listings.reduce((total, listing) => total + listing.availableUnits, 0)} kWh
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            {error}
          </div>
        )}

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-gray-800/50 rounded-xl p-6 hover:bg-gray-800/70 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">{listing.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{listing.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(listing)}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
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
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!isLoading && listings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No listings yet. Click &quot;New Listing&quot; to add your first listing.</p>
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {isAddingListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 ">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingListing ? 'Edit Listing' : 'Add New Listing'}
                </h2>
                <button 
                  onClick={() => {
                    setIsAddingListing(false);
                    setEditingListing(null);
                    setFormData(initialFormState);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    />
                  </div>

                  <div className="col-span-2">
  <label className="block text-sm font-medium text-gray-300">Description</label>
  <textarea
    value={formData.description}
    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
    className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
    rows={3}
  />
</div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Energy Type</label>
                    <select
                      value={formData.energyType}
                      onChange={(e) => setFormData({ ...formData, energyType: e.target.value as EnergyType })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    >
                      {Object.values(EnergyType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Source Type</label>
                    <select
                      value={formData.sourceType}
                      onChange={(e) => setFormData({ ...formData, sourceType: e.target.value as SourceType })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    >
                      {Object.values(SourceType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Full Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Total Capacity (kWh)</label>
                    <input
                      type="number"
                      value={formData.totalCapacity}
                      onChange={(e) => setFormData({ ...formData, totalCapacity: Number(e.target.value) })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Available Units (kWh)</label>
                    <input
                      type="number"
                      value={formData.availableUnits}
                      onChange={(e) => setFormData({ ...formData, availableUnits: Number(e.target.value) })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Min Purchase (kWh)</label>
                    <input
                      type="number"
                      value={formData.minPurchase}
                      onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Max Purchase (kWh)</label>
                    <input
                      type="number"
                      value={formData.maxPurchase}
                      onChange={(e) => setFormData({ ...formData, maxPurchase: Number(e.target.value) })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Price per Unit (₹/kWh)</label>
                    <input
                      type="number"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({ ...formData, pricePerUnit: Number(e.target.value) })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Delivery Method</label>
                    <select
                      value={formData.deliveryMethod}
                      onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value as DeliveryMethod })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    >
                      {Object.values(DeliveryMethod).map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Certification (Optional)</label>
                    <input
                      type="text"
                      value={formData.certification || ''}
                      onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Discount % (Optional)</label>
                    <input
                      type="number"
                      value={formData.discount || ''}
                      onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingListing(false);
                      setEditingListing(null);
                      setFormData(initialFormState);
                    }}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingListing ? 'Update Listing' : 'Create Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}