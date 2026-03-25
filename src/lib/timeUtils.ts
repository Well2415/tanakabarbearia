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

import { Service } from '../types';

/**
 * Calcula a duração total de múltiplos serviços selecionados.
 * Apenas "cortes" e "barbas" somam tempo (para evitar que "pezinho" ou "sobrancelha" abram novo bloco de 30min).
 */
export const getAppointmentDuration = (serviceIds: string[], services: Service[]): number => {
  if (!serviceIds || serviceIds.length === 0) return 30;

  let totalDuration = 0;
  let hasMainService = false;

  serviceIds.forEach(id => {
    const s = services.find(srv => srv.id === id);
    if (!s) return;

    const name = s.name.toLowerCase();
    const cat = (s.category || '').toLowerCase();
    const isMain = name.includes('corte') || name.includes('barba') || cat.includes('corte') || cat.includes('barba');

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
