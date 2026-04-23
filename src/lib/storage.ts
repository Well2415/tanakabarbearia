import { Barber, Service, Appointment, User, RecurringSchedule, Expense, Product } from '@/types';
import { supabase } from './supabase';
import { DEFAULT_SERVICES, DEFAULT_BARBERS, DEFAULT_USERS, DEFAULT_APPOINTMENTS, LOYALTY_TARGET_DEFAULT, DEFAULT_PRODUCTS } from './initialData';
import { sortTimes } from './timeUtils';

// Fallback genérico para a logo caso não esteja configurada no banco de dados.
const LogoMenu = "/img/logo-tanaka.png";

/**
 * CACHE GLOBAL DO APLICATIVO
 * Armazena os dados em memória para acesso instantâneo pelos componentes React.
 * É sincronizado com o Supabase na inicialização do app.
 */
const getInitialCache = () => {
  const saved = localStorage.getItem('barbershop_cache');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved cache:', e);
    }
  }
  return {
    barbers: [],
    services: [],
    appointments: [],
    users: [],
    recurringSchedules: [],
    expenses: [],
    expenseCategories: [],
    settings: {},
    products: []
  };
};

let cache = getInitialCache();

const saveCacheToLocal = () => {
  localStorage.setItem('barbershop_cache', JSON.stringify(cache));
};

// Helper simples para caminhos de imagem
const normalizeImagePath = (src: string): string => {
  if (!src) return src;

  // Remove aspas extras que podem vir do banco de dados (erro comum de stringify)
  let cleanSrc = src.trim();
  if (cleanSrc.startsWith('"') && cleanSrc.endsWith('"')) {
    cleanSrc = cleanSrc.substring(1, cleanSrc.length - 1);
  }
  if (cleanSrc.startsWith('%22') && cleanSrc.endsWith('%22')) {
    cleanSrc = cleanSrc.substring(3, cleanSrc.length - 3);
  }

  if (cleanSrc.startsWith('http') || cleanSrc.startsWith('data:')) return cleanSrc;

  // Apenas garante que se for um caminho local, comece com /
  if (cleanSrc.startsWith('/') || cleanSrc.startsWith('./') || cleanSrc.startsWith('../')) return cleanSrc;
  return `/${cleanSrc}`;
};

// Variável de controle removida do escopo global para o objeto storage

/**
 * MOTOR DE ARMAZENAMENTO (STORAGE)
 * Objeto principal que gerencia toda a leitura e escrita de dados da Barbearia.
 */
