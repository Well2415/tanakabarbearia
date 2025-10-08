import { Barber, Service, Appointment, User } from '@/types';
import { format } from 'date-fns'; // Import format

const STORAGE_KEYS = {
  BARBERS: 'barbershop_barbers',
  SERVICES: 'barbershop_services',
  APPOINTMENTS: 'barbershop_appointments',
  USERS: 'barbershop_users',
  LOGGED_IN_USER_ID: 'barbershop_logged_in_user_id',
  LOYALTY_TARGET: 'barbershop_loyalty_target',
};

// Initialize with default data
const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    const defaultServices: Service[] = [
      { id: '1', name: 'Corte Clássico', description: 'Corte tradicional com máquina e tesoura', duration: 30, price: 50, loyaltyPoints: 5 },
      { id: '2', name: 'Barba Completa', description: 'Aparar e modelar barba com navalha', duration: 30, price: 40, loyaltyPoints: 4 },
      { id: '3', name: 'Corte + Barba', description: 'Pacote completo de corte e barba', duration: 60, price: 80, loyaltyPoints: 8 },
    ];
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(defaultServices));
  }

  if (!localStorage.getItem(STORAGE_KEYS.BARBERS)) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    const defaultBarbers: Barber[] = [
      {
        id: '1',
        name: 'João Silva',
        photo: '/public/barber-1.jpg', // Example photo URL
        bio: 'Especialista em cortes clássicos e modernos, com mais de 10 anos de experiência.',
        specialties: ['Corte Clássico', 'Fade'],
        availableHours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
        availableDates: [format(today, 'yyyy-MM-dd'), format(tomorrow, 'yyyy-MM-dd'), format(dayAfterTomorrow, 'yyyy-MM-dd')],
        yearsOfExperience: 10,
        description: 'João é conhecido por sua precisão e atenção aos detalhes, garantindo sempre um corte impecável.'
      },
      {
        id: '2',
        name: 'Carlos Santos',
        photo: '/public/barber-2.jpg', // Example photo URL
        bio: 'Mestre na arte da barbearia, com foco em barbas e tratamentos faciais, 8 anos de experiência.',
        specialties: ['Barba', 'Corte + Barba'],
        availableHours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
        availableDates: [format(today, 'yyyy-MM-dd'), format(tomorrow, 'yyyy-MM-dd'), format(dayAfterTomorrow, 'yyyy-MM-dd')],
        yearsOfExperience: 8,
        description: 'Carlos oferece uma experiência completa de barbearia, combinando técnicas tradicionais com as últimas tendências.'
      },
    ];
    localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(defaultBarbers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: User[] = [
      { id: 'admin', fullName: 'Admin Geral', username: 'admin', password: 'admin', role: 'admin', createdAt: new Date().toISOString(), avatarUrl: 'https://i.pravatar.cc/150?img=68', cutsCount: 0, favoriteProducts: [] },
      { id: '2', fullName: 'Carlos Santos', username: 'barbeiro', password: 'barbeiro', role: 'barber', createdAt: new Date().toISOString(), avatarUrl: 'https://i.pravatar.cc/150?img=69', cutsCount: 0, favoriteProducts: [] },
      { id: 'client1', fullName: 'Cliente Teste', username: 'cliente', password: 'cliente', role: 'client', loyaltyPoints: 5, createdAt: new Date().toISOString(), avatarUrl: 'https://i.pravatar.cc/150?img=70', cutsCount: 2, favoriteProducts: ['Pomada Modeladora', 'Shampoo Antiqueda'] },
      { id: 'client2', fullName: 'Maria Cliente', username: 'maria', password: 'maria', role: 'client', loyaltyPoints: 2, createdAt: new Date().toISOString(), avatarUrl: 'https://i.pravatar.cc/150?img=71', cutsCount: 1, favoriteProducts: ['Óleo para Barba'] },
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultAppointments: Appointment[] = [
      {
        id: 'appt1',
        userId: 'client1',
        barberId: '1',
        serviceId: '1',
        date: tomorrow.toISOString().split('T')[0],
        time: '10:00',
        status: 'pending',
        createdAt: new Date().toISOString(),
        servicePrice: 50, // Price for Corte Clássico
        extraCharges: 0,
        finalPrice: 50,
      }
    ];
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(defaultAppointments));
  }

  if (!localStorage.getItem(STORAGE_KEYS.LOYALTY_TARGET)) {
    localStorage.setItem(STORAGE_KEYS.LOYALTY_TARGET, JSON.stringify(10)); // Default loyalty target
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
  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  
  // Auth
  loginUser: (userId: string) => {
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN_USER_ID, userId);
  },
  logoutUser: () => {
    localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_USER_ID);
  },
  getCurrentUser: (): User | null => {
    const userId = localStorage.getItem(STORAGE_KEYS.LOGGED_IN_USER_ID);
    if (!userId) return null;

    const users = storage.getUsers();
    const user = users.find(u => u.id === userId);
    if (user && !user.latestCuts) {
      user.latestCuts = []; // Initialize latestCuts if missing
    }
    return user || null;
  },

  // Loyalty
  getLoyaltyTarget: (): number => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOYALTY_TARGET) || '10');
  },
  saveLoyaltyTarget: (target: number) => {
    localStorage.setItem(STORAGE_KEYS.LOYALTY_TARGET, JSON.stringify(target));
  },
};
