// app/lib/models/User.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the User document interface
export interface IUser extends Document {
  email: string;
  name?: string;
  image?: string;
  role: 'buyer' | 'seller';
  createdAt: Date;
}

// Define the User schema
const UserSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String 
  },
  image: { 
    type: String 
  },
  role: { 
    type: String, 
    enum: ['buyer', 'seller'], 
    default: 'buyer' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Create or get the User model
const User: Model<IUser> = 
  mongoose.models.User as Model<IUser> || 
  mongoose.model<IUser>('User', UserSchema);

export default User;