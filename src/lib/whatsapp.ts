import { Appointment, Barber, Service } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { storage } from './storage';

// Helper to call generic/paid WhatsApp API
const callApiSendMessage = async (phone: string, message: string) => {
    const apiUrl = storage.getWhatsAppApiUrl();
    const apiToken = storage.getWhatsAppApiToken();
    const instanceId = storage.getWhatsAppInstanceId();

    if (!apiUrl || !apiToken) {
        console.warn('API de WhatsApp não configurada. A mensagem não será enviada automaticamente.');
        return;
    }

    try {
        // Generic implementation (Adaptable for Z-API, Evolution, etc.)
        // Usually POST { number: "...", message: "..." } with headers
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`,
                'apikey': apiToken, // Common in Evolution API
                'Client-Token': apiToken // Common in Z-API
            },
            body: JSON.stringify({
                instanceId: instanceId,
                number: `55${phone.replace(/\D/g, '')}`,
                message: message
            })
        });

        if (!response.ok) {
            console.error('Erro ao enviar WhatsApp:', await response.text());
        }
    } catch (error) {
        console.error('Erro na chamada da API de WhatsApp:', error);
        // Potential fallback to manual on error?
    }
};

export const sendWhatsAppConfirmation = async (
    appointment: Appointment,
    barber: Barber,
    service: Service
) => {
    let phone = appointment.guestPhone || '';
    let guestName = appointment.guestName || '';

    // If it's a registered user's appointment and phone is missing, fetch from storage
    if (!phone && appointment.userId) {
        const user = storage.getUsers().find(u => u.id === appointment.userId);
        if (user) {
            phone = user.phone;
            guestName = user.fullName;
        }
    }

    if (!phone) return;

    // Format date for the message
    const dateObj = typeof appointment.date === 'string' ? parseISO(appointment.date) : appointment.date;
    const formattedDate = format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });
    const shopName = storage.getShopName();

    const message = `Olá ${guestName || 'Cliente'}! 👋\n\nSeu agendamento na *${shopName}* foi confirmado com sucesso! ✅\n\n📍 *Detalhes:*\n✂️ *Serviço:* ${service.name}\n👤 *Barbeiro:* ${barber.name}\n📆 *Data:* ${formattedDate}\n⏰ *Horário:* ${appointment.time}\n💰 *Valor:* R$ ${service.price.toFixed(2).replace('.', ',')}\n\nEstamos te esperando! ⚡`;

    await callApiSendMessage(phone, message);
};

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

    const dateObj = typeof appointment.date === 'string' ? parseISO(appointment.date) : appointment.date;
    const formattedDate = format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR });
    const shopName = storage.getShopName();

    const message = `Olá ${guestName || 'Cliente'}! 👋\n\nSeu agendamento na *${shopName}* foi confirmado com sucesso! ✅\n\n📍 *Detalhes:*\n✂️ *Serviço:* ${service.name}\n👤 *Barbeiro:* ${barber.name}\n📆 *Data:* ${formattedDate}\n⏰ *Horário:* ${appointment.time}\n💰 *Valor:* R$ ${service.price.toFixed(2).replace('.', ',')}\n\nEstamos te esperando! ⚡`;
    
    return `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
};

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
