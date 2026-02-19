export interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  cuisine: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    location?: { type: string; coordinates: number[] };
  };
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  phone?: string;
  email?: string;
  images: string[];
  coverImage?: string;
  operatingHours: OperatingHour[];
  features: string[];
  totalTables: number;
  totalCapacity: number;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  isVerified: boolean;
  reservationDuration: number;
  slotInterval: number;
}

export interface OperatingHour {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  displayTime: string;
  available: boolean;
  availableTablesCount: number;
  tables: TableSlot[];
}

export interface TableSlot {
  _id: string;
  tableNumber: string;
  capacity: number;
  section: string;
  features: string[];
}

export interface RestaurantAvailability {
  restaurant: { name: string; reservationDuration: number };
  date: string;
  guestCount: number;
  slots: TimeSlot[];
}
