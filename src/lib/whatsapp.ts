/**
 * MÓDULO DE NOTIFICAÇÕES WHATSAPP
 * Gerencia o envio de mensagens de confirmação e lembretes para os clientes.
 * Compatível com APIs como Z-API, Evolution, entre outras (baseadas em POST).
 */
import { Appointment, Barber, Service } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { storage } from './storage';

/**
 * Função interna para disparar a requisição POST para a API de WhatsApp configurada.
 * Lê a URL, Token e InstanceID das configurações salvas no banco de dados.
 */
const callApiSendMessage = async (phone: string, message: string) => {
    const apiUrl = storage.getWhatsAppApiUrl();
    const apiToken = storage.getWhatsAppApiToken();
    const instanceId = storage.getWhatsAppInstanceId();

    if (!apiUrl || !apiToken) {
        console.warn('API de WhatsApp não configurada. A mensagem não será enviada automaticamente.');
        return;
    }

    try {
        // Implementação genérica de POST enviando JSON.
        // Adaptável para Evolution API ou Z-API através dos headers.
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`,
                'apikey': apiToken,
                'Client-Token': apiToken
            },
            body: JSON.stringify({
                instanceId: instanceId,
                number: phone.replace(/\D/g, '').startsWith('55') ? phone.replace(/\D/g, '') : `55${phone.replace(/\D/g, '')}`,
                message: message
            })
        });

        if (!response.ok) {
            console.error('Erro ao enviar WhatsApp:', await response.text());
        }
    } catch (error) {
        console.error('Erro na chamada da API de WhatsApp:', error);
    }
};

/**
 * Envia uma mensagem de BOAS-VINDAS / CONFIRMAÇÃO quando um agendamento é criado.
 */
export const sendWhatsAppConfirmation = async (
    appointment: Appointment,
    barber: Barber,
    service: Service
) => {
    let phone = appointment.guestPhone || '';
    let guestName = appointment.guestName || '';

    // Busca o telefone do usuário se não for um convidado direto.
    if (!phone && appointment.userId) {
        const user = storage.getUsers().find(u => u.id === appointment.userId);
        if (user) {
            phone = user.phone;
            guestName = user.fullName;
        }
    }

    if (!phone) return;

    // Formatação amigável da data para a mensagem.
    const dateObj = typeof appointment.date === 'string' ? new Date(appointment.date + 'T12:00:00') : appointment.date;
    const formattedDate = format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });
    const shopName = storage.getShopName();

    const message = `Olá ${guestName || 'Cliente'}! 👋\n\nSeu agendamento na *${shopName}* foi confirmado com sucesso! ✅\n\n📍 *Detalhes:*\n✂️ *Serviço:* ${service.name}\n👤 *Barbeiro:* ${barber.name}\n📆 *Data:* ${formattedDate}\n⏰ *Horário:* ${appointment.time}\n💰 *Valor:* R$ ${service.price.toFixed(2).replace('.', ',')}\n\nEstamos te esperando! ⚡`;

    await callApiSendMessage(phone, message);
};

/**
 * Gera um link de "wa.me" para envio MANAL caso a API automática falhe ou não esteja configurada.
 */
export const getWhatsAppManualLink = (
    appointment: Appointment,
    barber: Barber,
    service: Service
) => {
    let phone = appointment.guestPhone || '';
    let guestName = appointment.guestName || '';

    if (!phone && appointment.userId) {
        const user = storage.getUsers().find(u => u.id === appointment.userId);
        if (user) {
            phone = user.phone;
            guestName = user.fullName;
        }
    }

    if (!phone) return "";

    const dateObj = typeof appointment.date === 'string' ? new Date(appointment.date + 'T12:00:00') : appointment.date;
    const formattedDate = format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });
    const shopName = storage.getShopName();

    const message = `Olá ${guestName || 'Cliente'}! 👋\n\nSeu agendamento na *${shopName}* foi confirmado com sucesso! ✅\n\n📍 *Detalhes:*\n✂️ *Serviço:* ${service.name}\n👤 *Barbeiro:* ${barber.name}\n📆 *Data:* ${formattedDate}\n⏰ *Horário:* ${appointment.time}\n💰 *Valor:* R$ ${service.price.toFixed(2).replace('.', ',')}\n\nEstamos te esperando! ⚡`;

    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Envia um lembrete automático 2 horas antes do horário marcado.
 */
export const sendWhatsApp2HourReminder = async (
    appointment: Appointment,
    barber: Barber,
    service: Service
) => {
    let phone = appointment.guestPhone || '';
    let guestName = appointment.guestName || '';

    if (!phone && appointment.userId) {
        const user = storage.getUsers().find(u => u.id === appointment.userId);
        if (user) {
            phone = user.phone;
            guestName = user.fullName;
        }
    }

    if (!phone) return;

    const shopName = storage.getShopName();
    const message = `Olá ${guestName || 'Cliente'}! 👋\n\n*${shopName}* informa: falta apenas *2 horas* para o seu horário! ⏳\n\n✂️ *Serviço:* ${service.name}\n👤 *Barbeiro:* ${barber.name}\n⏰ *Horário:* ${appointment.time}\n\nAté daqui a pouco! ⚡`;

    await callApiSendMessage(phone, message);
};
