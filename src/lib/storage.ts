import { Barber, Service, Client, Appointment, User } from '@/types';

const STORAGE_KEYS = {
  BARBERS: 'barbershop_barbers',
  SERVICES: 'barbershop_services',
  CLIENTS: 'barbershop_clients',
  APPOINTMENTS: 'barbershop_appointments',
  USERS: 'barbershop_users',
  CURRENT_USER: 'barbershop_current_user',
};

// Initialize with default data
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    const defaultServices: Service[] = [
      {
        id: '1',
        name: 'Corte Clássico',
        description: 'Corte tradicional com máquina e tesoura',
        duration: 30,
        price: 50,
      },
      {
        id: '2',
        name: 'Barba Completa',
        description: 'Aparar e modelar barba com navalha',
        duration: 30,
        price: 40,
      },
      {
        id: '3',
        name: 'Corte + Barba',
        description: 'Pacote completo de corte e barba',
        duration: 60,
        price: 80,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(defaultServices));
  }

  if (!localStorage.getItem(STORAGE_KEYS.BARBERS)) {
    const defaultBarbers: Barber[] = [
      {
        id: '1',
        name: 'João Silva',
        specialties: ['Corte Clássico', 'Fade'],
        availableHours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
      },
      {
        id: '2',
        name: 'Carlos Santos',
        specialties: ['Barba', 'Corte + Barba'],
        availableHours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
      },
    ];
    localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(defaultBarbers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: User[] = [
      {
        id: '1',
        email: 'admin@barbershop.com',
        name: 'Administrador',
        role: 'admin',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify([]));
  }
};

initializeData();

export const storage = {
  // Barbers
  getBarbers: (): Barber[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BARBERS) || '[]');
  },
  saveBarbers: (barbers: Barber[]) => {
    localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(barbers));
  },

  // Services
  getServices: (): Service[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES) || '[]');
  },
  saveServices: (services: Service[]) => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  },

  // Clients
  getClients: (): Client[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
  },
  saveClients: (clients: Client[]) => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  },

  // Appointments
  getAppointments: (): Appointment[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]');
  },
  saveAppointments: (appointments: Appointment[]) => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  },

  // Users
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },
  
  // Auth
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  },
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },
};
