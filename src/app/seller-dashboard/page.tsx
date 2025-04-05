// src/app/seller-dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Package, MapPin, Edit, Trash, BarChart4, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Listing, EnergyType, DeliveryMethod, SourceType } from '@/lib/types/listing';
import { getSolanaConnection } from '@/lib/solana-wallet';
import { initializeListingOnChain, checkListingInitialized } from '@/lib/bijlee-exchange';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaProvider, WalletButton } from '../components/solana-provider';
import { createWalletAdapter, formatAddress } from '@/lib/wallet-helper';


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
  sellerWalletAddress: string;
}

// The dashboard content component
function SellerDashboardContent() {
  // State Management
  const [listings, setListings] = useState<Listing[]>([]);
  const [isAddingListing, setIsAddingListing] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  const [initializedListings, setInitializedListings] = useState<Record<string, boolean>>({});
  const [checkingInitialization, setCheckingInitialization] = useState<boolean>(false);
  
  // Blockchain status state
  const [blockchainStatus, setBlockchainStatus] = useState<{
    action: string;
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({
    action: '',
    status: 'idle'
  });
  
  // Use the wallet adapter hook
  const walletContext = useWallet();
  const { publicKey, connected, wallet, connecting } = walletContext;
  
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
    discount: 0,
    sellerWalletAddress: ''
  };
  const [formData, setFormData] = useState<ListingFormData>(initialFormState);

  // Wrap checkListingsInitialization in useCallback
  const checkListingsInitialization = useCallback(async (listings: Listing[]) => {
    // Add null check for wallet
    if (!connected || !wallet || !publicKey) return;
    
    setCheckingInitialization(true);
    
    try {
      const initializedStatus: Record<string, boolean> = {};
      
      for (const listing of listings) {
        try {
          const result = await checkListingInitialized(
            getSolanaConnection(),
            listing.id,
            listing.sellerWalletAddress
          );
          // Since checkListingInitialized returns a boolean, just use it directly
          initializedStatus[listing.id] = result;
        } catch (error) {
          console.error(`Error checking listing ${listing.id}:`, error);
          initializedStatus[listing.id] = false;
        }
      }
      
      setInitializedListings(initializedStatus);
    } catch (error) {
      console.error('Error checking listings initialization:', error);
    } finally {
      setCheckingInitialization(false);
    }
  }, [connected, wallet, publicKey]);

  // Fetch listings from your API - wrap in useCallback
  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/listings?sellerId=current');

      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      
      const data = await response.json();
      if (data.success) {
        setListings(data.data);
        
        // Check which listings are initialized on the blockchain
        if (data.data.length > 0 && connected) {
          checkListingsInitialization(data.data);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch listings');
      }
    } catch (error) {
      setError('Failed to load listings. Please try again later.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [connected, checkListingsInitialization]);
  
  // Load listings on component mount and when wallet connects
  useEffect(() => {
    fetchListings();
    
    // Automatically set the wallet address when connected
    if (connected && publicKey) {
      setFormData(prev => ({
        ...prev,
        sellerWalletAddress: publicKey.toString()
      }));
    }
  }, [connected, publicKey, fetchListings]);

  // Re-check initialization when wallet connects
  useEffect(() => {
    if (connected && listings.length > 0) {
      checkListingsInitialization(listings);
    }
  }, [connected, listings, checkListingsInitialization]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle empty numeric inputs
    if (type === 'number' && value === '') {
      setFormData({
        ...formData,
        [name]: '' // Keep it as empty string, not 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'number' ? parseFloat(value) : value
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !wallet || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    setProcessingAction(true);
    setBlockchainStatus({
      action: editingListing ? 'updating' : 'creating',
      status: 'loading',
      message: `${editingListing ? 'Updating' : 'Creating'} listing on blockchain... (This will automatically set up your token account if needed)`
    });
    
    try {
      // Create a wallet adapter using the wallet context
      const walletAdapter = createWalletAdapter(walletContext);
      const connection = getSolanaConnection();
      
      if (editingListing) {
        // Update the listing in your backend
        const backendResponse = await fetch('/api/listings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingListing.id,
            ...formData
          }),
        });
        
        const responseData = await backendResponse.json();
        
        if (!backendResponse.ok) {
          throw new Error(responseData.error || 'Failed to update listing');
        }
        
        // Initialize or update the listing on the blockchain
        const result = await initializeListingOnChain(
          walletAdapter,
          connection,
          responseData.data.id,
          formData.pricePerUnit,
          formData.availableUnits,
          formData.minPurchase,
          formData.maxPurchase
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update listing on blockchain');
        }
        
        setBlockchainStatus({
          action: 'updating',
          status: 'success',
          message: 'Listing updated successfully on blockchain! Token account is ready to receive BIJLEE tokens.'
        });
      } else {
        // Create a new listing in your backend
        const backendResponse = await fetch('/api/listings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        const responseData = await backendResponse.json();
        
        if (!backendResponse.ok) {
          throw new Error(responseData.error || 'Failed to create listing');
        }
        
        // Initialize the listing on the blockchain (with automatic token account creation)
        const result = await initializeListingOnChain(
          walletAdapter,
          connection,
          responseData.data.id,
          formData.pricePerUnit,
          formData.availableUnits,
          formData.minPurchase,
          formData.maxPurchase
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to initialize listing on blockchain');
        }
        
        setBlockchainStatus({
          action: 'creating',
          status: 'success',
          message: 'Listing created successfully on blockchain! Token account is ready to receive BIJLEE tokens.'
        });
      }
      
      // Reset and refresh
      setFormData(initialFormState);
      setEditingListing(null);
      setIsAddingListing(false);
      
      // Refresh listings
      fetchListings();
    } catch (error) {
      console.error('Submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process listing');
      setBlockchainStatus({
        action: editingListing ? 'updating' : 'creating',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setProcessingAction(false);
      // Clear blockchain status after 5 seconds if successful
      if (blockchainStatus.status === 'success') {
        setTimeout(() => {
          setBlockchainStatus({
            action: '',
            status: 'idle'
          });
        }, 5000);
      }
    }
  };

  // Edit listing
  const handleEdit = (listing: Listing) => {
    setEditingListing(listing);
    setFormData({
      id: listing.id,
      title: listing.title,
      description: listing.description || '',
      energyType: listing.energyType as EnergyType,
      location: listing.location,
      state: listing.state,
      pincode: listing.pincode || '',
      address: listing.address,
      totalCapacity: listing.totalCapacity,
      availableUnits: listing.availableUnits,
      minPurchase: listing.minPurchase,
      maxPurchase: listing.maxPurchase,
      pricePerUnit: listing.pricePerUnit,
      deliveryMethod: listing.deliveryMethod as DeliveryMethod,
      sourceType: listing.sourceType as SourceType,
      certification: listing.certification || '',
      discount: listing.discount || 0,
      sellerWalletAddress: listing.sellerWalletAddress || ''
    });
    setIsAddingListing(true);
  };

  // Delete listing
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    setProcessingAction(true);
    
    try {
      // Delete from backend
      const response = await fetch(`/api/listings?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete listing');
      }

      // Refresh listings
      fetchListings();
    } catch (error) {
      setError('Failed to delete listing. Please try again.');
      console.error('Error:', error);
    } finally {
      setProcessingAction(false);
    }
  };

  // Initialize listing on blockchain
  const handleInitializeOnChain = async (listing: Listing) => {
    if (!connected || !wallet || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setProcessingAction(true);
    setError(null);
    setBlockchainStatus({
      action: 'initializing',
      status: 'loading',
      message: `Initializing listing "${listing.title}" on blockchain... (This will automatically set up your token account if needed)`
    });

    try {
      const connection = getSolanaConnection();
      const walletAdapter = createWalletAdapter(walletContext);
      
      const result = await initializeListingOnChain(
        walletAdapter,
        connection,
        listing.id,
        listing.pricePerUnit,
        listing.availableUnits,
        listing.minPurchase,
        listing.maxPurchase
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize listing on blockchain');
      }

      // Update the listing in the database with the correct seller wallet address
      if (result.data && result.data.sellerAddress) {
        const walletAddress = result.data.sellerAddress;
        
        // Only update if the address is different
        if (walletAddress !== listing.sellerWalletAddress) {
          const { id: listingId, ...listingWithoutId } = listing;
          const updateResponse = await fetch('/api/listings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: listingId,
              ...listingWithoutId,
              sellerWalletAddress: walletAddress
            }),
          });
          
          if (!updateResponse.ok) {
            console.warn('Failed to update listing wallet address in database, but blockchain initialization succeeded');
          } else {
            // Refresh listings to show the updated wallet address
            fetchListings();
          }
        }
      }

      setBlockchainStatus({
        action: 'initializing',
        status: 'success',
        message: `Listing "${listing.title}" successfully initialized on blockchain! Token account is ready to receive BIJLEE tokens.`
      });
    } catch (error) {
      console.error('Error initializing listing on blockchain:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize listing on blockchain');
      setBlockchainStatus({
        action: 'initializing',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setProcessingAction(false);
      // Clear blockchain status after 5 seconds if successful
      if (blockchainStatus.status === 'success') {
        setTimeout(() => {
          setBlockchainStatus({
            action: '',
            status: 'idle'
          });
        }, 5000);
      }
    }
  };

  // Render initialization status for each listing
  const renderInitializationStatus = (listing: Listing) => {
    if (checkingInitialization) {
      return (
        <div className="flex items-center text-blue-400 text-sm mt-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 mr-1"></div>
          <span>Checking status...</span>
        </div>
      );
    }
    
    const isInitialized = initializedListings[listing.id];
    
    if (isInitialized === undefined) {
      return null; // Status unknown
    }
    
    if (isInitialized) {
      return (
        <div className="flex items-center text-green-400 text-sm mt-2">
          <CheckCircle size={16} className="mr-1" />
          <span>Initialized on blockchain</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-yellow-400 text-sm mt-2">
          <AlertTriangle size={16} className="mr-1" />
          <span>Not initialized on blockchain</span>
        </div>
      );
    }
  };
  
  // Render blockchain status in the UI
  const renderBlockchainStatus = () => {
    if (blockchainStatus.status === 'idle') return null;
    
    const colors = {
      loading: 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-300',
      success: 'bg-green-500/10 border-l-4 border-green-500 text-green-300',
      error: 'bg-red-500/10 border-l-4 border-red-500 text-red-300'
    };
    
    return (
      <div className={`p-4 mb-6 ${colors[blockchainStatus.status]}`}>
        <div className="flex items-center">
          {blockchainStatus.status === 'loading' && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          )}
          <p>{blockchainStatus.message}</p>
        </div>
      </div>
    );
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
              {/* Wallet Button */}
              <WalletButton />

              <button
                onClick={() => {
                  setIsAddingListing(true);
                  setEditingListing(null);
                  setFormData(initialFormState);
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
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border-l-4 border-red-500 text-red-300 p-4 mb-6">
            {error}
          </div>
        )}
        
        {/* Blockchain Status Message */}
        {renderBlockchainStatus()}
        
        {/* Wallet Connection Banner (only shown when not connected) */}
        {!connected && (
          <div className="bg-blue-500/10 border-l-4 border-blue-500 text-blue-300 p-4 mb-6 flex justify-between items-center">
            <div>
              <p className="font-semibold text-lg">Connect Your Wallet</p>
              <p className="text-sm">You need to connect your wallet to create and manage listings.</p>
            </div>
          </div>
        )}

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

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : listings.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">No listings yet. Click &quot;New Listing&quot; to add your first listing.</p>
            </div>
          ) : (
            listings.map((listing) => (
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
                      disabled={processingAction}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                      disabled={processingAction}
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleInitializeOnChain(listing)}
                      className="p-2 text-purple-400 hover:bg-purple-400/10 rounded"
                      disabled={processingAction || initializedListings[listing.id]}
                      title={initializedListings[listing.id] ? "Already initialized on blockchain" : "Initialize on blockchain"}
                    >
                      <BarChart4 className="w-4 h-4" />
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
                  
                  {/* Show wallet address if available */}
                  {listing.sellerWalletAddress && (
                    <div className="mt-1 text-xs text-gray-400 truncate">
                      Wallet: {formatAddress(listing.sellerWalletAddress, 6, 4)}
                    </div>
                  )}
                </div>

                {renderInitializationStatus(listing)}
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {isAddingListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
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
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2">
                      Seller Wallet Address
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    {connected && publicKey ? (
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <input
                            type="text"
                            name="sellerWalletAddress"
                            value={publicKey.toString()}
                            readOnly
                            className="w-full bg-gray-700 text-gray-300 p-2 rounded border border-gray-600 cursor-not-allowed"
                          />
                          <span className="ml-2 text-green-400 flex items-center">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                            Connected
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                          This wallet will receive payments for energy sold. A token account will be automatically created if needed.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <input
                          type="text"
                          name="sellerWalletAddress"
                          value={formData.sellerWalletAddress}
                          onChange={handleChange}
                          placeholder="Connect your wallet to continue"
                          className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
                          disabled={true}
                        />
                        <div className="mt-2">
                          <WalletButton />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Energy Type</label>
                    <select
                      name="energyType"
                      value={formData.energyType}
                      onChange={handleChange}
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
                      name="sourceType"
                      value={formData.sourceType}
                      onChange={handleChange}
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
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Full Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Total Capacity (kWh)</label>
                    <input
                      type="number"
                      name="totalCapacity"
                      value={formData.totalCapacity || ''}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min="0"
                      step="0.01"
                      required
                      // Disable editing total capacity for existing listings
                      disabled={!!editingListing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Available Units (kWh)</label>
                    <input
                      type="number"
                      name="availableUnits"
                      value={formData.availableUnits || ''}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min="0"
                      max={formData.totalCapacity ? String(formData.totalCapacity) : undefined}
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Min Purchase (kWh)</label>
                    <input
                      type="number"
                      name="minPurchase"
                      value={formData.minPurchase || ''}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min="0"
                      max={formData.availableUnits ? String(formData.availableUnits) : undefined}
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Max Purchase (kWh)</label>
                    <input
                      type="number"
                      name="maxPurchase"
                      value={formData.maxPurchase || ''}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min={formData.minPurchase ? String(formData.minPurchase) : "0"}
                      max={formData.availableUnits ? String(formData.availableUnits) : undefined}
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Price per Unit (₹/kWh)</label>
                    <input
                      type="number"
                      name="pricePerUnit"
                      value={formData.pricePerUnit || ''}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Delivery Method</label>
                    <select
                      name="deliveryMethod"
                      value={formData.deliveryMethod}
                      onChange={handleChange}
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
                      name="certification"
                      value={formData.certification || ''}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Discount % (Optional)</label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount || ''}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md bg-gray-700/50 border-gray-600 text-white px-3 py-2"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                {/* Form note about blockchain interaction */}
                <div className="bg-blue-500/10 border-l-4 border-blue-500 text-blue-300 p-4 text-sm">
                  <p><strong>Note:</strong> Creating or updating a listing will initialize it on the Solana blockchain. 
                  This will automatically set up your token account to receive BIJLEE tokens when your energy is purchased.</p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingListing(false);
                      setEditingListing(null);
                      setFormData(initialFormState);
                    }}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                    disabled={processingAction}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingAction || !connected}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      processingAction || !connected
                        ? 'bg-blue-700/50 text-blue-300 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {processingAction ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      editingListing ? 'Update Listing' : 'Create Listing'
                    )}
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

// Wrap with SolanaProvider
function SellerDashboardWithProvider() {
  return (
    <SolanaProvider>
      <SellerDashboardContent />
    </SolanaProvider>
  );
}

// Default export
export default function SellerDashboard() {
  return <SellerDashboardWithProvider />;
}