import { Barber, Service, Appointment, User, RecurringSchedule, Expense } from '@/types';
import { format } from 'date-fns';
import { DEFAULT_SERVICES, DEFAULT_BARBERS, DEFAULT_USERS, DEFAULT_APPOINTMENTS, LOYALTY_TARGET_DEFAULT } from './initialData';
import TanakaImg from '../../img/barbeiro/TANAKA.png';
import LogoMenu from '../../img/LOGO MENU.png';
import LogoLogin from '../../img/LOGO LOGIN.png';

const STORAGE_KEYS = {
  BARBERS: 'barbershop_barbers',
  SERVICES: 'barbershop_services',
  APPOINTMENTS: 'barbershop_appointments',
  USERS: 'barbershop_users',
  LOGGED_IN_USER_ID: 'barbershop_logged_in_user_id',
  LOYALTY_TARGET: 'barbershop_loyalty_target',
  HOLIDAY_MODE: 'barbershop_holiday_mode',
  AUTO_REMINDERS: 'barbershop_auto_reminders',
  SHOP_NAME: 'barbershop_shop_name',
  SHOP_PHONE: 'barbershop_shop_phone',
  SHOP_LOGO: 'barbershop_shop_logo',
  SHOP_ADDRESS: 'barbershop_shop_address',
  WHATSAPP_API_URL: 'barbershop_whatsapp_api_url',
  WHATSAPP_API_TOKEN: 'barbershop_whatsapp_api_token',
  WHATSAPP_INSTANCE_ID: 'barbershop_whatsapp_instance_id',
  REMINDER_MINUTES: 'barbershop_reminder_minutes',
  SHOP_INSTAGRAM: 'barbershop_shop_instagram',
  SHOP_FACEBOOK: 'barbershop_shop_facebook',
  SHOP_EMAIL: 'barbershop_shop_email',
  SHOP_OPENING_HOURS: 'barbershop_shop_opening_hours',
  SHOP_MAPS_LINK: 'barbershop_shop_maps_link',
  SHOP_GALLERY: 'barbershop_shop_gallery',
  RECURRING_SCHEDULES: 'barbershop_recurring_schedules',
  EXPENSES: 'barbershop_expenses',
  EXPENSE_CATEGORIES: 'barbershop_expense_categories',
  PIX_KEY: 'barbershop_pix_key',
  MP_ACCESS_TOKEN: 'barbershop_mp_access_token',
  MP_PUBLIC_KEY: 'barbershop_mp_public_key',
};

