import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';
import { ArrowLeft, Check, X, Play, DollarSign, Clock, Plus, Trash2, Scissors, UserCog, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Appointment } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isAfter, isBefore, startOfDay, isSameDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { formatCurrency, cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';

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
  const finalPrice = (currentAppointmentToComplete?.servicePrice || 0) + extraChargesInput;

  const [startDate, setStartDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link' | ''>('all');
  const [filteredPaymentsReport, setFilteredPaymentsReport] = useState<{
    totalRevenue: number;
    cash: number;
    credit_card: number;
    debit_card: number;
    pix: number;
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

  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [newBookingData, setNewBookingData] = useState({
    clientName: '',
    clientPhone: '',
    serviceId: '',
    barberId: '',
    date: startOfDay(new Date()),
    time: ''
  });
  const [manualFilteredTimes, setManualFilteredTimes] = useState<string[]>([]);
  const [editFilteredTimes, setEditFilteredTimes] = useState<string[]>([]);
  const [isManualCalendarOpen, setIsManualCalendarOpen] = useState(false);
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [isEditPickerOpen, setIsEditPickerOpen] = useState(false);
  const [lastBarberDate, setLastBarberDate] = useState({ barberId: '', date: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (newBookingData.date && newBookingData.barberId) {
      const selectedBarber = barbers.find(b => b.id === newBookingData.barberId);
      if (!selectedBarber) return;

      const masterHours = selectedBarber.availableHours || [];
      const formattedDate = format(newBookingData.date, 'yyyy-MM-dd');

      const bookedTimes = appointments
        .filter(app => app.barberId === newBookingData.barberId && app.date === formattedDate && app.status !== 'cancelled' && app.status !== 'no_show')
        .map(app => app.time);

      const recurringSchedules = storage.getRecurringSchedules();
      const dayOfWeek = newBookingData.date.getDay();
      const recurringTimes = recurringSchedules
        .filter(s => s.barberId === newBookingData.barberId && s.dayOfWeek === dayOfWeek && s.active)
        .map(s => s.time);

      const available = masterHours.filter(hour => !bookedTimes.includes(hour) && !recurringTimes.includes(hour));
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

      const masterHours = selectedBarber.availableHours || [];
      const formattedDate = format(editedDate, 'yyyy-MM-dd');

      const bookedTimes = appointments
        .filter(app => app.barberId === editedBarberId && app.date === formattedDate && app.status !== 'cancelled' && app.status !== 'no_show' && app.id !== appointmentToEdit?.id)
        .map(app => app.time);

      const recurringSchedules = storage.getRecurringSchedules();
      const dayOfWeek = editedDate.getDay();
      const recurringTimes = recurringSchedules
        .filter(s => s.barberId === editedBarberId && s.dayOfWeek === dayOfWeek && s.active)
        .map(s => s.time);

      const available = masterHours.filter(hour => !bookedTimes.includes(hour) && !recurringTimes.includes(hour));

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
    const { clientName, clientPhone, serviceId, barberId, date, time } = newBookingData;
    if (!clientName || !serviceId || !barberId || !date || !time) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    const service = storage.getServices().find(s => s.id === serviceId);
    const barber = storage.getBarbers().find(b => b.id === barberId);

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      userId: null,
      guestName: clientName,
      guestPhone: clientPhone,
      serviceId,
      servicePrice: service?.price || 0,
      barberId,
      date: format(date, 'yyyy-MM-dd'),
      time,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    const updated = [...appointments, newAppointment];
    storage.saveAppointments(updated);
    setAppointments(updated);

    // Send WhatsApp notification
    if (clientPhone && barber && service) {
      await sendWhatsAppConfirmation(newAppointment, barber, service);
    }

    setShowBookingDialog(false);
    setNewBookingData({ clientName: '', clientPhone: '', serviceId: '', barberId: '', date: startOfDay(new Date()), time: '' });
    toast({ title: "Agendamento Realizado", description: `Agendamento para ${clientName} marcado com sucesso.` });
  };

  const handleDeleteAppointment = () => {
    if (appointmentToDelete) {
      const updatedAppointments = appointments.filter(appt => appt.id !== appointmentToDelete.id);
      storage.saveAppointments(updatedAppointments);
      setAppointments(updatedAppointments);
      toast({ title: "Agendamento Excluído", description: "O agendamento foi removido com sucesso." });
      setShowDeleteDialog(false);
      setAppointmentToDelete(null);
    }
  };

  const handleUpdateAppointment = () => {
    if (appointmentToEdit) {
      const updatedAppointment = {
        ...appointmentToEdit,
        date: editedDate ? format(editedDate, 'yyyy-MM-dd') : appointmentToEdit.date,
        time: editedTime,
        serviceId: editedServiceId,
        barberId: editedBarberId,
        paymentType: editedPaymentType || undefined,
        extraCharges: editedExtraCharges,
        finalPrice: (appointmentToEdit.servicePrice || 0) + editedExtraCharges,
      };
      updateAppointmentInStorage(updatedAppointment);
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
      const apptDate = parseISO(appt.date);
      if (start && isBefore(apptDate, start)) return false;
      if (end && isAfter(apptDate, end)) return false;
      if (paymentTypeFilter !== 'all' && appt.paymentType !== paymentTypeFilter) return false;
      return true;
    });

    let totalRevenue = 0;
    let cash = 0;
    let credit_card = 0;
    let debit_card = 0;
    let pix = 0;
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
          case 'pix':
            pix += appt.finalPrice;
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
      pix,
      link,
    });
  };

  // Função para gerar agendamentos de teste
  const generateTestAppointments = (count: number = 5) => {
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
      const paymentTypeOptions: Appointment['paymentType'][] = ['cash', 'credit_card', 'debit_card', 'pix', 'link'];
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

    storage.saveAppointments([...existingAppointments, ...newAppointments]);
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





  if (!user || !(user.role === 'admin' || user.role === 'barber')) return null;

  const getClientName = (appointment: Appointment) => {
    if (!appointment) return 'Agendamento Inválido';
    if (appointment.guestName) return `${appointment.guestName} (Convidado)`;
    const client = users.find(u => u.id === appointment.userId);
    return client?.fullName || 'Cliente desconhecido';
  };
  const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'N/A';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'N/A';

  const filteredAppointments = appointments
    .filter(appt => {
      // Search filter
      const clientName = (appt.guestName || users.find(u => u.id === appt.userId)?.fullName || '').toLowerCase();
      const matchesSearch = clientName.includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Tab filter
      const today = new Date();
      switch (activeTab) {
        case 'pending':
          return appt.status === 'pending';
        case 'confirmed':
          return appt.status === 'confirmed';
        case 'today':
          return isSameDay(parseISO(appt.date), today);
        case 'history':
          return appt.status === 'completed' || appt.status === 'cancelled';
        case 'all':
        default:
          return true;
      }
    })
    .sort((a, b) => {
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
        return appointments.filter(a => isSameDay(parseISO(a.date), today)).length;
      case 'history':
        return appointments.filter(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'no_show').length;
      default:
        return appointments.length;
    }
  };

  const updateAppointmentInStorage = (updatedAppointment: Appointment) => {
    const updatedAppointments = appointments.map(a =>
      a.id === updatedAppointment.id ? updatedAppointment : a
    );
    storage.saveAppointments(updatedAppointments);
    setAppointments(updatedAppointments);
  };

  const handleStartService = (appointment: Appointment) => {
    const now = new Date();
    const scheduledDateTime = parseISO(`${appointment.date}T${appointment.time}:00`);
    const isDelayed = isAfter(now, scheduledDateTime);

    const updatedAppointment = {
      ...appointment,
      startTime: format(now, 'HH:mm'),
      isDelayed: isDelayed,
      status: 'in_progress' as const,
    };
    updateAppointmentInStorage(updatedAppointment);
    toast({ title: 'Serviço Iniciado', description: `O corte de ${getClientName(appointment)} foi iniciado.` });
  };

  const handleCompleteService = () => {
    if (!currentAppointmentToComplete || !paymentType) return;

    const now = new Date();
    const updatedAppointment = {
      ...currentAppointmentToComplete,
      endTime: format(now, 'HH:mm'),
      paymentType: paymentType,
      extraCharges: extraChargesInput,
      finalPrice: finalPrice, // Usar o finalPrice calculado
      status: 'completed' as const,
    };
    updateAppointmentInStorage(updatedAppointment);

    // Update user's cutsCount and stylePreferences
    if (currentAppointmentToComplete.userId) {
      const allUsers = storage.getUsers();
      const userToUpdate = allUsers.find(u => u.id === currentAppointmentToComplete.userId);
      if (userToUpdate) {
        const updatedUser = { ...userToUpdate };
        updatedUser.cutsCount = (updatedUser.cutsCount || 0) + 1;

        const service = services.find(s => s.id === currentAppointmentToComplete.serviceId);
        if (service && updatedUser.stylePreferences && !updatedUser.stylePreferences.includes(service.name)) {
          updatedUser.stylePreferences = [...updatedUser.stylePreferences, service.name];
        } else if (service && !updatedUser.stylePreferences) {
          updatedUser.stylePreferences = [service.name];
        }

        const finalUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        storage.saveUsers(finalUsers);
      }
    }

    setShowPaymentDialog(false);
    setCurrentAppointmentToComplete(null);
    setPaymentType('');
    setExtraChargesInput(0);
    toast({ title: 'Serviço Finalizado', description: `O corte de ${getClientName(currentAppointmentToComplete)} foi concluído e pago via ${paymentType}. Total: ${formatCurrency(finalPrice)}.` });
  };

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    const updatedAppointment = appointments.find(a => a.id === id);
    if (!updatedAppointment) return;

    updateAppointmentInStorage({ ...updatedAppointment, status });
    toast({ title: 'Status atualizado', description: `O agendamento foi ${status === 'confirmed' ? 'confirmado' : 'cancelado'} com sucesso.` });
  };

  const handleNoShow = (appointment: Appointment) => {
    if (appointment.userId) {
      const allUsers = storage.getUsers();
      const userToUpdate = allUsers.find(u => u.id === appointment.userId);
      if (userToUpdate) {
        const updatedUser = { 
          ...userToUpdate, 
          noShowCount: (userToUpdate.noShowCount || 0) + 1 
        };
        const finalUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        storage.saveUsers(finalUsers);
      }
    }
    
    updateAppointmentInStorage({ ...appointment, status: 'no_show' });
    toast({ 
      title: 'Não Comparecimento', 
      description: `O cliente foi sinalizado por não comparecer ao horário marcado.`,
      variant: "destructive"
    });
  };

  const handleManualWhatsApp = async (appointment: Appointment) => {
    const barber = barbers.find(b => b.id === appointment.barberId);
    const service = services.find(s => s.id === appointment.serviceId);
    if (barber && service) {
      toast({ title: 'Enviando WhatsApp...', description: 'Tentando enviar mensagem manual via API.' });
      await sendWhatsAppConfirmation(appointment, barber, service);
      toast({ title: 'WhatsApp Enviado', description: 'Mensagem enviada com sucesso para o cliente.' });
    }
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
    pix: 'Pix',
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
              <Select value={paymentTypeFilter} onValueChange={(value: 'all' | 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link') => setPaymentTypeFilter(value)}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
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
              <p>Pix: {formatCurrency(filteredPaymentsReport.pix)}</p>
              <p>Link de Pagamento: {formatCurrency(filteredPaymentsReport.link)}</p>
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
                        {appointment.isDelayed && <Badge variant="destructive" className="bg-red-500/20 text-red-700">Atrasado</Badge>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mt-2">
                        <p className="text-sm text-zinc-500 flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-primary/70" />
                          <span className="font-medium text-foreground">{getServiceName(appointment.serviceId)}</span>
                        </p>
                        <p className="text-sm text-zinc-500 flex items-center gap-2">
                          <UserCog className="w-4 h-4 text-primary/70" />
                          <span className="font-medium text-foreground">{getBarberName(appointment.barberId)}</span>
                        </p>
                        <p className="text-sm text-zinc-500 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-primary/70" />
                          <span>{new Date(appointment.date).toLocaleDateString('pt-BR')} às <span className="font-bold text-foreground">{appointment.time}</span></span>
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
                        {appointment.status === 'confirmed' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleManualWhatsApp(appointment)} 
                            className="h-9 px-4 border-green-600/30 text-green-600 bg-transparent hover:bg-green-600 hover:text-white hover:border-green-600 transition-all font-medium"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" /> Reenviar Whats
                          </Button>
                        )}
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
            <p className="text-sm text-muted-foreground">
              Finalizar agendamento de <span className="font-bold">{getClientName(currentAppointmentToComplete!)}</span>.<br />
              Valor do Serviço: {formatCurrency(currentAppointmentToComplete?.servicePrice || 0)}
            </p>

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
              <Label>Preço Final</Label>
              <div className="h-11 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm font-bold text-primary flex items-center">
                {formatCurrency(finalPrice)}
              </div>
            </div>

            <div>
              <Label htmlFor="paymentType">Tipo de Pagamento</Label>
              <Select value={paymentType} onValueChange={(value: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link') => setPaymentType(value)}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Tipo de Pagamento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="link">Link de Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <Select value={editedPaymentType} onValueChange={(value: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link' | '') => setEditedPaymentType(value)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Tipo de Pagamento" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">Pix</SelectItem>
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
        <DialogContent className="max-w-[95vw] sm:max-w-[400px] p-4 sm:p-6">
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
        <DialogContent className="max-w-[95vw] sm:max-w-md p-6 outline-none pb-28 md:pb-6">
          <DialogHeader>
            <DialogTitle>Marcar Horário Manualmente</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                placeholder="Ex: João Silva (Sem Internet)"
                value={newBookingData.clientName}
                onChange={(e) => setNewBookingData({ ...newBookingData, clientName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="clientPhone">Telefone do Cliente (WhatsApp)</Label>
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
              />
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
