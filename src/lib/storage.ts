import { Barber, Service, Appointment, User, RecurringSchedule, Expense } from '@/types';
import { supabase } from './supabase';
import { DEFAULT_SERVICES, DEFAULT_BARBERS, DEFAULT_USERS, DEFAULT_APPOINTMENTS, LOYALTY_TARGET_DEFAULT } from './initialData';
// Usando caminhos estáticos relativos à pasta public/
const TanakaImg = "/img/barbeiro/tanaka.png";
const LogoMenu = "/img/logo-menu.png";

// Cache interno para manter o funcionamento síncrono dos componentes
let cache: {
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
  users: User[];
  recurringSchedules: RecurringSchedule[];
  expenses: Expense[];
  expenseCategories: string[];
  settings: Record<string, any>;
} = {
  barbers: [],
  services: [],
  appointments: [],
  users: [],
  recurringSchedules: [],
  expenses: [],
  expenseCategories: [],
  settings: {}
};

// Helper para normalizar caminhos de imagens legados ou com erro de digitação
const normalizeImagePath = (src: string): string => {
  if (!src) return src;
  
  // Se for um nome como "BARBA 1.png" ou "cabelo 1.png"
  const fileName = src.split('/').pop() || "";
  if (fileName.toUpperCase().includes('BARBA') || fileName.toLowerCase().includes('cabelo')) {
    // Normaliza: Remove espaços, converte para minúsculo, usa underscore
    let normalized = fileName.toLowerCase().replace(/\s+/g, '_');
    
    // Se não tiver o prefixo correto, adiciona
    if (!src.startsWith('/img/cabelos/') && !src.startsWith('http')) {
      return `/img/cabelos/${normalized}`;
    }
  }
  
  return src;
};

let isInitialized = false;

