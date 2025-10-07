export interface Barber {
  id: string;
  name: string;
  photo?: string;
  bio?: string;
  specialties: string[];
  availableHours: string[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'barber' | 'receptionist';
}