export const storage = {
  /**
   * Conecta ao Supabase e carrega todos os dados necessários para o cache.
   * Deve ser chamado uma única vez no início do carregamento do App.
   */
  isInitialized: false,
  isConfigLoaded: false,

  /**
   * Inicializa apenas as configurações básicas e dados estáticos (barbeiros, serviços).
   * Isso economiza muita transferência de dados (Egress).
   */
  async initializeConfig(force = false) {
    if (this.isConfigLoaded && !force) return;

    try {
      const [settingsRes, barbersRes, servicesRes, expenseCategoriesRes] = await Promise.all([
        supabase.from('shop_settings').select('*'),
        supabase.from('barbers').select('*'),
        supabase.from('services').select('*'),
        supabase.from('expense_categories').select('*')
      ]);

      if (settingsRes.error) console.error('❌ [Storage] Erro settings:', settingsRes.error);
      if (barbersRes.error) console.error('❌ [Storage] Erro barbers:', barbersRes.error);

      // Configurações básicas carregadas

      const settingsMap: Record<string, any> = {};
      settingsRes.data?.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      cache.settings = settingsMap;

      const barberSchedules = settingsMap['barber_schedules'] || {};
      cache.barbers = (barbersRes.data || []).map(b => ({
        ...b,
        photo: normalizeImagePath(b.photo),
        availableHours: sortTimes(b.availableHours || []),
        scheduleByDay: barberSchedules[b.id] || undefined
      }));

      cache.services = (servicesRes.data || []).map(s => ({ ...s, image: normalizeImagePath(s.image) }));
      cache.expenseCategories = expenseCategoriesRes.data?.map(c => c.name) || [];

      this.isConfigLoaded = true;
      saveCacheToLocal();
    } catch (error) {
      console.error('❌ [Storage] Erro ao carregar configurações:', error);
    }
  },

  /**
   * Método de compatibilidade que inicializa o básico.
   * Não carrega mais agendamentos e usuários por padrão.
   */
  async initialize(force = false) {
    // Se mudamos de projeto (URL do Supabase diferente da salva no cache), limpamos tudo
    const lastUrl = localStorage.getItem('last_supabase_url');
    const currentUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (lastUrl && lastUrl !== currentUrl) {
      console.log('🔄 [Storage] Detectada troca de projeto Supabase. Limpando cache local...');
      localStorage.clear();
      cache = getInitialCache();
      localStorage.setItem('last_supabase_url', currentUrl);
    } else if (!lastUrl) {
      localStorage.setItem('last_supabase_url', currentUrl);
    }

    if (this.isInitialized && !force) return;
    await this.initializeConfig(force);
    
    // Carrega apenas agendamentos RECORRENTES e produtos (que costumam ser poucos)
    const [recurringRes, productsRes] = await Promise.all([
        supabase.from('recurring_schedules').select('*'),
        supabase.from('products').select('*')
    ]);

    cache.recurringSchedules = recurringRes.data || [];
    cache.products = (productsRes.data || []).map(p => ({
        ...p,
        image: normalizeImagePath(p.image),
        image2: normalizeImagePath(p.image2),
        image3: normalizeImagePath(p.image3),
        image4: normalizeImagePath(p.image4)
    }));

    this.isInitialized = true;
    saveCacheToLocal();
  },

  /**
   * Busca agendamentos em um intervalo de datas específico.
   * Crucial para evitar carregar o histórico inteiro.
   */
  async fetchAppointments(startDate?: string, endDate?: string, limit = 100, offset = 0) {
    try {
      let query = supabase.from('appointments').select('*', { count: 'exact' });
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      
      const { data, count, error } = await query
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      cache.appointments = data || [];
      saveCacheToLocal();
      
      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('❌ [Storage] Erro ao buscar agendamentos:', error);
      return { data: cache.appointments, total: cache.appointments.length };
    }
  },

  /**
   * Busca usuários com suporte a pesquisa e paginação no servidor.
   */
  async fetchUsers(limit = 100, offset = 0, searchTerm = '', sortBy = 'fullName', sortOrder: 'asc' | 'desc' = 'asc') {
    try {
      let query = supabase.from('users').select('*', { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`fullName.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, count, error } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Atualiza cache local mesclando com os novos dados
      const fetchedIds = (data || []).map(u => u.id);
      const otherUsers = cache.users.filter(u => !fetchedIds.includes(u.id));
      cache.users = [...otherUsers, ...(data || [])];
      saveCacheToLocal();

      return { data: data || [], total: count || 0 };
    } catch (error) {
      console.error('❌ [Storage] Erro ao buscar usuários:', error);
      return { data: cache.users, total: cache.users.length };
    }
  },

  /**
   * Busca despesas por período.
   */
  async fetchExpenses(startDate?: string, endDate?: string) {
    try {
      let query = supabase.from('expenses').select('*');
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      
      const { data, error } = await query;
      if (error) throw error;

      const fetchedIds = (data || []).map(e => e.id);
      const otherExpenses = cache.expenses.filter(e => !fetchedIds.includes(e.id));
      cache.expenses = [...otherExpenses, ...(data || [])];

      saveCacheToLocal();
      return cache.expenses;
    } catch (error) {
      console.error('❌ [Storage] Erro ao buscar despesas:', error);
      return cache.expenses;
    }
  },
  
  /**
   * Recarrega apenas a lista de usuários do Supabase.
   * Útil para garantir que temos as inscrições de push mais recentes sem re-inicializar tudo.
   */
  async refreshUsers() {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      cache.users = data || [];
      saveCacheToLocal();
      // Sincronização concluída
    } catch (error) {
      console.error('❌ [Storage] Erro ao recarregar usuários:', error);
    }
  },

  async seedDefaultData() {
    console.log('🌱 Seeding default data to Supabase...');
    await supabase.from('services').insert(DEFAULT_SERVICES);
    await supabase.from('barbers').insert(DEFAULT_BARBERS);
    await supabase.from('users').insert(DEFAULT_USERS);
    await supabase.from('appointments').insert(DEFAULT_APPOINTMENTS);
    await supabase.from('products').insert(DEFAULT_PRODUCTS);

    const defaultCategories = [
      'Aluguel', 'Energia/Luz', 'Água', 'Produtos e Materiais', 'Marketing e Anúncios',
      'Impostos e Taxas', 'Manutenção de Equipamentos', 'Salários e Comissões',
      'Internet/Telefone', 'Outros',
    ];
    await supabase.from('expense_categories').insert(defaultCategories.map(name => ({ name })));

    await supabase.from('shop_settings').upsert([
      { key: 'loyalty_target', value: LOYALTY_TARGET_DEFAULT },
      { key: 'shop_name', value: 'Barbearia Tanaka' },
      { key: 'shop_phone', value: '' },
      { key: 'shop_address', value: '' },
      { key: 'reminder_minutes', value: '30' },
      { key: 'shop_logo', value: LogoMenu },
      { key: 'shop_instagram', value: '' },
      { key: 'shop_opening_hours', value: '' },
      { key: 'shop_gallery', value: [] },
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

    this.isInitialized = false;
    await this.initialize();
  },

  // --- GERENCIAMENTO DE BARBEIROS ---
  getBarbers: (): Barber[] => cache.barbers,

  async updateBarber(barber: Barber) {
    // 0. Deep clean hours (split commas, unique, sort)
    const cleanHoursArray = (hours: string[]) => {
      const cleaned = new Set<string>();
      (hours || []).forEach(h => {
        if (typeof h === 'string') {
          h.split(',').map(s => s.trim()).filter(Boolean).forEach(s => cleaned.add(s));
        }
      });
      return sortTimes(Array.from(cleaned));
    };

    barber.availableHours = cleanHoursArray(barber.availableHours);
    if (barber.scheduleByDay) {
      Object.keys(barber.scheduleByDay).forEach(day => {
        const d = parseInt(day);
        barber.scheduleByDay![d] = cleanHoursArray(barber.scheduleByDay![d]);
      });
    }

    // 1. Update local cache
    cache.barbers = cache.barbers.map(b => b.id === barber.id ? barber : b);
    localStorage.setItem('barbers', JSON.stringify(cache.barbers));

    // 2. Prepare for DB
    const barberSchedules = cache.settings['barber_schedules'] || {};
    barberSchedules[barber.id] = barber.scheduleByDay;
    await storage.saveSetting('barber_schedules', barberSchedules);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { scheduleByDay, ...dbBarber } = barber;
    
    // 3. Upsert to Supabase
    const { error } = await supabase.from('barbers').upsert(dbBarber);
    if (error) console.error('Error updating barber:', error);
  },

  async deleteBarber(id: string) {
    cache.barbers = cache.barbers.filter(b => b.id !== id);
    localStorage.setItem('barbers', JSON.stringify(cache.barbers));
    await supabase.from('barbers').delete().eq('id', id);
  },

  async saveBarbers(barbers: Barber[]) {
    cache.barbers = barbers;
    localStorage.setItem('barbers', JSON.stringify(barbers));

    const barberSchedules: Record<string, any> = {};
    const dbBarbers = barbers.map(b => {
      barberSchedules[b.id] = b.scheduleByDay;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { scheduleByDay, ...dbBarber } = b;
      return dbBarber;
    });

    await storage.saveSetting('barber_schedules', barberSchedules);
    await supabase.from('barbers').upsert(dbBarbers);
  },

  // --- GERENCIAMENTO DE SERVIÇOS ---
  getServices: (): Service[] => cache.services,

  async updateService(service: Service) {
    cache.services = cache.services.map(s => s.id === service.id ? service : s);
    localStorage.setItem('services', JSON.stringify(cache.services));
    await supabase.from('services').upsert(service);
  },

  async deleteService(id: string) {
    cache.services = cache.services.filter(s => s.id !== id);
    localStorage.setItem('services', JSON.stringify(cache.services));
    await supabase.from('services').delete().eq('id', id);
  },

  async saveServices(services: Service[]) {
    cache.services = services;
    localStorage.setItem('services', JSON.stringify(services));
    await supabase.from('services').upsert(services);
  },

  // --- AGENDAMENTOS E HORÁRIOS ---
  getAppointments: (): Appointment[] => cache.appointments,
  
  /**
   * Atualiza apenas UM agendamento de forma atômica no Supabase e no Cache.
   * Evita race conditions de sobrescrita total.
   */
  async updateAppointment(appointment: Appointment) {
    // 1. Atualizar Cache Local e LocalStorage imediatamente (UI receptiva)
    cache.appointments = cache.appointments.map(a => a.id === appointment.id ? appointment : a);
    localStorage.setItem('appointments', JSON.stringify(cache.appointments));

    // 2. Persistir no Supabase
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isRecurring, ...dbAppointment } = appointment as any;
    const { error } = await supabase.from('appointments').upsert(dbAppointment);
    if (error) {
      console.error('❌ [Storage] Erro ao atualizar agendamento granular:', error);
      throw error;
    }
  },

  async saveAppointments(appointments: Appointment[]) {
    const currentIds = cache.appointments.map(a => a.id);
    const newIds = appointments.map(a => a.id);
    const deletedIds = currentIds.filter(id => !newIds.includes(id));

    cache.appointments = appointments;
    localStorage.setItem('appointments', JSON.stringify(appointments));

    // Limpar flags de UI antes do upsert
    const dbAppointments = appointments.map(appt => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isRecurring, ...dbAppt } = appt as any;
      return dbAppt;
    });

    const { error } = await supabase.from('appointments').upsert(dbAppointments);
    if (error) console.error('Error saving appointments:', error);

    if (deletedIds.length > 0) {
      const { error: deleteError } = await supabase.from('appointments').delete().in('id', deletedIds);
      if (deleteError) console.error('Error deleting appointments:', deleteError);
    }
  },

  async deleteAppointment(id: string) {
    cache.appointments = cache.appointments.filter(a => a.id !== id);
    localStorage.setItem('appointments', JSON.stringify(cache.appointments));
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) {
      console.error('❌ [Storage] Erro ao excluir agendamento:', error);
      throw error;
    }
  },

  // Users
  getUsers: (): User[] => cache.users,

  async updateUser(user: User) {
    // 1. Atualizar Cache Local e LocalStorage
    const userExists = cache.users.some(u => u.id === user.id);
    if (userExists) {
      cache.users = cache.users.map(u => u.id === user.id ? user : u);
    } else {
      cache.users = [...cache.users, user];
    }
    
    saveCacheToLocal();
    const loggedInId = localStorage.getItem('barbershop_logged_in_user_id');
    if (loggedInId === user.id) {
       localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pushSubscription, ...dbUser } = user; // Remove pushSubscription para evitar sobrescrever com null se não estiver no form
    const { error } = await supabase.from('users').upsert(dbUser);
    if (error) console.error('❌ [Storage] Erro ao atualizar usuário:', error);
  },

  /**
   * Atualiza apenas a inscrição de push de um usuário específico.
   * Evita perda de dados por sobrescrita de objeto inteiro.
   */
  async updateUserPushSubscription(userId: string, subscription: string | null) {
    // 1. Atualizar Cache Local
    const user = cache.users.find(u => u.id === userId);
    if (user) {
      user.pushSubscription = subscription;
      saveCacheToLocal();
      
      const loggedInId = localStorage.getItem('barbershop_logged_in_user_id');
      if (loggedInId === userId) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
    }

    // 2. Atualizar apenas a coluna no Supabase
    const { error } = await supabase
      .from('users')
      .update({ pushSubscription: subscription })
      .eq('id', userId);

    if (error) {
      console.error('❌ [Storage] Erro ao atualizar pushSubscription:', error);
      throw error;
    }
    console.log('✅ [Storage] pushSubscription atualizado no banco.');
  },

  /**
   * Registra uma nova assinatura de push para o usuário na tabela de múltiplas assinaturas.
   */
  async registerPushSubscription(userId: string, subscription: string) {
    if (!userId || !subscription) return;

    const { error } = await supabase
      .from('user_push_subscriptions')
      .upsert({ 
        user_id: userId, 
        subscription: subscription 
      }, { onConflict: 'user_id, subscription' });

    if (error) {
      console.error('❌ [Storage] Erro ao registrar multi-push:', error);
      throw error;
    }
    console.log('✅ [Storage] Nova assinatura de push registrada.');
  },

  async saveUsers(users: User[]) {
    cache.users = users;
    localStorage.setItem('users', JSON.stringify(users));
    const { error } = await supabase.from('users').upsert(users);
    if (error) {
      console.error('❌ [Storage] Erro ao salvar usuários no Supabase:', error);
    }
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

  // --- CONFIGURAÇÕES DA BARBEARIA (SHOP SETTINGS) ---
  getSetting: (key: string, defaultValue: any) => {
    return cache.settings[key] !== undefined ? cache.settings[key] : defaultValue;
  },
  /**
   * Salva uma configuração individual por chave.
   */
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
  saveLoyaltyTarget: async (target: number) => await storage.saveSetting('loyalty_target', target),

  getHolidayMode: (): boolean => storage.getSetting('holiday_mode', false),
  saveHolidayMode: async (isActive: boolean) => await storage.saveSetting('holiday_mode', isActive),

  getAutoReminders: (): boolean => storage.getSetting('auto_reminders', false),
  saveAutoReminders: async (isEnabled: boolean) => await storage.saveSetting('auto_reminders', isEnabled),

  getShopName: (): string => storage.getSetting('shop_name', ''),
  saveShopName: async (name: string) => await storage.saveSetting('shop_name', name),

  getShopPhone: (): string => storage.getSetting('shop_phone', ''),
  saveShopPhone: async (phone: string) => await storage.saveSetting('shop_phone', phone),

  getShopLogo: (): string => normalizeImagePath(storage.getSetting('shop_logo', LogoMenu)),
  saveShopLogo: async (logoUrl: string) => await storage.saveSetting('shop_logo', logoUrl),

  getShopAddress: (): string => storage.getSetting('shop_address', ''),
  saveShopAddress: async (address: string) => await storage.saveSetting('shop_address', address),

  getShopInstagram: (): string => storage.getSetting('shop_instagram', ''),
  saveShopInstagram: async (url: string) => await storage.saveSetting('shop_instagram', url),

  getShopFacebook: (): string => storage.getSetting('shop_facebook', ''),
  saveShopFacebook: async (url: string) => await storage.saveSetting('shop_facebook', url),

  getShopEmail: (): string => storage.getSetting('shop_email', ''),
  saveShopEmail: async (email: string) => await storage.saveSetting('shop_email', email),

  getShopOpeningHours: (): string => storage.getSetting('shop_opening_hours', ''),
  saveShopOpeningHours: async (hours: string) => await storage.saveSetting('shop_opening_hours', hours),

  getShopMapsLink: (): string => storage.getSetting('shop_maps_link', ''),
  saveShopMapsLink: async (link: string) => await storage.saveSetting('shop_maps_link', link),

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
  saveShopGallery: async (images: string[]) => await storage.saveSetting('shop_gallery', images),


  getWhatsAppApiUrl: (): string => storage.getSetting('whatsapp_api_url', ''),
  saveWhatsAppApiUrl: async (url: string) => await storage.saveSetting('whatsapp_api_url', url),

  getWhatsAppApiToken: (): string => storage.getSetting('whatsapp_api_token', ''),
  saveWhatsAppApiToken: async (token: string) => await storage.saveSetting('whatsapp_api_token', token),

  getWhatsAppInstanceId: (): string => storage.getSetting('whatsapp_instance_id', ''),
  saveWhatsAppInstanceId: async (id: string) => await storage.saveSetting('whatsapp_instance_id', id),

  getReminderMinutes: (): string => storage.getSetting('reminder_minutes', '30'),
  saveReminderMinutes: async (minutes: string) => await storage.saveSetting('reminder_minutes', minutes),

  getRecurringSchedules: (): RecurringSchedule[] => cache.recurringSchedules,
  async saveRecurringSchedules(schedules: RecurringSchedule[]) {
    const currentIds = cache.recurringSchedules.map(s => s.id);
    const newIds = schedules.map(s => s.id);
    const deletedIds = currentIds.filter(id => !newIds.includes(id));

    cache.recurringSchedules = schedules;
    localStorage.setItem('recurring_schedules', JSON.stringify(schedules));

    const dbPayload = schedules.map(s => ({
      id: s.id,
      userId: s.userId,
      barberId: s.barberId,
      dayOfWeek: s.dayOfWeek,
      time: s.time,
      active: s.active,
      createdAt: s.createdAt,
      serviceId: s.serviceId,
      serviceIds: s.serviceIds,
      frequency: s.frequency,
      startDate: s.startDate
    }));

    const { error } = await supabase.from('recurring_schedules').upsert(dbPayload);
    if (error) console.error('Error saving recurring schedules:', error);

    if (deletedIds.length > 0) {
      const { error: deleteError } = await supabase.from('recurring_schedules').delete().in('id', deletedIds);
      if (deleteError) console.error('Error deleting recurring schedules:', deleteError);
    }
  },

  getMPAccessToken: (): string => storage.getSetting('mp_access_token', ''),
  saveMPAccessToken: async (token: string) => await storage.saveSetting('mp_access_token', token),

  getMPPublicKey: (): string => storage.getSetting('mp_public_key', ''),
  saveMPPublicKey: async (key: string) => await storage.saveSetting('mp_public_key', key),

  getExpenses: (): Expense[] => cache.expenses,
  async fetchExpenses(startDate?: string, endDate?: string) {
    let query = supabase.from('expenses').select('*');
    
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) {
      console.error('❌ [Storage] Erro ao buscar despesas:', error);
      return [];
    }
    
    cache.expenses = data || [];
    return cache.expenses;
  },
  async saveExpenses(expenses: Expense[]) {
    cache.expenses = expenses;
    await supabase.from('expenses').upsert(expenses);
  },
  async deleteExpense(id: string) {
    cache.expenses = cache.expenses.filter(e => e.id !== id);
    await supabase.from('expenses').delete().eq('id', id);
  },

  getExpenseCategories: (): string[] => cache.expenseCategories,
  async saveExpenseCategories(categories: string[]) {
    cache.expenseCategories = categories;
    await supabase.from('expense_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('expense_categories').insert(categories.map(name => ({ name })));
  },

  // --- GERENCIAMENTO DE PRODUTOS ---
  getProducts: (): Product[] => cache.products,

  async updateProduct(product: Product) {
    cache.products = cache.products.map(p => p.id === product.id ? product : p);
    await supabase.from('products').upsert(product);
  },

  async deleteProduct(id: string) {
    cache.products = cache.products.filter(p => p.id !== id);
    await supabase.from('products').delete().eq('id', id);
  },

  async saveProducts(products: Product[]) {
    cache.products = products;
    await supabase.from('products').upsert(products);
  },
};
