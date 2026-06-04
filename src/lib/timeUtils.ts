import { RecurringSchedule, Service } from '../types';
import { differenceInCalendarWeeks } from 'date-fns';

/**
 * Converte uma string 'yyyy-MM-dd' em um objeto Date local (meia-noite) 
 * sem sofrer deslocamento de fuso horário UTC.
 */
export const parseLocalDate = (dateStr: string | undefined): Date => {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  const [year, month, day] = parts.map(Number);
  // O mês no construtor de Date é 0-indexado (0 = Janeiro)
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Normaliza uma string de horário para o formato "HH:mm".
 * Exemplo: "8:30" -> "08:30", "09:5" -> "09:05"
 */
export const normalizeTime = (time: string): string => {
  if (!time) return '';

  // Remove espaços
  let [hours, minutes] = time.trim().split(':');

  if (!minutes) minutes = '00';

  // Padroniza com zeros à esquerda
  const paddedHours = hours.padStart(2, '0');
  const paddedMinutes = minutes.padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}`;
};

/**
 * Ordena um array de strings de horário ("HH:mm") cronologicamente.
 */
export const sortTimes = (times: string[]): string[] => {
  return [...new Set(times)] // Remove duplicatas
    .map(normalizeTime) // Garante formato HH:mm
    .sort((a, b) => {
      const [hA, mA] = a.split(':').map(Number);
      const [hB, mB] = b.split(':').map(Number);

      if (hA !== hB) return hA - hB;
      return mA - mB;
    });
};

/**
 * Verifica se um horário fixo está ativo em uma data específica,
 * considerando a frequência (semanal ou bi-semanal).
 */
export const isRecurringActive = (schedule: RecurringSchedule, date: Date | string): boolean => {
  if (!schedule.active) return false;
  
  const targetDate = typeof date === 'string' ? parseLocalDate(date) : date;
  
  // Se não houver frequência definida ou for semanal, está sempre ativo
  if (!schedule.frequency || schedule.frequency === 'weekly') {
    return true;
  }

  // Para frequências bi-semanais, verificamos a paridade das semanas em relação à data de início
  if (schedule.frequency === 'biweekly' && schedule.startDate) {
    const start = parseLocalDate(schedule.startDate);
    
    // differenceInCalendarWeeks garante que a contagem mude a cada início de semana (domingo)
    const weeksDiff = Math.abs(differenceInCalendarWeeks(targetDate, start, { weekStartsOn: 0 }));
    
    return weeksDiff % 2 === 0;
  }

  return true;
};

/**
 * Calcula a duração total de múltiplos serviços selecionados.
 * Apenas "cortes" e "barbas" somam tempo (para evitar que "pezinho" ou "sobrancelha" abram novo bloco de 30min).
 */
export const getAppointmentDuration = (serviceIds: string[], services: Service[]): number => {
  if (!serviceIds || serviceIds.length === 0) return 30;

  let totalDuration = 0;
  let hasMainService = false;
  let hasHair = false;
  let hasBeard = false;

  serviceIds.forEach(id => {
    const s = services.find(srv => srv.id === id);
    if (!s) return;

    const name = s.name.toLowerCase();
    const cat = (s.category || '').toLowerCase();
    
    const isHair = name.includes('corte') || name.includes('cabelo') || cat.includes('corte') || cat.includes('cabelo');
    const isBeard = name.includes('barba') || cat.includes('barba');
    const isMain = isHair || isBeard;

    if (isHair) hasHair = true;
    if (isBeard) hasBeard = true;

    if (isMain) {
      totalDuration += (s.duration ?? 30);
      hasMainService = true;
    }
  });

  // Se nenhum serviço principal foi selecionado (ex: só marcou pezinho), 
  // usa o tempo do primeiro serviço ou no mínimo 30 min.
  if (!hasMainService) {
    const firstService = services.find(srv => srv.id === serviceIds[0]);
    return Math.max(30, firstService?.duration ?? 30);
  }

  // REGRA: Cabelo + Barba deve ocupar pelo menos 2 horários (60 min)
  if (hasHair && hasBeard) {
    return Math.max(60, totalDuration);
  }

  return Math.max(30, totalDuration);
};

/**
 * Retorna uma lista com os múltiplos slots de 30 min (ex: ['10:00', '10:30']) 
 * com base no tempo de ínicio e na duração do serviço.
 */
export const getBlockedTimes = (startTime: string, durationMinutes: number): string[] => {
  if (!startTime) return [];
  const [hours, minutes] = startTime.split(':').map(Number);

  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);

  const blocked: string[] = [];
  const slots = Math.ceil(durationMinutes / 30); // block 30 by 30 mins
  for (let i = 0; i < Math.max(1, slots); i++) {
    const d = new Date(startDate.getTime() + i * 30 * 60000);
    const hStr = d.getHours().toString().padStart(2, '0');
    const mStr = d.getMinutes().toString().padStart(2, '0');
    blocked.push(`${hStr}:${mStr}`);
  }
  return blocked;
};

/**
 * Verifica se um horário específico consegue acomodar o tempo do serviço sem colidir com bloqueios.
 */
export const canAccommodateService = (
  startTime: string,
  durationMinutes: number,
  allBookedTimes: string[],
  masterHours: string[]
): boolean => {
  const neededSlots = getBlockedTimes(startTime, durationMinutes);
  return neededSlots.every(slot => masterHours.includes(slot) && !allBookedTimes.includes(slot));
};
