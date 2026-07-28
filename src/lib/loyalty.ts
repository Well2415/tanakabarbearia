import { Service, Appointment, User } from '@/types';

/**
 * Verificador de elegibilidade do serviço para acúmulo de pontos de fidelidade.
 * Apenas serviços relacionados a Cabelo, Barba ou Combos somam pontos.
 */
export function isLoyaltyEligibleService(service: Service | undefined): boolean {
  if (!service) return false;

  const category = (service.category || '').toLowerCase().trim();
  const name = (service.name || '').toLowerCase().trim();

  // Categorias elegíveis
  const eligibleCategories = ['cortes', 'corte', 'barba', 'combos', 'combo', 'cabelo'];
  if (eligibleCategories.some(cat => category.includes(cat))) {
    return true;
  }

  // Palavras-chave no nome do serviço que indicam Cabelo ou Barba
  const eligibleKeywords = ['corte', 'barba', 'cabelo', 'degradê', 'degrade', 'barboterapia', 'selagem', 'pigmentação', 'pigmentacao', 'luzes', 'platinado', 'alinhamento'];
  const isEligibleName = eligibleKeywords.some(keyword => name.includes(keyword));

  // Exclusões explícitas se for APENAS acabamento isolado e não tiver palavras-chave de corte/barba
  const nonEligibleNames = ['risquinho', 'sobrancelha', 'pezinho', 'depilação', 'depilacao'];
  const isOnlyNonEligible = nonEligibleNames.some(non => name.includes(non)) && !isEligibleName;

  if (isOnlyNonEligible) {
    return false;
  }

  return isEligibleName;
}

/**
 * Verifica se um agendamento inclui ao menos um serviço elegível para fidelidade (Cabelo ou Barba).
 */
export function hasEligibleLoyaltyService(appointment: Appointment, services: Service[]): boolean {
  const serviceIdsToCheck: string[] = [];

  if (appointment.serviceIds && appointment.serviceIds.length > 0) {
    serviceIdsToCheck.push(...appointment.serviceIds);
  } else if (appointment.serviceId) {
    serviceIdsToCheck.push(appointment.serviceId);
  }

  return serviceIdsToCheck.some(id => {
    const service = services.find(s => s.id === id);
    return isLoyaltyEligibleService(service);
  });
}

export interface LoyaltyProcessResult {
  updatedUser: User;
  earnedPoint: boolean;
  reachedGoal: boolean;
  previousPoints: number;
  newPoints: number;
}

/**
 * Processa a atualização de fidelidade do cliente ao concluir um atendimento.
 * Retorna o usuário atualizado com pontos zerados se tiver atingido o limite.
 */
export function processClientLoyaltyOnCompletion(
  user: User,
  appointment: Appointment,
  services: Service[],
  loyaltyTarget: number
): LoyaltyProcessResult {
  const updatedUser: User = { ...user };
  const previousPoints = updatedUser.loyaltyPoints || 0;

  const isEligible = hasEligibleLoyaltyService(appointment, services);
  
  // Incrementa contador de cortes se for serviço elegível
  if (isEligible) {
    updatedUser.cutsCount = (updatedUser.cutsCount || 0) + 1;
  }

  let earnedPoint = false;
  let reachedGoal = false;
  let newPoints = previousPoints;

  if (isEligible) {
    earnedPoint = true;
    newPoints = previousPoints + 1;

    if (newPoints >= loyaltyTarget) {
      reachedGoal = true;
      // Zera automaticamente ao atingir o limite para o próximo corte grátis
      newPoints = 0;
    }
  }

  updatedUser.loyaltyPoints = newPoints;

  // Atualiza preferências de estilo com os serviços prestados
  const serviceIds = appointment.serviceIds && appointment.serviceIds.length > 0
    ? appointment.serviceIds
    : [appointment.serviceId];

  serviceIds.forEach(id => {
    const service = services.find(s => s.id === id);
    if (service) {
      if (!updatedUser.stylePreferences) {
        updatedUser.stylePreferences = [service.name];
      } else if (!updatedUser.stylePreferences.includes(service.name)) {
        updatedUser.stylePreferences = [...updatedUser.stylePreferences, service.name];
      }
    }
  });

  return {
    updatedUser,
    earnedPoint,
    reachedGoal,
    previousPoints,
    newPoints,
  };
}
