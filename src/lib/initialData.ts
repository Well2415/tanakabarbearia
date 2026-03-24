import { Barber, Service, User, Appointment, Product } from '@/types';
import { format } from 'date-fns';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);

export const DEFAULT_SERVICES: Service[] = [
    { id: '1', name: 'Serviço Exemplo', description: 'Descrição do serviço', duration: 30, price: 0, loyaltyPoints: 1, category: 'Geral' },
];

export const DEFAULT_BARBERS: Barber[] = [
    {
        id: 'admin',
        name: 'Administrador',
        photo: '',
        bio: 'Mestre Barbeiro',
        specialties: ['Corte Clássico'],
        availableHours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
        availableDates: [format(today, 'yyyy-MM-dd'), format(tomorrow, 'yyyy-MM-dd'), format(dayAfterTomorrow, 'yyyy-MM-dd')],
        yearsOfExperience: 1,
        description: 'Responsável pela barbearia.'
    },
];

export const DEFAULT_USERS: User[] = [
    { id: 'admin', fullName: 'Administrador', username: 'admin', password: '123', phone: '00000000000', role: 'admin', createdAt: new Date().toISOString(), avatarUrl: '', cutsCount: 0, stylePreferences: [] },
];

export const DEFAULT_APPOINTMENTS: Appointment[] = [];

export const DEFAULT_PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'Pomada Efeito Matte',
        description: 'Finalização impecável sem brilho.',
        price: 45.00,
        image: '',
        category: 'Pomada',
        stock: 10,
        active: true
    },
    {
        id: '2',
        name: 'Óleo para Barba',
        description: 'Hidratação e brilho para sua barba.',
        price: 35.00,
        image: '',
        category: 'Barba',
        stock: 15,
        active: true
    }
];

export const LOYALTY_TARGET_DEFAULT = 10;