// Initialize with default data
const initializeData = () => {
  // ... (previous initializations)
  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
  } else {
    const currentServices = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES) || '[]');
    if (currentServices.length > 0 && !currentServices[0].category) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.BARBERS)) {
    localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(DEFAULT_BARBERS));
  } else {
    let currentBarbers: Barber[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.BARBERS) || '[]');
    let barbersChanged = false;
    let tanakaBarberExists = false;
    currentBarbers = currentBarbers.map(b => {
      if (b.name === 'TANAKA' || b.id === 'admin' || String(b.name).toLowerCase().includes('tanaka')) {
        tanakaBarberExists = true;
        if (b.name !== 'TANAKA' || b.photo !== TanakaImg) {
          barbersChanged = true;
          return { ...b, name: 'TANAKA', photo: TanakaImg };
        }
      }
      return b;
    });

    if (!tanakaBarberExists) {
      currentBarbers.unshift(DEFAULT_BARBERS.find(b => b.id === 'admin') || DEFAULT_BARBERS[0]);
      barbersChanged = true;
    }
    if (barbersChanged) {
      localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(currentBarbers));
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  } else {
    let currentUsers: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    let hasChanges = false;
    let tanakaUserExists = false;

    currentUsers = currentUsers.map(u => {
      if (u.username === 'tanaka') {
        tanakaUserExists = true;
        if (u.fullName !== 'TANAKA' || u.avatarUrl !== TanakaImg) {
          hasChanges = true;
          return { ...u, fullName: 'TANAKA', avatarUrl: TanakaImg };
        }
      }
      return u;
    });

    if (!tanakaUserExists) {
      currentUsers.unshift(DEFAULT_USERS.find(u => u.username === 'tanaka') || DEFAULT_USERS[0]);
      hasChanges = true;
    }

    if (!currentUsers.some(u => u.username === 'wellington')) {
      const wellington = DEFAULT_USERS.find(u => u.username === 'wellington');
      if (wellington) {
        currentUsers.push(wellington);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(currentUsers));
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(DEFAULT_APPOINTMENTS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.LOYALTY_TARGET)) {
    localStorage.setItem(STORAGE_KEYS.LOYALTY_TARGET, JSON.stringify(LOYALTY_TARGET_DEFAULT));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SHOP_NAME)) {
    localStorage.setItem(STORAGE_KEYS.SHOP_NAME, JSON.stringify('TANAKA BARBEARIA'));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SHOP_PHONE)) {
    localStorage.setItem(STORAGE_KEYS.SHOP_PHONE, JSON.stringify('5562985328737'));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SHOP_ADDRESS)) {
    localStorage.setItem(STORAGE_KEYS.SHOP_ADDRESS, JSON.stringify('Av. 01, Centro — Bonfinópolis, GO'));
  }

  if (!localStorage.getItem(STORAGE_KEYS.REMINDER_MINUTES)) {
    localStorage.setItem(STORAGE_KEYS.REMINDER_MINUTES, JSON.stringify('30'));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SHOP_LOGO)) {
    localStorage.setItem(STORAGE_KEYS.SHOP_LOGO, JSON.stringify(LogoMenu));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SHOP_INSTAGRAM)) {
    localStorage.setItem(STORAGE_KEYS.SHOP_INSTAGRAM, JSON.stringify('https://instagram.com/'));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SHOP_OPENING_HOURS)) {
    localStorage.setItem(STORAGE_KEYS.SHOP_OPENING_HOURS, JSON.stringify('Seg à Sex: 08:00 - 19:00 | Sáb: 08:00 - 17:00'));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SHOP_GALLERY)) {
    const defaultGallery = [
      "/img/CABELOS/BARBA 1.png",
      "/img/CABELOS/BARBA 2.png",
      "/img/CABELOS/cabelo 1.png",
      "/img/CABELOS/cabelo 2.png",
      "/img/CABELOS/cabelo 3.png",
    ];
    localStorage.setItem(STORAGE_KEYS.SHOP_GALLERY, JSON.stringify(defaultGallery));
  }

  if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES)) {
    const defaultCategories = [
      'Aluguel',
      'Energia/Luz',
      'Água',
      'Produtos e Materiais',
      'Marketing e Anúncios',
      'Impostos e Taxas',
      'Manutenção de Equipamentos',
      'Salários e Comissões',
      'Internet/Telefone',
      'Outros',
    ];
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(defaultCategories));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PIX_KEY)) {
    localStorage.setItem(STORAGE_KEYS.PIX_KEY, JSON.stringify(''));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MP_ACCESS_TOKEN)) {
    localStorage.setItem(STORAGE_KEYS.MP_ACCESS_TOKEN, JSON.stringify(''));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MP_PUBLIC_KEY)) {
    localStorage.setItem(STORAGE_KEYS.MP_PUBLIC_KEY, JSON.stringify(''));
  }
};

initializeData();

