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
