import { Barber, Service, User, Appointment } from '@/types';
import TanakaImg from '../../img/barbeiro/TANAKA.png';
import { format } from 'date-fns';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);

export const DEFAULT_SERVICES: Service[] = [
    { id: '1', name: 'Corte social', description: 'Corte social clássico', duration: 30, price: 30, loyaltyPoints: 3, category: 'Cortes' },
    { id: '2', name: 'Corte Degradê', description: 'Corte degradê', duration: 30, price: 35, loyaltyPoints: 3, category: 'Cortes' },
    { id: '3', name: 'Corte Degradê navalhado', description: 'Corte degradê com finalização na navalha', duration: 45, price: 45, loyaltyPoints: 4, category: 'Cortes' },
    { id: '4', name: 'Barba', description: 'Aparar e modelar barba', duration: 30, price: 25, loyaltyPoints: 2, category: 'Barba' },
    { id: '5', name: 'Corte social+barba', description: 'Pacote de corte social e barba', duration: 60, price: 50, loyaltyPoints: 5, category: 'Combos' },
    { id: '6', name: 'Corte Degradê+barba', description: 'Pacote de corte degradê e barba', duration: 60, price: 55, loyaltyPoints: 5, category: 'Combos' },
    { id: '7', name: 'Degradê navalhado+barba', description: 'Pacote completo de corte degradê navalhado e barba', duration: 60, price: 65, loyaltyPoints: 6, category: 'Combos' },
    { id: '8', name: 'Pezinho', description: 'Acabamento do pezinho do cabelo', duration: 15, price: 10, loyaltyPoints: 1, category: 'Acabamentos' },
    { id: '9', name: 'Sobrancelha', description: 'Design de sobrancelha', duration: 15, price: 10, loyaltyPoints: 1, category: 'Acabamentos' },
    { id: '10', name: 'Risquinho', description: 'Risquinho a partir de R$5', duration: 15, price: 5, loyaltyPoints: 1, category: 'Acabamentos' },
];

export const DEFAULT_BARBERS: Barber[] = [
    {
        id: 'admin',
        name: 'TANAKA',
        photo: TanakaImg,
        bio: 'Dono e Mestre Barbeiro da TANAKA BARBEARIA.',
        specialties: ['Corte Clássico', 'Fade', 'Barba Terapia'],
        availableHours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
        availableDates: [format(today, 'yyyy-MM-dd'), format(tomorrow, 'yyyy-MM-dd'), format(dayAfterTomorrow, 'yyyy-MM-dd')],
        yearsOfExperience: 15,
        description: 'TANAKA é o dono da barbearia, oferecendo cortes premium e experiência inigualável.'
    },
];

export const DEFAULT_USERS: User[] = [
    { id: 'admin', fullName: 'TANAKA', username: 'tanaka', password: '123', phone: '00000000000', role: 'admin', createdAt: new Date().toISOString(), avatarUrl: TanakaImg, cutsCount: 0, stylePreferences: [] },
    { id: 'client1', fullName: 'Wellington (Cliente)', username: 'wellington', password: '12345', phone: '00000000000', role: 'client', loyaltyPoints: 5, createdAt: new Date().toISOString(), avatarUrl: 'https://i.pravatar.cc/150?img=12', cutsCount: 2, stylePreferences: ['Degradê Navalhado', 'Barba Alinhada'] },
    { id: 'client2', fullName: 'Maria Cliente', username: 'maria', password: 'maria', phone: '00000000000', role: 'client', loyaltyPoints: 2, createdAt: new Date().toISOString(), avatarUrl: 'https://i.pravatar.cc/150?img=71', cutsCount: 1, stylePreferences: ['Corte Clássico'] },
];

export const DEFAULT_APPOINTMENTS: Appointment[] = [
    {
        id: 'appt1',
        userId: 'client1',
        barberId: 'admin',
        serviceId: '1',
        date: format(tomorrow, 'yyyy-MM-dd'),
        time: '10:00',
        status: 'pending',
        createdAt: new Date().toISOString(),
        servicePrice: 50,
        extraCharges: 0,
        finalPrice: 50,
    }
];

export const LOYALTY_TARGET_DEFAULT = 10;