export const storage = {
  // ... (previous methods)
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

  // Holiday Mode
  getHolidayMode: (): boolean => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HOLIDAY_MODE) || 'false');
  },
  saveHolidayMode: (isActive: boolean) => {
    localStorage.setItem(STORAGE_KEYS.HOLIDAY_MODE, JSON.stringify(isActive));
  },
  // Auto Reminders
  getAutoReminders: (): boolean => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTO_REMINDERS) || 'false');
  },
  saveAutoReminders: (isEnabled: boolean) => {
    localStorage.setItem(STORAGE_KEYS.AUTO_REMINDERS, JSON.stringify(isEnabled));
  },

  // Shop Settings
  getShopName: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_NAME) || '"TANAKA BARBEARIA"');
  },
  saveShopName: (name: string) => {
    localStorage.setItem(STORAGE_KEYS.SHOP_NAME, JSON.stringify(name));
  },
  getShopPhone: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_PHONE) || '"5562985328737"');
  },
  saveShopPhone: (phone: string) => {
    localStorage.setItem(STORAGE_KEYS.SHOP_PHONE, JSON.stringify(phone));
  },
  getShopLogo: (): string => {
    try {
      const logo = localStorage.getItem(STORAGE_KEYS.SHOP_LOGO);
      if (!logo) return LogoMenu;
      const parsed = JSON.parse(logo);
      return parsed && parsed.length > 0 ? parsed : LogoMenu;
    } catch {
      return LogoMenu;
    }
  },
  saveShopLogo: (logoUrl: string) => {
    localStorage.setItem(STORAGE_KEYS.SHOP_LOGO, JSON.stringify(logoUrl));
  },
  getShopAddress: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_ADDRESS) || '"Av. 01, Centro — Bonfinópolis, GO"');
  },
  saveShopAddress: (address: string) => {
    localStorage.setItem(STORAGE_KEYS.SHOP_ADDRESS, JSON.stringify(address));
  },
  getShopInstagram: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_INSTAGRAM) || '"https://instagram.com/"');
  },
  saveShopInstagram: (url: string) => {
    localStorage.setItem(STORAGE_KEYS.SHOP_INSTAGRAM, JSON.stringify(url));
  },
  getShopFacebook: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_FACEBOOK) || '""');
  },
  saveShopFacebook: (url: string) => {
    localStorage.setItem(STORAGE_KEYS.SHOP_FACEBOOK, JSON.stringify(url));
  },
  getShopEmail: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_EMAIL) || '"tanakabnf@gmail.com"');
  },
  saveShopEmail: (email: string) => {
    localStorage.setItem(STORAGE_KEYS.SHOP_EMAIL, JSON.stringify(email));
  },
  getShopOpeningHours: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_OPENING_HOURS) || '"Seg à Sex: 08:00 - 19:00 | Sáb: 08:00 - 17:00"');
  },
  saveShopOpeningHours: (hours: string) => {
    localStorage.setItem(STORAGE_KEYS.SHOP_OPENING_HOURS, JSON.stringify(hours));
  },
  getShopMapsLink: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_MAPS_LINK) || '""');
  },
  saveShopMapsLink: (link: string) => {
    localStorage.setItem(STORAGE_KEYS.SHOP_MAPS_LINK, JSON.stringify(link));
  },
  getShopGallery: (): string[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_GALLERY) || '[]');
  },
  saveShopGallery: (images: string[]) => {
    localStorage.setItem(STORAGE_KEYS.SHOP_GALLERY, JSON.stringify(images));
  },

  // Payments
  getPixKey: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PIX_KEY) || '""');
  },
  savePixKey: (key: string) => {
    localStorage.setItem(STORAGE_KEYS.PIX_KEY, JSON.stringify(key));
  },

  // WhatsApp API Settings
  getWhatsAppApiUrl: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WHATSAPP_API_URL) || '""');
  },
  saveWhatsAppApiUrl: (url: string) => {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_API_URL, JSON.stringify(url));
  },
  getWhatsAppApiToken: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WHATSAPP_API_TOKEN) || '""');
  },
  saveWhatsAppApiToken: (token: string) => {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_API_TOKEN, JSON.stringify(token));
  },
  getWhatsAppInstanceId: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WHATSAPP_INSTANCE_ID) || '""');
  },
  saveWhatsAppInstanceId: (id: string) => {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_INSTANCE_ID, JSON.stringify(id));
  },
  getReminderMinutes: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REMINDER_MINUTES) || '"30"');
  },
  saveReminderMinutes: (minutes: string) => {
    localStorage.setItem(STORAGE_KEYS.REMINDER_MINUTES, JSON.stringify(minutes));
  },
  // Recurring Schedules
  getRecurringSchedules: (): RecurringSchedule[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECURRING_SCHEDULES) || '[]');
  },
  saveRecurringSchedules: (schedules: RecurringSchedule[]) => {
    localStorage.setItem(STORAGE_KEYS.RECURRING_SCHEDULES, JSON.stringify(schedules));
  },

  // Mercado Pago
  getMPAccessToken: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MP_ACCESS_TOKEN) || '""');
  },
  saveMPAccessToken: (token: string) => {
    localStorage.setItem(STORAGE_KEYS.MP_ACCESS_TOKEN, JSON.stringify(token));
  },
  getMPPublicKey: (): string => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MP_PUBLIC_KEY) || '""');
  },
  saveMPPublicKey: (key: string) => {
    localStorage.setItem(STORAGE_KEYS.MP_PUBLIC_KEY, JSON.stringify(key));
  },

  // Expenses
  getExpenses: (): Expense[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
  },
  saveExpenses: (expenses: Expense[]) => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  // Expense Categories
  getExpenseCategories: (): string[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES) || '[]');
  },
  saveExpenseCategories: (categories: string[]) => {
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(categories));
  },
};
