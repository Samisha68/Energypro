export enum UserRole {
    BUYER = "BUYER",
    SELLER = "SELLER"
  }
  
  export interface IUser {
    _id?: string;
    name?: string;
    email: string;
    image?: string;
    role?: UserRole;
  }
  
  export interface IListing {
    _id?: string;
    sellerId: string;
    name: string;
    location: string;
    pricePerUnit: number;
    maxUnitsAvailable: number;
    availableUnits: number;
    createdAt?: Date;
  }