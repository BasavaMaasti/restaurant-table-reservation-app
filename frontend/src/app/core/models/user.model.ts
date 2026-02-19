export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'super_admin';
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  restaurantId?: string;
  preferences?: { cuisine: string[]; dietaryRestrictions: string[] };
  lastLogin?: string;
  createdAt: string;
}
