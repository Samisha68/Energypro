// src/lib/types/listing.ts

export enum EnergyType {
  SOLAR = 'SOLAR',
  WIND = 'WIND',
  HYDRO = 'HYDRO',
  BIOMASS = 'BIOMASS',
  GEOTHERMAL = 'GEOTHERMAL'
}

export enum DeliveryMethod {
  GRID = 'GRID',
  DIRECT = 'DIRECT',
  HYBRID = 'HYBRID'
}

export enum SourceType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  UTILITY = 'UTILITY'
}

export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SOLD_OUT = 'SOLD_OUT',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export interface Listing {
  sellerWalletAddress: string;
  id: string;
  sellerId: string;
  title: string;
  description?: string;
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
  discount?: number | null;
  deliveryMethod: DeliveryMethod;
  sourceType: SourceType;
  certification?: string | null;
  status: ListingStatus;
  visibility: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}