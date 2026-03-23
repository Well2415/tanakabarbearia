import { Barber, Service, Appointment, User, RecurringSchedule, Expense } from '@/types';
import { supabase } from './supabase';
import { DEFAULT_SERVICES, DEFAULT_BARBERS, DEFAULT_USERS, DEFAULT_APPOINTMENTS, LOYALTY_TARGET_DEFAULT } from './initialData';
// Fallback genérico para logo caso não esteja no Supabase
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

// Helper simples para caminhos de imagem
const normalizeImagePath = (src: string): string => {
  if (!src) return src;
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  
  // Apenas garante que se for um caminho local, comece com /
  if (src.startsWith('/') || src.startsWith('./') || src.startsWith('../')) return src;
  return `/${src}`;
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

      // Se o banco estiver vazio ou sem configurações, registramos no console em vez de auto-seed
      if (cache.services.length === 0 || Object.keys(cache.settings).length === 0) {
        console.warn('⚠️ Banco de dados parece estar vazio ou inacessível.');
      }

      isInitialized = true;
      console.log('✅ Supabase Initialized & Cached [v1.1.2]', { 
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
      { key: 'shop_name', value: '' },
      { key: 'shop_phone', value: '' },
      { key: 'shop_address', value: '' },
      { key: 'reminder_minutes', value: '30' },
      { key: 'shop_logo', value: LogoMenu },
      { key: 'shop_instagram', value: '' },
      { key: 'shop_opening_hours', value: '' },
      { key: 'shop_gallery', value: [] },
      { key: 'pix_key', value: '' },
      { key: 'mp_access_token', value: '' },
      { key: 'mp_public_key', value: '' },
      { key: 'holiday_mode', value: false },
      { key: 'auto_reminders', value: false },
      { key: 'whatsapp_api_url', value: '' },
      { key: 'whatsapp_api_token', value: '' },
      { key: 'whatsapp_instance_id', value: '' },
      { key: 'shop_facebook', value: '' },
      { key: 'shop_email', value: '' },
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

  async saveSettings(settings: Record<string, any>) {
    console.log('📡 [Storage] Iniciando Bulk Upsert...', Object.keys(settings));
    const upsertData = Object.entries(settings).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('shop_settings').upsert(upsertData, { onConflict: 'key' });
    if (error) {
      console.error('❌ [Storage] Erro no Bulk Upsert:', error);
      throw error;
    }
    console.log('✅ [Storage] Bulk Upsert concluído.');
    Object.assign(cache.settings, settings);
  },

  getLoyaltyTarget: (): number => storage.getSetting('loyalty_target', LOYALTY_TARGET_DEFAULT),
  saveLoyaltyTarget: (target: number) => storage.saveSetting('loyalty_target', target),

  getHolidayMode: (): boolean => storage.getSetting('holiday_mode', false),
  saveHolidayMode: (isActive: boolean) => storage.saveSetting('holiday_mode', isActive),

  getAutoReminders: (): boolean => storage.getSetting('auto_reminders', false),
  saveAutoReminders: (isEnabled: boolean) => storage.saveSetting('auto_reminders', isEnabled),

  getShopName: (): string => storage.getSetting('shop_name', ''),
  saveShopName: (name: string) => storage.saveSetting('shop_name', name),

  getShopPhone: (): string => storage.getSetting('shop_phone', ''),
  saveShopPhone: (phone: string) => storage.saveSetting('shop_phone', phone),

  getShopLogo: (): string => storage.getSetting('shop_logo', LogoMenu),
  saveShopLogo: (logoUrl: string) => storage.saveSetting('shop_logo', logoUrl),

  getShopAddress: (): string => storage.getSetting('shop_address', ''),
  saveShopAddress: (address: string) => storage.saveSetting('shop_address', address),

  getShopInstagram: (): string => storage.getSetting('shop_instagram', ''),
  saveShopInstagram: (url: string) => storage.saveSetting('shop_instagram', url),

  getShopFacebook: (): string => storage.getSetting('shop_facebook', ''),
  saveShopFacebook: (url: string) => storage.saveSetting('shop_facebook', url),

  getShopEmail: (): string => storage.getSetting('shop_email', ''),
  saveShopEmail: (email: string) => storage.saveSetting('shop_email', email),

  getShopOpeningHours: (): string => storage.getSetting('shop_opening_hours', ''),
  saveShopOpeningHours: (hours: string) => storage.saveSetting('shop_opening_hours', hours),

  getShopMapsLink: (): string => storage.getSetting('shop_maps_link', ''),
  saveShopMapsLink: (link: string) => storage.saveSetting('shop_maps_link', link),

  getShopGallery: (): string[] => {
    let gallery = storage.getSetting('shop_gallery', []);
    
    // Fallback se vier como string JSON
    if (typeof gallery === 'string' && gallery.trim().startsWith('[')) {
      try {
        gallery = JSON.parse(gallery);
      } catch (e) {
        gallery = [];
      }
    }
    
    // Retorna a galeria exatamente como está no banco, permitindo gestão total pelo usuário
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
