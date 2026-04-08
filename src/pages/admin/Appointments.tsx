import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { sendWhatsAppConfirmation, getWhatsAppManualLink, sendWhatsApp2HourReminder } from '@/lib/whatsapp';
import { ArrowLeft, Check, X, Play, DollarSign, Clock, Plus, Trash2, Scissors, UserCog, MessageSquare, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Appointment } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isAfter, isBefore, startOfDay, isSameDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPixPayment, createPreference, checkPaymentStatus, isMPConfigured, PixPaymentResponse } from '@/lib/mercadoPago';
import { Loader2, QrCode, Copy, CreditCard, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { notificationManager } from '@/lib/notifications';
import { formatCurrency, cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check as CheckIcon, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getAppointmentDuration, getBlockedTimes, canAccommodateService, parseLocalDate, isRecurringActive } from '@/lib/timeUtils';

const Appointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const users = storage.getUsers();
  const barbers = storage.getBarbers();
  const services = storage.getServices();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentAppointmentToComplete, setCurrentAppointmentToComplete] = useState<Appointment | null>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link' | ''>('');
  const [extraChargesInput, setExtraChargesInput] = useState(0);
  const [discountInput, setDiscountInput] = useState(0);
  const finalPrice = Math.max(0, (currentAppointmentToComplete?.servicePrice || 0) + extraChargesInput - discountInput);
  const [preferenceUrl, setPreferenceUrl] = useState<string | null>(null);
  const [isLoadingLink, setIsLoadingLink] = useState(false);


  const [startDate, setStartDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'cash' | 'credit_card' | 'debit_card' | 'link' | ''>('all');
  const [filteredPaymentsReport, setFilteredPaymentsReport] = useState<{
    totalRevenue: number;
    cash: number;
    credit_card: number;
    debit_card: number;
    link: number;
  } | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [editedDate, setEditedDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [editedTime, setEditedTime] = useState('');
  const [editedServiceId, setEditedServiceId] = useState('');
  const [editedBarberId, setEditedBarberId] = useState('');
  const [editedPaymentType, setEditedPaymentType] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link' | ''>('');
  const [editedExtraCharges, setEditedExtraCharges] = useState(0);
  const [editedStatus, setEditedStatus] = useState<string>('');

  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [newBookingData, setNewBookingData] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: '',
    barberId: '',
    date: startOfDay(new Date()),
    time: '',
    userId: null as string | null
  });

  useEffect(() => {
    const initStorage = async () => {
      await storage.initialize();
      const barbersList = storage.getBarbers();
      if (barbersList.length === 1 && !newBookingData.barberId) {
        setNewBookingData(prev => ({ ...prev, barberId: barbersList[0].id }));
      }
      setAppointments(storage.getAppointments());
    };
    initStorage();
  }, [newBookingData.barberId]);
  const [manualFilteredTimes, setManualFilteredTimes] = useState<string[]>([]);
  const [editFilteredTimes, setEditFilteredTimes] = useState<string[]>([]);
  const [isManualCalendarOpen, setIsManualCalendarOpen] = useState(false);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [isEditPickerOpen, setIsEditPickerOpen] = useState(false);
  const [isClientComboOpen, setIsClientComboOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [lastBarberDate, setLastBarberDate] = useState({ barberId: '', date: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (newBookingData.date && newBookingData.barberId) {
      const selectedBarber = barbers.find(b => b.id === newBookingData.barberId);
      if (!selectedBarber) return;

      const masterHours = (selectedBarber.scheduleByDay && selectedBarber.scheduleByDay[new Date(newBookingData.date).getDay()]) || selectedBarber.availableHours || [];
      const formattedDate = format(newBookingData.date, 'yyyy-MM-dd');

      const allBookedTimes: string[] = [];

      appointments
        .filter(app => app.barberId === newBookingData.barberId && app.date === formattedDate && app.status !== 'cancelled' && app.status !== 'no_show')
        .forEach(app => {
          const serviceIds = app.serviceIds && app.serviceIds.length > 0 ? app.serviceIds : [app.serviceId];
          const duration = getAppointmentDuration(serviceIds, services);
          allBookedTimes.push(...getBlockedTimes(app.time, duration));
        });

      const recurringSchedules = storage.getRecurringSchedules();
      const dayOfWeek = newBookingData.date.getDay();

      recurringSchedules
        .filter(s => s.barberId === newBookingData.barberId && s.dayOfWeek === dayOfWeek && s.active)
        .forEach(s => {
          const serviceIds = s.serviceIds && s.serviceIds.length > 0 ? s.serviceIds : [s.serviceId];
          const duration = getAppointmentDuration(serviceIds, services);
          allBookedTimes.push(...getBlockedTimes(s.time, duration));
        });

      const requestedDuration = getAppointmentDuration([newBookingData.serviceId], services);

      // Filtra horários que já passaram (se for hoje)
      const now = new Date();
      const isToday = formattedDate === format(now, 'yyyy-MM-dd');
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      const available = masterHours.filter(hour => {
        if (isToday) {
          const [h, m] = hour.split(':').map(Number);
          if (h < currentHour || (h === currentHour && m <= currentMin)) {
            return false;
          }
        }
        return canAccommodateService(hour, requestedDuration, allBookedTimes, masterHours);
      });

      setManualFilteredTimes(available);

      // Only reset time if barber or date actually changed
      if (newBookingData.barberId !== lastBarberDate.barberId || formattedDate !== lastBarberDate.date) {
        setNewBookingData(current => ({ ...current, time: '' }));
        setLastBarberDate({ barberId: newBookingData.barberId, date: formattedDate });
      }
    } else {
      setManualFilteredTimes([]);
    }
  }, [newBookingData.date, newBookingData.barberId, appointments, barbers]);

  useEffect(() => {
    if (editedDate && editedBarberId) {
      const selectedBarber = barbers.find(b => b.id === editedBarberId);
      if (!selectedBarber) return;

      const masterHours = (selectedBarber.scheduleByDay && selectedBarber.scheduleByDay[editedDate.getDay()]) || selectedBarber.availableHours || [];
      const formattedDate = format(editedDate, 'yyyy-MM-dd');

      const allBookedTimes: string[] = [];

      appointments
        .filter(app => app.barberId === editedBarberId && app.date === formattedDate && app.status !== 'cancelled' && app.status !== 'no_show' && app.id !== appointmentToEdit?.id)
        .forEach(app => {
          const serviceIds = app.serviceIds && app.serviceIds.length > 0 ? app.serviceIds : [app.serviceId];
          const duration = getAppointmentDuration(serviceIds, services);
          allBookedTimes.push(...getBlockedTimes(app.time, duration));
        });

      const recurringSchedules = storage.getRecurringSchedules();
      const dayOfWeek = editedDate.getDay();

      recurringSchedules
        .filter(s => s.barberId === editedBarberId && s.dayOfWeek === dayOfWeek && s.active)
        .forEach(s => {
          const serviceIds = s.serviceIds && s.serviceIds.length > 0 ? s.serviceIds : [s.serviceId];
          const duration = getAppointmentDuration(serviceIds, services);
          allBookedTimes.push(...getBlockedTimes(s.time, duration));
        });

      const requestedDuration = getAppointmentDuration([editedServiceId], services);

      // Filtra horários que já passaram (se for hoje)
      const now = new Date();
      const isToday = formattedDate === format(now, 'yyyy-MM-dd');
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      const available = masterHours.filter(hour => {
        if (isToday) {
          const [h, m] = hour.split(':').map(Number);
          if (h < currentHour || (h === currentHour && m <= currentMin)) {
            // Mantém o horário atual do agendamento se estivermos editando ele mesmo
            if (appointmentToEdit && appointmentToEdit.date === formattedDate && hour === appointmentToEdit.time) {
              return true;
            }
            return false;
          }
        }
        return canAccommodateService(hour, requestedDuration, allBookedTimes, masterHours);
      });

      // If the current appointment's time is not in the list (e.g. it was booked but is now being edited), include it
      if (appointmentToEdit && appointmentToEdit.date === formattedDate && appointmentToEdit.barberId === editedBarberId) {
        if (!available.includes(appointmentToEdit.time)) {
          available.push(appointmentToEdit.time);
          available.sort();
        }
      }

      setEditFilteredTimes(available);
    } else {
      setEditFilteredTimes([]);
    }
  }, [editedDate, editedBarberId, appointments, barbers, appointmentToEdit]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('action') === 'book') {
      setShowBookingDialog(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleCreateManualAppointment = async () => {
    const { clientName, clientPhone, serviceId, barberId, date, time, userId } = newBookingData;
    if (!clientName || !serviceId || !barberId || !date || !time) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    const service = storage.getServices().find(s => s.id === serviceId);
    const barber = storage.getBarbers().find(b => b.id === barberId);

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      userId: userId || null,
      guestName: userId ? undefined : clientName,
      guestPhone: userId ? undefined : clientPhone,
      serviceId,
      serviceIds: [serviceId],
      servicePrice: service?.price || 0,
      barberId,
      date: format(date, 'yyyy-MM-dd'),
      time,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    const updated = [...appointments, newAppointment];
    await storage.saveAppointments(updated);
    setAppointments(updated);

    // Abre WhatsApp manualmente para economizar API (conforme pedido pelo usuário)
    if (clientPhone && barber && service) {
      const link = getWhatsAppManualLink(newAppointment, barber, service);
      if (link) window.open(link, '_blank');
    }

    setShowBookingDialog(false);
    setNewBookingData({ clientName: '', clientPhone: '', serviceId: '', barberId: '', date: startOfDay(new Date()), time: '', userId: null });
    toast({ title: "Agendamento Realizado", description: `Agendamento para ${clientName} marcado com sucesso.` });
  };

  const handleDeleteAppointment = async () => {
    if (appointmentToDelete) {
      const updatedAppointments = appointments.filter(appt => appt.id !== appointmentToDelete.id);
      await storage.saveAppointments(updatedAppointments);
      setAppointments(updatedAppointments);
      toast({ title: "Agendamento Excluído", description: "O agendamento foi removido com sucesso." });
      setShowDeleteDialog(false);
      setAppointmentToDelete(null);
    }
  };

  const handleUpdateAppointment = async () => {
    if (appointmentToEdit) {
      const updatedAppointment: Appointment = {
        ...appointmentToEdit,
        date: editedDate ? format(editedDate, 'yyyy-MM-dd') : appointmentToEdit.date,
        time: editedTime,
        serviceId: editedServiceId,
        barberId: editedBarberId,
        paymentType: editedPaymentType as any,
        extraCharges: editedExtraCharges,
        status: editedStatus as any,
        finalPrice: (appointmentToEdit.servicePrice || 0) + editedExtraCharges,
      };
      await updateAppointmentInStorage(updatedAppointment);
      toast({ title: "Agendamento Atualizado", description: "O agendamento foi atualizado com sucesso." });
      setShowEditDialog(false);
      setAppointmentToEdit(null);
    }
  };


  const handleGenerateReport = () => {
    const start = startDate || null;
    const end = endDate || null;

    const filtered = appointments.filter(appt => {
      if (appt.status !== 'completed' || !appt.finalPrice || !appt.paymentType) return false;
      const apptDate = parseLocalDate(appt.date);
      if (start && isBefore(apptDate, start)) return false;
      if (end && isAfter(apptDate, end)) return false;
      if (paymentTypeFilter !== 'all' && appt.paymentType !== paymentTypeFilter) return false;
      return true;
    });

    let totalRevenue = 0;
    let cash = 0;
    let credit_card = 0;
    let debit_card = 0;
    let link = 0;

    filtered.forEach(appt => {
      if (appt.finalPrice) {
        totalRevenue += appt.finalPrice;
        switch (appt.paymentType) {
          case 'cash':
            cash += appt.finalPrice;
            break;
          case 'credit_card':
            credit_card += appt.finalPrice;
            break;
          case 'debit_card':
            debit_card += appt.finalPrice;
            break;
          case 'link':
            link += appt.finalPrice;
            break;
        }
      }
    });

    setFilteredPaymentsReport({
      totalRevenue,
      cash,
      credit_card,
      debit_card,
      link,
    });
  };

  // Função para gerar agendamentos de teste
  const generateTestAppointments = async (count: number = 5) => {
    const existingAppointments = storage.getAppointments();

    const testBarbers = storage.getBarbers();
    const testServices = storage.getServices();
    const testUsers = storage.getUsers();

    if (testBarbers.length === 0 || testServices.length === 0 || testUsers.length === 0) {
      console.warn("Não há barbeiros, serviços ou usuários para gerar agendamentos de teste.");
      return;
    }

    const newAppointments: Appointment[] = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
      const id = `test-appt-${existingAppointments.length + i + 1}`;
      const userId = testUsers[i % testUsers.length].id;
      const barberId = testBarbers[i % testBarbers.length].id;
      const serviceId = testServices[i % testServices.length].id;
      const servicePrice = testServices[i % testServices.length].price;
      const extraCharges = Math.floor(Math.random() * 20) + 5; // 5 a 24
      const finalPrice = servicePrice + extraCharges;
      const statusOptions: Appointment['status'][] = ['pending', 'confirmed', 'in_progress', 'completed'];
      const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const paymentTypeOptions: Appointment['paymentType'][] = ['cash', 'credit_card', 'debit_card', 'link'];
      const randomPaymentType = paymentTypeOptions[Math.floor(Math.random() * paymentTypeOptions.length)];

      newAppointments.push({
        id,
        userId,
        barberId,
        serviceId,
        date: format(today, 'yyyy-MM-dd'),
        time: `${10 + i}:00`, // Horários diferentes
        status: randomStatus,
        createdAt: new Date().toISOString(),
        servicePrice,
        extraCharges: randomStatus === 'completed' ? extraCharges : undefined,
        finalPrice: randomStatus === 'completed' ? finalPrice : undefined,
        startTime: randomStatus === 'in_progress' || randomStatus === 'completed' ? `${10 + i}:05` : undefined,
        endTime: randomStatus === 'completed' ? `${10 + i + 1}:00` : undefined,
        paymentType: randomStatus === 'completed' ? randomPaymentType : undefined,
      });
    }

    await storage.saveAppointments([...existingAppointments, ...newAppointments]);
    setAppointments(storage.getAppointments());
    toast({ title: "Agendamentos de teste gerados!", description: "5 agendamentos de teste foram adicionados." });
  };

  // useEffect(() => {
  //   generateTestAppointments();
  // }, []); // Executar apenas uma vez ao montar o componente

  useEffect(() => {
    const isStaff = user?.role === 'admin' || user?.role === 'barber';
    if (!user || !isStaff) {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
      navigate('/dashboard');
    } else {
      setAppointments(storage.getAppointments());
    }
  }, []);

  // Lógica de Lembrete Automático (2 horas antes)
  useEffect(() => {
    const checkReminders = async () => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');

      const upcoming = appointments.filter(app => {
        // Apenas agendamentos confirmados hoje, sem lembrete enviado
        if (app.status !== 'confirmed' || app.reminderSent || app.date !== todayStr) return false;

        try {
          const [hours, minutes] = app.time.split(':').map(Number);
          const appDate = new Date();
          appDate.setHours(hours, minutes, 0, 0);

          const diffInMinutes = (appDate.getTime() - now.getTime()) / (1000 * 60);

          // Se falta entre 0 e 125 minutos (aprox 2 horas com uma margem)
          return diffInMinutes > 0 && diffInMinutes <= 125;
        } catch (e) {
          return false;
        }
      });

      for (const app of upcoming) {
        const barber = barbers.find(b => b.id === app.barberId);
        const service = services.find(s => s.id === (app.serviceIds?.[0] || app.serviceId));
        if (barber && service) {
          console.log(`⏰ Enviando lembrete automático de 2h para ${app.guestName || app.userId}`);
          await sendWhatsApp2HourReminder(app, barber, service);
          
          // Enviar Notificação Push se o usuário tiver ID (a Edge Function verifica a inscrição no Banco)
          if (app.userId) {
            await notificationManager.sendPushNotification(
              app.userId,
            'Aviso de Agendamento',
              `Faltam 2 horas para o seu serviço de ${service.name} na Tanaka Barbearia!`,
              '/dashboard'
            );
          }

          // Marcar como enviado no storage
          await updateAppointmentInStorage({ ...app, reminderSent: true });
        }
      }
    };

    const interval = setInterval(checkReminders, 1000 * 60 * 10); // Check every 10 minutes
    const timeout = setTimeout(checkReminders, 2000); // Check 2s after mount

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [appointments, barbers, services]);





  if (!user || !(user.role === 'admin' || user.role === 'barber')) return null;

  const getClientName = (appointment: Appointment) => {
    if (!appointment) return 'Agendamento Inválido';
    if (appointment.guestName) return `${appointment.guestName} (Convidado)`;
    const client = users.find(u => u.id === appointment.userId);
    return client?.fullName || 'Cliente desconhecido';
  };
  const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'N/A';
  const getServiceName = (id: string | string[]) => {
    const ids = Array.isArray(id) ? id : [id];
    return ids.map(serviceId => services.find(s => s.id === serviceId)?.name).filter(Boolean).join(' + ') || 'N/A';
  };

  const displayAppointments = useMemo(() => {
    const recurringSchedules = storage.getRecurringSchedules();
    const virtualAppointments: Appointment[] = [];
    
    // Se tivermos um intervalo definido, geramos os virtuais para cada dia desse intervalo
    if (startDate && endDate) {
      const start = startOfDay(startDate);
      const end = startOfDay(endDate);
      
      // Limita a geração a 31 dias para evitar problemas de performance
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 31) {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const currentDayStr = format(d, 'yyyy-MM-dd');
          const dayOfWeek = d.getDay();
          
          const dayVirtuals = recurringSchedules
            .filter(s => s.active && s.dayOfWeek === dayOfWeek && isRecurringActive(s, d))
            .map(s => {
              const scheduleServiceIds = s.serviceIds && s.serviceIds.length > 0 ? s.serviceIds : [s.serviceId];
              const totalPrice = scheduleServiceIds.reduce((sum, id) => {
                const srv = services.find(serv => serv.id === id);
                return sum + (srv?.price || 0);
              }, 0);

              return {
                id: `recurring-${s.id}-${currentDayStr}`,
                userId: s.userId,
                barberId: s.barberId,
                serviceId: s.serviceId,
                serviceIds: scheduleServiceIds,
                date: currentDayStr,
                time: s.time,
                status: 'confirmed' as const,
                isRecurring: true,
                servicePrice: totalPrice,
                createdAt: s.createdAt
              } as Appointment;
            });
            
          virtualAppointments.push(...dayVirtuals);
        }
      }
    } else {
      // Fallback para Hoje se não houver filtro (segurança)
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const todayVirtuals = recurringSchedules
        .filter(s => s.active && s.dayOfWeek === today.getDay() && isRecurringActive(s, today))
        .map(s => ({
          id: `recurring-${s.id}-${todayStr}`,
          userId: s.userId,
          barberId: s.barberId,
          serviceId: s.serviceId,
          serviceIds: s.serviceIds || [s.serviceId],
          date: todayStr,
          time: s.time,
          status: 'confirmed' as const,
          isRecurring: true,
          servicePrice: (s.serviceIds || [s.serviceId]).reduce((sum, id) => sum + (services.find(serv => serv.id === id)?.price || 0), 0),
          createdAt: s.createdAt
        } as Appointment));
      virtualAppointments.push(...todayVirtuals);
    }

    // Agrupa agendamentos virtuais por usuário/dia/barbeiro para evitar duplicidade visual
    const groupedVirtual = virtualAppointments.reduce((acc, appt) => {
      const key = `${appt.userId || appt.guestName}-${appt.date}-${appt.barberId}`;
      if (!acc[key]) {
        acc[key] = { ...appt };
      } else {
        // Se já existe, unificamos os serviços e somamos os preços
        const existing = acc[key];
        const newServiceIds = [...(existing.serviceIds || [existing.serviceId])];
        const nextServiceIds = appt.serviceIds || [appt.serviceId];
        
        nextServiceIds.forEach(id => {
          if (!newServiceIds.includes(id)) {
            newServiceIds.push(id);
          }
        });

        existing.serviceIds = newServiceIds;
        existing.serviceId = newServiceIds[0];
        existing.servicePrice = (existing.servicePrice || 0) + (appt.servicePrice || 0);
        // Mantém o horário mais cedo como horário de exibição principal
        if (appt.time < existing.time) {
          existing.time = appt.time;
        }
      }
      return acc;
    }, {} as Record<string, Appointment>);

    const finalVirtual = Object.values(groupedVirtual);

    // Remove duplicatas (se já existir um agendamento real para aquele barbeiro/hora/dia)
    // Aqui relaxamos a checagem de hora para ID-Dia-Barbeiro para evitar sobrepor o grupo todo
    const realBusySlots = new Set(appointments.filter(a => a.status !== 'cancelled').map(a => `${a.userId || a.guestName}-${a.date}-${a.barberId}`));
    const uniqueVirtual = finalVirtual.filter(v => !realBusySlots.has(`${v.userId || v.guestName}-${v.date}-${v.barberId}`));

    return [...appointments, ...uniqueVirtual];
  }, [appointments, services, startDate, endDate, users]);

  const filteredAppointments = displayAppointments
    .filter(appt => {
      // Search filter
      const clientName = (appt.guestName || users.find(u => u.id === appt.userId)?.fullName || '').toLowerCase();
      const matchesSearch = clientName.includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Date range filter - Pending appointments bypass this filter for visibility
      const apptDate = parseLocalDate(appt.date);
      if (appt.status !== 'pending') {
        if (startDate && isBefore(apptDate, startOfDay(startDate))) return false;
        if (endDate && isAfter(apptDate, startOfDay(endDate))) return false;
      }

      // Tab filter
      const todayFilter = new Date();
      switch (activeTab) {
        case 'pending':
          return appt.status === 'pending';
        case 'confirmed':
          return appt.status === 'confirmed';
        case 'today':
          // Show today's appointments OR any pending appointment
          return isSameDay(apptDate, todayFilter) || appt.status === 'pending';
        case 'history':
          return appt.status === 'completed' || appt.status === 'cancelled' || appt.status === 'no_show';
        case 'all':
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Pending first
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateB - dateA; // Newest first
    });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCount = (status: string) => {
    const today = new Date();
    switch (status) {
      case 'pending':
        return appointments.filter(a => a.status === 'pending').length;
      case 'confirmed':
        return appointments.filter(a => a.status === 'confirmed').length;
      case 'today':
        return appointments.filter(a => isSameDay(parseLocalDate(a.date), today)).length;
      case 'history':
        return appointments.filter(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'no_show').length;
      default:
        return appointments.length;
    }
  };

  const updateAppointmentInStorage = async (updatedAppointment: Appointment) => {
    await storage.updateAppointment(updatedAppointment);
    setAppointments(storage.getAppointments());
  };

  const handleStartService = async (appointment: Appointment) => {
    const now = new Date();
    const scheduledDateTime = parseISO(`${appointment.date}T${appointment.time}:00`);
    const isDelayed = isAfter(now, scheduledDateTime);

    const updatedAppointment = {
      ...appointment,
      startTime: format(now, 'HH:mm'),
      isDelayed: isDelayed,
      status: 'in_progress' as const,
    };
    await updateAppointmentInStorage(updatedAppointment);
    toast({ title: 'Serviço Iniciado', description: `O corte de ${getClientName(appointment)} foi iniciado.` });
  };

  const handleCompleteService = async () => {
    if (!currentAppointmentToComplete || !paymentType) return;

    const now = new Date();
    const updatedAppointment = {
      ...currentAppointmentToComplete,
      endTime: format(now, 'HH:mm'),
      paymentType: paymentType,
      extraCharges: extraChargesInput,
      discount: discountInput,
      finalPrice: finalPrice, // Usar o finalPrice calculado
      status: 'completed' as const,
    };
    await updateAppointmentInStorage(updatedAppointment);

        // Update user's cutsCount, loyaltyPoints and stylePreferences
        if (currentAppointmentToComplete.userId) {
            const allUsers = storage.getUsers();
            const userToUpdate = allUsers.find(u => u.id === currentAppointmentToComplete.userId);
            if (userToUpdate) {
                const updatedUser = { ...userToUpdate };
                
                // Incrementa contador de cortes
                updatedUser.cutsCount = (updatedUser.cutsCount || 0) + 1;

                // Atribui exatamente 1 ponto por visita (independente dos serviços)
                const pointsEarned = 1;
                updatedUser.loyaltyPoints = (updatedUser.loyaltyPoints || 0) + pointsEarned;

                // Verifica se atingiu a meta de fidelidade e notifica admins
                const loyaltyTarget = storage.getLoyaltyTarget();
                if (updatedUser.loyaltyPoints >= loyaltyTarget) {
                    const allAdmins = allUsers.filter(u => u.role === 'admin');
                    allAdmins.forEach(admin => {
                        notificationManager.sendPushNotification(
                            admin.id,
                            "Meta de Fidelidade Atingida! 🏆",
                            `O cliente ${updatedUser.fullName} completou ${updatedUser.loyaltyPoints} pontos e já pode ganhar um prêmio!`,
                            "/admin/clients"
                        ).catch(err => console.error('Erro ao notificar admin:', err));
                    });
                }

                // Atualiza preferências de estilo
                const service = services.find(s => s.id === currentAppointmentToComplete.serviceId);
                if (service && updatedUser.stylePreferences && !updatedUser.stylePreferences.includes(service.name)) {
                    updatedUser.stylePreferences = [...updatedUser.stylePreferences, service.name];
                } else if (service && !updatedUser.stylePreferences) {
                    updatedUser.stylePreferences = [service.name];
                }

                const finalUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
                await storage.saveUsers(finalUsers);
            }
        }

    setShowPaymentDialog(false);
    setCurrentAppointmentToComplete(null);
    setPaymentType('');
    setExtraChargesInput(0);
    setDiscountInput(0);
    toast({ title: 'Serviço Finalizado', description: `O corte de ${getClientName(currentAppointmentToComplete)} foi concluído e pago via ${paymentType}. Total: ${formatCurrency(finalPrice)}.` });
  };

  const handleGenerateLink = async () => {
    if (!currentAppointmentToComplete) return;
    setIsLoadingLink(true);
    const description = `Serviço: ${getServiceName(currentAppointmentToComplete.serviceId)} - ${storage.getShopName() || 'Barbearia'}`;
    const clientEmail = storage.getUsers().find(u => u.id === currentAppointmentToComplete.userId)?.email || storage.getSetting('shop_email', 'contato@barbearia.com');

    const url = await createPreference(finalPrice, description, clientEmail);
    setPreferenceUrl(url);
    setIsLoadingLink(false);

    if (url) {
      toast({ title: 'Link Gerado', description: 'Link de pagamento do Mercado Pago gerado com sucesso.' });
    } else {
      toast({ title: 'Erro ao gerar Link', description: 'Verifique suas credenciais do Mercado Pago.', variant: 'destructive' });
    }
  };

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    const updatedAppointment = appointments.find(a => a.id === id);
    if (!updatedAppointment) return;

    const newAppointment = { ...updatedAppointment, status };
    await updateAppointmentInStorage(newAppointment);

    if (status === 'confirmed') {
      const barber = barbers.find(b => b.id === updatedAppointment.barberId);
      const service = services.find(s => s.id === (updatedAppointment.serviceIds?.[0] || updatedAppointment.serviceId));
      if (barber && service) {
        // Envio MANUAL para economizar API nas confirmações por botão
        const link = getWhatsAppManualLink(newAppointment, barber, service);
        if (link) window.open(link, '_blank');

        // Enviar Notificação Push de Confirmação (a Edge Function verifica a inscrição no Banco)
        if (updatedAppointment.userId) {
          await notificationManager.sendPushNotification(
            updatedAppointment.userId,
            'Horário Confirmado! ✅',
            `Seu horário para ${service.name} foi confirmado com sucesso.`,
            '/dashboard'
          );
        }
      }
    }

    toast({ title: 'Status atualizado', description: `O agendamento foi ${status === 'confirmed' ? 'confirmado' : 'cancelado'} com sucesso.` });
  };

  const handleNoShow = async (appointment: Appointment) => {
    if (appointment.userId) {
      const allUsers = storage.getUsers();
      const userToUpdate = allUsers.find(u => u.id === appointment.userId);
      if (userToUpdate) {
        const updatedUser = {
          ...userToUpdate,
          noShowCount: (userToUpdate.noShowCount || 0) + 1
        };
        const finalUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        await storage.saveUsers(finalUsers);
      }
    }

    await updateAppointmentInStorage({ ...appointment, status: 'no_show' });
    toast({
      title: 'Não Comparecimento',
      description: `O cliente foi sinalizado por não comparecer ao horário marcado.`,
      variant: "destructive"
    });
  };



  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    confirmed: 'bg-blue-500/10 text-blue-500',
    cancelled: 'bg-red-500/10 text-red-500',
    in_progress: 'bg-purple-500/10 text-purple-500',
    completed: 'bg-green-500/10 text-green-500',
    no_show: 'bg-orange-500/10 text-orange-600',
  };

  const statusLabels = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    in_progress: 'Em Progresso',
    completed: 'Concluído',
    no_show: 'Não Compareceu',
  };

  const paymentTypeLabels: Record<string, string> = {
    cash: 'Dinheiro',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    link: 'Link de Pagamento',
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminMenu />

      <div className="container mx-auto px-4 py-8 pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold">Agendamentos</h2>
          <div className="flex gap-2 w-full md:w-auto">
            <Link to="/admin/recurring-schedules" className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full gap-2 h-12 md:h-10 text-lg md:text-base border-primary/20 hover:bg-primary/10 hover:text-primary transition-all">
                <Clock className="w-5 h-5 md:w-4 h-4 text-primary" />
                <span className="md:hidden lg:inline">Horários Fixos</span>
                <span className="hidden md:inline lg:hidden">Fixos</span>
              </Button>
            </Link>
            <Button onClick={() => setShowBookingDialog(true)} className="flex-1 md:flex-none gap-2 h-12 md:h-10 text-lg md:text-base bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-5 h-5 md:w-4 h-4" />
              Marcar Horário
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-8 border-border">
          <h3 className="font-bold text-xl mb-4">Relatório de Pagamentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Data de Início</Label>
              <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP', { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date ? startOfDay(date) : undefined);
                      setIsStartDatePickerOpen(false);
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Data de Fim</Label>
              <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP', { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date ? startOfDay(date) : undefined);
                      setIsEndDatePickerOpen(false);
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="paymentTypeFilter">Tipo de Pagamento</Label>
              <Select value={paymentTypeFilter} onValueChange={(value: 'all' | 'cash' | 'credit_card' | 'debit_card' | 'link') => setPaymentTypeFilter(value)}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="link">Link de Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerateReport} className="w-full">Gerar Relatório</Button>
            </div>
          </div>

          {filteredPaymentsReport && (
            <div className="mt-4 space-y-2">
              <p className="text-lg font-semibold">Receita Total: {formatCurrency(filteredPaymentsReport.totalRevenue)}</p>
              <p>Dinheiro: {formatCurrency(filteredPaymentsReport.cash)}</p>
              <p>Cartão de Crédito: {formatCurrency(filteredPaymentsReport.credit_card)}</p>
              <p>Cartão de Débito: {formatCurrency(filteredPaymentsReport.debit_card)}</p>
              <p>Botão de Link (Mercado Pago): {formatCurrency(filteredPaymentsReport.link)}</p>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4 mb-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente pelo nome..."
              className="pl-10 h-11 md:h-10 border-border bg-card w-full"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="md:hidden">
            <Select value={activeTab} onValueChange={(val) => {
              setActiveTab(val);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="h-11 border-border bg-card w-full">
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({getCount('all')})</SelectItem>
                <SelectItem value="pending">Pendentes ({getCount('pending')})</SelectItem>
                <SelectItem value="today">Hoje ({getCount('today')})</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="history">Histórico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={(val) => {
          setActiveTab(val);
          setCurrentPage(1);
        }} className="w-full">
          <div className="hidden md:block mb-8">
            <div className="overflow-x-auto flex pb-2 -mx-4 px-4 md:pb-0 md:mx-0 md:px-0 no-scrollbar">
              <TabsList className="justify-start h-12 bg-card border border-border w-max min-w-full">
                <TabsTrigger value="all" className="gap-2 px-6">
                  Todos <Badge variant="secondary" className="bg-muted text-[10px]">{getCount('all')}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2 px-6">
                  Pendentes <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 text-[10px]">{getCount('pending')}</Badge>
                </TabsTrigger>
                <TabsTrigger value="today" className="gap-2 px-6">
                  Hoje <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-[10px]">{getCount('today')}</Badge>
                </TabsTrigger>
                <TabsTrigger value="confirmed" className="gap-2 px-6">
                  Confirmados
                </TabsTrigger>
                <TabsTrigger value="history" className="px-6">
                  Histórico
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {paginatedAppointments.length === 0 ? (
              <Card className="p-12 text-center border-border border-dashed bg-muted/20">
                <p className="text-muted-foreground">Nenhum agendamento encontrado nesta categoria ou com este nome.</p>
              </Card>
            ) : (
              paginatedAppointments.map((appointment) => (
                <Card key={appointment.id} className="p-4 md:p-6 border-border hover:border-primary/50 hover:bg-accent/5 transition-colors group">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg">{getClientName(appointment)}</h3>
                        <Badge className={cn(statusColors[appointment.status])}>{statusLabels[appointment.status]}</Badge>
                        {appointment.isRecurring && <Badge variant="outline" className="border-primary text-primary font-bold">FIXO</Badge>}
                        {appointment.isDelayed && <Badge variant="destructive" className="bg-red-500/20 text-red-700">Atrasado</Badge>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mt-2">
                        <p className="text-sm text-zinc-500 flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-primary/70" />
                          <span className="font-medium text-foreground">{getServiceName(appointment.serviceIds || appointment.serviceId)}</span>
                        </p>
                        <p className="text-sm text-zinc-500 flex items-center gap-2">
                          <UserCog className="w-4 h-4 text-primary/70" />
                          <span className="font-medium text-foreground">{getBarberName(appointment.barberId)}</span>
                        </p>
                        <p className="text-sm text-zinc-500 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-primary/70" />
                          <span>{new Date(appointment.date + 'T12:00:00').toLocaleDateString('pt-BR')} às <span className="font-bold text-foreground">{appointment.time}</span></span>
                        </p>
                        {appointment.paymentType && (
                          <p className="text-sm text-zinc-500 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600/70" />
                            <span>Pago via <span className="font-medium text-foreground uppercase">{paymentTypeLabels[appointment.paymentType] || appointment.paymentType}</span></span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 items-center md:items-end justify-between md:justify-start pt-4 md:pt-0 border-t md:border-t-0 border-border">
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                          <Button size="sm" onClick={() => handleStartService(appointment)} className="bg-blue-600 hover:bg-blue-700 h-9 px-4">
                            <Play className="w-4 h-4 mr-2" /> Iniciar
                          </Button>
                        )}
                        {appointment.status === 'in_progress' && (
                          <Button size="sm" onClick={() => { setCurrentAppointmentToComplete(appointment); setShowPaymentDialog(true); }} className="bg-green-600 hover:bg-green-700 h-9 px-4">
                            <DollarSign className="w-4 h-4 mr-2" /> Finalizar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const barber = barbers.find(b => b.id === appointment.barberId);
                            const service = services.find(s => s.id === (appointment.serviceIds?.[0] || appointment.serviceId));
                            if (barber && service) {
                              const link = getWhatsAppManualLink(appointment, barber, service);
                              if (link) window.open(link, '_blank');
                            }
                          }}
                          className="h-9 px-4 border-green-600/30 text-green-600 bg-transparent hover:bg-green-600 hover:text-white hover:border-green-600 transition-all font-medium"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" /> Enviar Whats
                        </Button>
                        {appointment.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateStatus(appointment.id, 'confirmed')} className="bg-green-600/10 text-green-600 hover:bg-green-600 hover:text-white border-green-600/20">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => updateStatus(appointment.id, 'cancelled')} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNoShow(appointment)}
                            className="h-9 px-4 border-orange-500/30 text-orange-600 bg-transparent hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all font-medium"
                          >
                            <UserCog className="w-4 h-4 mr-2" /> Não Compareceu
                          </Button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-primary/20 hover:text-primary transition-all" onClick={() => {
                          setAppointmentToEdit(appointment);
                          setEditedDate(startOfDay(parseISO(appointment.date)));
                          setEditedTime(appointment.time);
                          setEditedServiceId(appointment.serviceId);
                          setEditedBarberId(appointment.barberId);
                          setEditedPaymentType(appointment.paymentType || '');
                          setEditedExtraCharges(appointment.extraCharges || 0);
                          setEditedStatus(appointment.status);
                          setShowEditDialog(true);
                        }}>
                          <Clock className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-all" onClick={() => { setAppointmentToDelete(appointment); setShowDeleteDialog(true); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {totalPages > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                Mostrando <span className="font-medium">{filteredAppointments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAppointments.length)}</span> de <span className="font-medium">{filteredAppointments.length}</span> agendamentos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium px-2">
                  Página {currentPage} de {Math.max(1, totalPages)}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Tabs>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Finalizar Agendamento</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Finalizar agendamento de <span className="font-bold">{getClientName(currentAppointmentToComplete!)}</span>.
              </p>
              <div className="flex justify-between text-sm">
                <span>Valor do Serviço:</span>
                <span className="font-medium">{formatCurrency(currentAppointmentToComplete?.servicePrice || 0)}</span>
              </div>
              {(currentAppointmentToComplete?.amountPaid || 0) > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-bold">
                  <span>Sinal Pago via Gateway:</span>
                  <span>- {formatCurrency(currentAppointmentToComplete!.amountPaid!)}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="extraCharges">Encargos Extras (R$)</Label>
              <Input
                id="extraCharges"
                type="text"
                inputMode="decimal"
                className="h-11"
                placeholder="0.00"
                value={extraChargesInput === 0 ? '' : extraChargesInput}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setExtraChargesInput(val === '' ? 0 : parseFloat(val));
                  }
                }}
              />
            </div>

            <div>
              <Label htmlFor="discount">Desconto (R$)</Label>
              <Input
                id="discount"
                type="text"
                inputMode="decimal"
                className="h-11 border-primary/40 focus-visible:ring-primary/40"
                placeholder="0.00"
                value={discountInput === 0 ? '' : discountInput}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setDiscountInput(val === '' ? 0 : parseFloat(val));
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Total Geral</Label>
                <div className="h-11 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm font-bold text-zinc-500 flex items-center">
                  {formatCurrency(finalPrice)}
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase font-black text-primary">Saldo a Pagar</Label>
                <div className="h-11 w-full rounded-md border-2 border-primary bg-primary/5 px-3 py-2 text-lg font-black text-primary flex items-center shadow-sm">
                  {formatCurrency(Math.max(0, finalPrice - (currentAppointmentToComplete?.amountPaid || 0)))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="paymentType">Tipo de Pagamento</Label>
              <Select value={paymentType} onValueChange={(value: 'cash' | 'credit_card' | 'debit_card' | 'link') => setPaymentType(value)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Tipo de Pagamento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="link">Mercado Pago (Pix/Cartão)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seção de Pix Dinâmico removida para unificação de gateway */}

            {paymentType === 'link' && isMPConfigured() && (
              <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/20 flex flex-col items-center text-center shadow-inner">
                {!preferenceUrl ? (
                  <>
                    <CreditCard className="w-10 h-10 text-primary mb-2 opacity-80" />
                    <p className="text-base font-bold text-foreground">Mercado Pago (Pix/Cartão)</p>
                    <Button
                      onClick={handleGenerateLink}
                      disabled={isLoadingLink || finalPrice <= 0}
                      className="w-full h-11 bg-primary hover:bg-primary/90 mt-2"
                    >
                      {isLoadingLink ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                      Gerar Pagamento
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-background cursor-pointer hover:bg-accent/50 transition-colors p-4 rounded-xl mb-4 shadow-lg border-2 border-primary/20 w-full" onClick={() => window.open(preferenceUrl, '_blank')}>
                      <CreditCard className="w-10 h-10 text-primary mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-foreground truncate">{preferenceUrl}</p>
                    </div>
                    <p className="text-base font-bold text-foreground mb-1">Link Gerado!</p>
                    <p className="text-[10px] text-muted-foreground mb-4">Envie o link para o cliente ou abra agora.</p>

                    <div className="w-full space-y-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full h-10 gap-2"
                        onClick={() => window.open(preferenceUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" /> Abrir Checkout
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10 text-xs gap-2"
                        onClick={() => {
                          navigator.clipboard.writeText(preferenceUrl);
                          toast({ title: 'Link Copiado!', description: 'Link de pagamento copiado com sucesso.' });
                        }}
                      >
                        <Copy className="w-4 h-4" /> Copiar Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-[10px] text-zinc-500"
                        onClick={() => setPreferenceUrl(null)}
                      >
                        Alterar forma de pagamento
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {paymentType === 'link' && !isMPConfigured() && (
              <p className="text-xs text-amber-500 font-medium italic text-center mt-2">Gateways de pagamento não configurados no painel Admin.</p>
            )}
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-4 pb-4">
            <Button onClick={handleCompleteService} disabled={!paymentType || finalPrice < 0} className="w-full sm:w-auto h-11 md:h-10 order-first sm:order-last font-bold">Confirmar Pagamento</Button>
            <DialogClose asChild><Button type="button" variant="ghost" className="w-full sm:w-auto h-11 md:h-10">Cancelar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader><DialogTitle>Editar Agendamento</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Data</Label>
              <Popover open={isEditPickerOpen} onOpenChange={setIsEditPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11", !editedDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedDate ? format(editedDate, 'PPP', { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editedDate}
                    onSelect={(date) => {
                      if (date) {
                        setEditedDate(startOfDay(date));
                      }
                      setIsEditPickerOpen(false);
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="editTime">Hora</Label>
              <Select
                value={editedTime}
                onValueChange={setEditedTime}
                disabled={!editedDate || !editedBarberId}
              >
                <SelectTrigger className="h-11 w-full border-border bg-card">
                  <SelectValue placeholder={!editedDate || !editedBarberId ? "Selecione barbeiro e data" : "Selecione o horário"} />
                </SelectTrigger>
                <SelectContent>
                  {editFilteredTimes.length > 0 ? (
                    editFilteredTimes.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">Nenhum horário disponível</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editService">Serviço</Label>
              <Select value={editedServiceId} onValueChange={setEditedServiceId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editBarber">Barbeiro</Label>
              <Select value={editedBarberId} onValueChange={setEditedBarberId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Selecione um barbeiro" /></SelectTrigger>
                <SelectContent>
                  {barbers.map(barber => (
                    <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status do Agendamento</Label>
              <Select value={editedStatus} onValueChange={setEditedStatus}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="no_show">Não Compareceu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {appointmentToEdit?.status === 'completed' && (
              <>
                <div>
                  <Label htmlFor="editExtraCharges">Encargos Extras (R$)</Label>
                  <Input
                    id="editExtraCharges"
                    type="text"
                    inputMode="decimal"
                    className="h-11"
                    placeholder="0.00"
                    value={editedExtraCharges === 0 ? '' : editedExtraCharges}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setEditedExtraCharges(val === '' ? 0 : parseFloat(val));
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="editPaymentType">Tipo de Pagamento</Label>
                  <Select value={editedPaymentType} onValueChange={(value: 'cash' | 'credit_card' | 'debit_card' | 'link' | '') => setEditedPaymentType(value)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Tipo de Pagamento" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="link">Link de Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editFinalPrice">Preço Final</Label>
                  <div className="h-11 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm font-bold text-primary flex items-center">
                    {formatCurrency((appointmentToEdit?.servicePrice || 0) + editedExtraCharges)}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-4 pb-4">
            <Button onClick={handleUpdateAppointment} className="w-full sm:w-auto h-11 md:h-10 order-first sm:order-last font-bold">Salvar Alterações</Button>
            <DialogClose asChild><Button type="button" variant="ghost" className="w-full sm:w-auto h-11 md:h-10">Cancelar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[400px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir o agendamento de <span className="font-bold">{getClientName(appointmentToDelete!)}</span>?</p>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="destructive" onClick={handleDeleteAppointment} className="w-full sm:w-auto h-11 md:h-10 order-first sm:order-last">Excluir</Button>
            <DialogClose asChild><Button type="button" variant="ghost" className="w-full sm:w-auto h-11 md:h-10">Cancelar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md p-6 outline-none pb-28 md:pb-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Marcar Horário Manualmente</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="selectClient">Selecionar Cliente Existente (Opcional)</Label>
              <Popover open={isClientComboOpen} onOpenChange={setIsClientComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isClientComboOpen}
                    className="w-full justify-between h-11 border-primary/20 bg-primary/5 hover:bg-primary/10 font-normal"
                  >
                    {newBookingData.userId
                      ? users.find((u) => u.id === newBookingData.userId)?.fullName
                      : "Buscar cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Digite o nome do cliente..."
                      value={clientSearchQuery}
                      onValueChange={setClientSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="guest"
                          onSelect={() => {
                            setNewBookingData({ ...newBookingData, userId: null, clientName: '', clientPhone: '' });
                            setClientSearchQuery('');
                            setIsClientComboOpen(false);
                          }}
                          className="font-bold text-primary"
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              !newBookingData.userId ? "opacity-100" : "opacity-0"
                            )}
                          />
                          -- Novo Cliente / Convidado --
                        </CommandItem>
                        {users
                          .filter(u => u.role === 'client' &&
                            u.fullName.toLowerCase().includes(clientSearchQuery.toLowerCase()))
                          .sort((a, b) => a.fullName.localeCompare(b.fullName))
                          .slice(0, 10) // Limit to 10 results for performance
                          .map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.id}
                              onSelect={() => {
                                setNewBookingData({
                                  ...newBookingData,
                                  userId: client.id,
                                  clientName: client.fullName,
                                  clientPhone: client.phone || ''
                                });
                                setClientSearchQuery('');
                                setIsClientComboOpen(false);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newBookingData.userId === client.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {client.fullName}
                            </CommandItem>
                          ))}
                        {users.filter(u => u.role === 'client' &&
                          u.fullName.toLowerCase().includes(clientSearchQuery.toLowerCase())).length > 10 && (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground italic border-t mt-1">
                              Continue digitando para refinar a busca...
                            </div>
                          )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input
                  id="clientName"
                  placeholder="Ex: João Silva"
                  value={newBookingData.clientName}
                  onChange={(e) => setNewBookingData({ ...newBookingData, clientName: e.target.value })}
                  disabled={!!newBookingData.userId}
                  className={newBookingData.userId ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>

              <div>
                <Label htmlFor="clientPhone">Telefone</Label>
                <Input
                  id="clientPhone"
                  placeholder="Ex: 11999999999"
                  type="text"
                  inputMode="numeric"
                  value={newBookingData.clientPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setNewBookingData({ ...newBookingData, clientPhone: val });
                  }}
                  disabled={!!newBookingData.userId}
                  className={newBookingData.userId ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bookingBarber">Barbeiro</Label>
              <Select value={newBookingData.barberId} onValueChange={(val) => setNewBookingData({ ...newBookingData, barberId: val })}>
                <SelectTrigger className="focus:ring-primary/20 focus:ring-2 focus:ring-offset-0 border-border"><SelectValue placeholder="Selecione um barbeiro" /></SelectTrigger>
                <SelectContent>
                  {storage.getBarbers().map(barber => (
                    <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bookingService">Serviço</Label>
              <Select value={newBookingData.serviceId} onValueChange={(val) => setNewBookingData({ ...newBookingData, serviceId: val })}>
                <SelectTrigger className="focus:ring-primary/20 focus:ring-2 focus:ring-offset-0 border-border"><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
                <SelectContent>
                  {storage.getServices().map(service => (
                    <SelectItem key={service.id} value={service.id}>{service.name} - {formatCurrency(service.price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data</Label>
              <Popover open={isManualCalendarOpen} onOpenChange={setIsManualCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newBookingData.date && "text-muted-foreground")} disabled={!newBookingData.barberId}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newBookingData.date ? format(newBookingData.date, 'PPP', { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newBookingData.date}
                    onSelect={(date) => {
                      if (date) {
                        setNewBookingData({ ...newBookingData, date: startOfDay(date) });
                      }
                      setIsManualCalendarOpen(false);
                    }}
                    disabled={(calendarDate) => {
                      const today = startOfDay(new Date());
                      if (calendarDate < today) return true;

                      if (newBookingData.barberId) {
                        const selectedBarber = barbers.find(b => b.id === newBookingData.barberId);
                        if (selectedBarber && selectedBarber.availableDates && selectedBarber.availableDates.length > 0) {
                          const formattedCalendarDate = format(calendarDate, 'yyyy-MM-dd');
                          return !selectedBarber.availableDates.includes(formattedCalendarDate);
                        }
                      }
                      return false;
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="bookingTime">Hora</Label>
              <Select
                value={newBookingData.time}
                onValueChange={(val) => setNewBookingData({ ...newBookingData, time: val })}
                disabled={!newBookingData.date || !newBookingData.barberId}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder={!newBookingData.date || !newBookingData.barberId ? "Selecione barbeiro e data" : "Selecione o horário"} />
                </SelectTrigger>
                <SelectContent>
                  {manualFilteredTimes.length > 0 ? (
                    manualFilteredTimes.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">Nenhum horário disponível</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-4 pb-6">
            <Button onClick={handleCreateManualAppointment} className="w-full sm:w-auto h-11 md:h-10 order-first sm:order-last font-bold">Confirmar Agendamento</Button>
            <DialogClose asChild><Button type="button" variant="ghost" className="w-full sm:w-auto h-11 md:h-10">Cancelar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;
