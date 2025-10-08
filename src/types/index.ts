export interface Barber {
  id: string;
  name: string;
  photo?: string;
  bio?: string;
  specialties: string[];
  availableHours: string[];
  availableDates: string[]; // New field for available dates (yyyy-MM-dd)
  yearsOfExperience?: number; // New field
  description?: string; // New field
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  loyaltyPoints: number; // New field for loyalty points
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  email?: string;
  phone: string;
  role: 'admin' | 'barber' | 'client';
  barberId?: string; // Link to the barber profile
  loyaltyPoints?: number;
  createdAt: string;
  avatarUrl?: string; // New field
  cutsCount?: number; // New field
  favoriteProducts?: string[]; // New field
  latestCuts?: Cut[]; // New field for latest cuts
}

export interface Cut {
  id: string;
  date: string; // e.g., "2025-10-07"
  barberName: string;
  imageUrl?: string;
  service: string; // e.g., "Haircut", "Beard Trim"
}

export interface Appointment {
  id: string;
  userId: string | null;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;

  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'in_progress' | 'completed';
  createdAt: string;
  
  startTime?: string;
  endTime?: string;
  paymentType?: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link';
  isDelayed?: boolean;
  servicePrice: number; // Price of the service at the time of booking
  extraCharges?: number; // New: For additional costs
  finalPrice?: number; // New: Final price after all adjustments
}