export const storage = {
  async initialize() {
    if (isInitialized) return;

    try {
      // 1. Carregar Configurações (Settings)
      const { data: settingsData } = await supabase.from('shop_settings').select('*');
      const settingsMap: Record<string, any> = {};
      settingsData?.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      cache.settings = settingsMap;

      // 2. Carregar Dados Principais em Paralelo
      const [
        barbersRes,
        servicesRes,
        usersRes,
        appointmentsRes,
        recurringRes,
        expensesRes,
        expenseCategoriesRes
      ] = await Promise.all([
        supabase.from('barbers').select('*'),
        supabase.from('services').select('*'),
        supabase.from('users').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('recurring_schedules').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('expense_categories').select('*')
      ]);

      if (barbersRes.error) console.error('Error fetching barbers:', barbersRes.error);
      if (servicesRes.error) console.error('Error fetching services:', servicesRes.error);

      cache.barbers = barbersRes.data || [];
      cache.services = servicesRes.data || [];
      cache.users = usersRes.data || [];
      cache.appointments = appointmentsRes.data || [];
      cache.recurringSchedules = recurringRes.data || [];
      cache.expenses = expensesRes.data || [];
      cache.expenseCategories = expenseCategoriesRes.data?.map(c => c.name) || [];

      // Se o banco estiver vazio ou sem configurações, inicializar com dados padrão
      if (cache.services.length === 0 || Object.keys(cache.settings).length === 0) {
        console.log('🔄 Banco parece vazio. Iniciando seeding automático...');
        await this.seedDefaultData();
      }

      isInitialized = true;
      console.log('✅ Supabase Initialized & Cached', { 
        settingsCount: Object.keys(cache.settings).length,
        servicesCount: cache.services.length,
        gallery: cache.settings.shop_gallery
      });
    } catch (error) {
      console.error('❌ Error initializing Supabase:', error);
      isInitialized = true; // Permite que o app carregue com cache vazio se o banco falhar
    }
  },

  async seedDefaultData() {
    console.log('🌱 Seeding default data to Supabase...');
    await supabase.from('services').insert(DEFAULT_SERVICES);
    await supabase.from('barbers').insert(DEFAULT_BARBERS);
    await supabase.from('users').insert(DEFAULT_USERS);
    await supabase.from('appointments').insert(DEFAULT_APPOINTMENTS);

    const defaultCategories = [
      'Aluguel', 'Energia/Luz', 'Água', 'Produtos e Materiais', 'Marketing e Anúncios',
      'Impostos e Taxas', 'Manutenção de Equipamentos', 'Salários e Comissões',
      'Internet/Telefone', 'Outros',
    ];
    await supabase.from('expense_categories').insert(defaultCategories.map(name => ({ name })));

    await supabase.from('shop_settings').upsert([
      { key: 'loyalty_target', value: LOYALTY_TARGET_DEFAULT },
      { key: 'shop_name', value: 'TANAKA BARBEARIA' },
      { key: 'shop_phone', value: '5562985328737' },
      { key: 'shop_address', value: 'Av. 01, Centro — Bonfinópolis, GO' },
      { key: 'reminder_minutes', value: '30' },
      { key: 'shop_logo', value: LogoMenu },
      { key: 'shop_instagram', value: 'https://instagram.com/' },
      { key: 'shop_opening_hours', value: 'Seg à Sex: 08:00 - 19:00 | Sáb: 08:00 - 17:00' },
      { key: 'shop_gallery', value: [
        "/img/cabelos/barba_1.png", "/img/cabelos/barba_2.png", "/img/cabelos/cabelo_1.png",
        "/img/cabelos/cabelo_2.png", "/img/cabelos/cabelo_3.png",
      ]},
      { key: 'pix_key', value: '' },
      { key: 'mp_access_token', value: 'TEST-8670819624140776-031814-1c0249b57c6fb0894f625f3c4732389e-274944596' },
      { key: 'mp_public_key', value: 'TEST-5f1446b5-2aa6-42e1-8e37-b4e9cb61dacd' },
      { key: 'holiday_mode', value: false },
      { key: 'auto_reminders', value: false },
      { key: 'whatsapp_api_url', value: '' },
      { key: 'whatsapp_api_token', value: '' },
      { key: 'whatsapp_instance_id', value: '' },
      { key: 'shop_facebook', value: '' },
      { key: 'shop_email', value: 'tanakabnf@gmail.com' },
      { key: 'shop_maps_link', value: '' },
    ]);

    isInitialized = false;
    await this.initialize();
  },

  // Barbers
  getBarbers: (): Barber[] => cache.barbers,
  async saveBarbers(barbers: Barber[]) {
    cache.barbers = barbers;
    await supabase.from('barbers').delete().neq('id', '_none_');
    await supabase.from('barbers').insert(barbers);
  },

  // Services
  getServices: (): Service[] => cache.services,
  async saveServices(services: Service[]) {
    cache.services = services;
    await supabase.from('services').delete().neq('id', '_none_');
    await supabase.from('services').insert(services);
  },

  // Appointments
  getAppointments: (): Appointment[] => cache.appointments,
  async saveAppointments(appointments: Appointment[]) {
    cache.appointments = appointments;
    await supabase.from('appointments').upsert(appointments);
  },

  // Users
  getUsers: (): User[] => cache.users,
  async saveUsers(users: User[]) {
    cache.users = users;
    await supabase.from('users').upsert(users);
  },

  // Auth
  loginUser: (userId: string) => {
    localStorage.setItem('barbershop_logged_in_user_id', userId);
  },
  logoutUser: () => {
    localStorage.removeItem('barbershop_logged_in_user_id');
  },
  getCurrentUser: (): User | null => {
    const userId = localStorage.getItem('barbershop_logged_in_user_id');
    if (!userId) return null;
    const user = cache.users.find(u => u.id === userId);
    if (user && !user.latestCuts) {
      user.latestCuts = []; 
    }
    return user || null;
  },

  // Settings helpers
  getSetting: (key: string, defaultValue: any) => {
    return cache.settings[key] !== undefined ? cache.settings[key] : defaultValue;
  },
  async saveSetting(key: string, value: any) {
    cache.settings[key] = value;
    await supabase.from('shop_settings').upsert({ key, value }, { onConflict: 'key' });
  },

  getLoyaltyTarget: (): number => storage.getSetting('loyalty_target', LOYALTY_TARGET_DEFAULT),
  saveLoyaltyTarget: (target: number) => storage.saveSetting('loyalty_target', target),

  getHolidayMode: (): boolean => storage.getSetting('holiday_mode', false),
  saveHolidayMode: (isActive: boolean) => storage.saveSetting('holiday_mode', isActive),

  getAutoReminders: (): boolean => storage.getSetting('auto_reminders', false),
  saveAutoReminders: (isEnabled: boolean) => storage.saveSetting('auto_reminders', isEnabled),

  getShopName: (): string => storage.getSetting('shop_name', 'TANAKA BARBEARIA'),
  saveShopName: (name: string) => storage.saveSetting('shop_name', name),

  getShopPhone: (): string => storage.getSetting('shop_phone', '5562985328737'),
  saveShopPhone: (phone: string) => storage.saveSetting('shop_phone', phone),

  getShopLogo: (): string => storage.getSetting('shop_logo', LogoMenu),
  saveShopLogo: (logoUrl: string) => storage.saveSetting('shop_logo', logoUrl),

  getShopAddress: (): string => storage.getSetting('shop_address', 'Av. 01, Centro — Bonfinópolis, GO'),
  saveShopAddress: (address: string) => storage.saveSetting('shop_address', address),

  getShopInstagram: (): string => storage.getSetting('shop_instagram', 'https://instagram.com/'),
  saveShopInstagram: (url: string) => storage.saveSetting('shop_instagram', url),

  getShopFacebook: (): string => storage.getSetting('shop_facebook', ''),
  saveShopFacebook: (url: string) => storage.saveSetting('shop_facebook', url),

  getShopEmail: (): string => storage.getSetting('shop_email', 'tanakabnf@gmail.com'),
  saveShopEmail: (email: string) => storage.saveSetting('shop_email', email),

  getShopOpeningHours: (): string => storage.getSetting('shop_opening_hours', 'Seg à Sex: 08:00 - 19:00 | Sáb: 08:00 - 17:00'),
  saveShopOpeningHours: (hours: string) => storage.saveSetting('shop_opening_hours', hours),

  getShopMapsLink: (): string => storage.getSetting('shop_maps_link', ''),
  saveShopMapsLink: (link: string) => storage.saveSetting('shop_maps_link', link),

  getShopGallery: (): string[] => {
    const gallery = storage.getSetting('shop_gallery', []);
    return Array.isArray(gallery) ? gallery.map(normalizeImagePath) : [];
  },
  saveShopGallery: (images: string[]) => storage.saveSetting('shop_gallery', images),

  getPixKey: (): string => storage.getSetting('pix_key', ''),
  savePixKey: (key: string) => storage.saveSetting('pix_key', key),

  getWhatsAppApiUrl: (): string => storage.getSetting('whatsapp_api_url', ''),
  saveWhatsAppApiUrl: (url: string) => storage.saveSetting('whatsapp_api_url', url),

  getWhatsAppApiToken: (): string => storage.getSetting('whatsapp_api_token', ''),
  saveWhatsAppApiToken: (token: string) => storage.saveSetting('whatsapp_api_token', token),

  getWhatsAppInstanceId: (): string => storage.getSetting('whatsapp_instance_id', ''),
  saveWhatsAppInstanceId: (id: string) => storage.saveSetting('whatsapp_instance_id', id),

  getReminderMinutes: (): string => storage.getSetting('reminder_minutes', '30'),
  saveReminderMinutes: (minutes: string) => storage.saveSetting('reminder_minutes', minutes),

  getRecurringSchedules: (): RecurringSchedule[] => cache.recurringSchedules,
  async saveRecurringSchedules(schedules: RecurringSchedule[]) {
    cache.recurringSchedules = schedules;
    await supabase.from('recurring_schedules').upsert(schedules);
  },

  getMPAccessToken: (): string => storage.getSetting('mp_access_token', ''),
  saveMPAccessToken: (token: string) => storage.saveSetting('mp_access_token', token),

  getMPPublicKey: (): string => storage.getSetting('mp_public_key', ''),
  saveMPPublicKey: (key: string) => storage.saveSetting('mp_public_key', key),

  getExpenses: (): Expense[] => cache.expenses,
  async saveExpenses(expenses: Expense[]) {
    cache.expenses = expenses;
    await supabase.from('expenses').upsert(expenses);
  },

  getExpenseCategories: (): string[] => cache.expenseCategories,
  async saveExpenseCategories(categories: string[]) {
    cache.expenseCategories = categories;
    await supabase.from('expense_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('expense_categories').insert(categories.map(name => ({ name })));
  },
};
