export interface Barber {
  id: string;
  name: string;
  photo?: string;
  bio?: string;
  specialties: string[];
  availableHours: string[];
  scheduleByDay?: Record<number, string[]>; // New field for schedule by day (0=Sun, 1=Mon, ..., 6=Sat)
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
  loyaltyPoints: number;
  image?: string; // Base64 image
  category?: string; // New field for category
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
  stylePreferences?: string[]; // New field
  latestCuts?: Cut[]; // New field for latest cuts
  noShowCount?: number; // Tracks number of times the client didn't show up
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
  serviceId: string; // Keep for compatibility (first service)
  serviceIds?: string[]; // NEW: List of all services in this appointment
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'in_progress' | 'completed' | 'no_show';
  createdAt: string;
  reminderSent?: boolean;

  startTime?: string;
  endTime?: string;
  paymentType?: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link';
  isDelayed?: boolean;
  servicePrice: number; // Price of the service at the time of booking
  extraCharges?: number; // New: For additional costs
  discount?: number; // New: For discount amount applied on checkout
  finalPrice?: number; // New: Final price after all adjustments
  amountPaid?: number; // New: Amount already paid (e.g. deposit/signal)
}
export interface RecurringSchedule {
  id: string;
  userId: string;
  barberId: string;
  serviceId: string; // Mantido para compatibilidade
  serviceIds?: string[]; // Novo: Lista de múltiplos serviços
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  time: string; // "HH:mm"
  active: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  barberId: string;
  description: string;
  amount: number;
  date: string; // e.g. "2024-03-20"
  category: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  weight: string; // ex: "100g", "200g"
  price: number;
  stock?: number;
  imageIndices?: number[]; // Lista de índices (0, 1, 2)
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  image2?: string;
  image3?: string;
  category?: string;
  stock?: number;
  active: boolean;
  variants?: ProductVariant[];
}
