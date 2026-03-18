import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage } from '@/lib/storage';
import { generatePixPayload } from '@/lib/pix';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { User, Appointment, Service } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ShieldCheck, QrCode, CreditCard, CheckCircle2, Copy } from 'lucide-react';

const NewAppointment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [date, setDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // New state for calendar popover
  const [formData, setFormData] = useState<{ serviceIds: string[], barberId: string, time: string }>({ serviceIds: [], barberId: '', time: '' });
  const [filteredTimes, setFilteredTimes] = useState<string[]>([]);
  const [lastBarberDate, setLastBarberDate] = useState({ barberId: '', date: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  const services = storage.getServices();
  const barbers = storage.getBarbers();
  const categories = Array.from(new Set(services.map(s => s.category || 'Outros')));

  useEffect(() => {
    if (date && formData.barberId) {
      const selectedBarber = barbers.find(b => b.id === formData.barberId);
      if (!selectedBarber) return;

      const masterHours = selectedBarber.availableHours;
      const formattedDate = format(date, 'yyyy-MM-dd');

      const allAppointments = storage.getAppointments();
      const recurringSchedules = storage.getRecurringSchedules();
      const dayOfWeek = date.getDay();

      const bookedTimes = allAppointments
        .filter(app => app.barberId === formData.barberId && app.date === formattedDate && app.status !== 'cancelled')
        .map(app => app.time);

      // Add recurring schedules for this barber and day of week
      const recurringTimes = recurringSchedules
        .filter(s => s.barberId === formData.barberId && s.dayOfWeek === dayOfWeek && s.active)
        .map(s => s.time);

      const available = masterHours.filter(hour => !bookedTimes.includes(hour) && !recurringTimes.includes(hour));
      setFilteredTimes(available);

      // Only reset time if barber or date actually changed
      if (formData.barberId !== lastBarberDate.barberId || formattedDate !== lastBarberDate.date) {
        setFormData(current => ({ ...current, time: '' }));
        setLastBarberDate({ barberId: formData.barberId, date: formattedDate });
      }
    } else {
      setFilteredTimes([]);
      if (lastBarberDate.barberId !== '' || lastBarberDate.date !== '') {
        setFormData(current => ({ ...current, time: '' }));
        setLastBarberDate({ barberId: '', date: '' });
      }
    }
  }, [date, formData.barberId, barbers, lastBarberDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'Erro', description: 'Você precisa estar logado.', variant: 'destructive' });
      return;
    }

    if (!date || !formData.time) {
      toast({ title: 'Erro', description: 'Por favor, selecione data e horário', variant: 'destructive' });
      return;
    }

    const appointments = storage.getAppointments();
    const isFirstTime = (user.cutsCount || 0) === 0;

    if (isFirstTime) {
      setIsProcessing(true);
      // Simulate Payment Processing for first timer
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (formData.serviceIds.length === 0) {
      toast({ title: 'Erro', description: 'Por favor, selecione pelo menos um serviço', variant: 'destructive' });
      return;
    }

    const selectedServices = formData.serviceIds.map(id => services.find(s => s.id === id)).filter(Boolean) as Service[];
    const totalAmount = selectedServices.reduce((sum, s) => sum + s.price, 0);

    if (isFirstTime) {
      setShowPaymentModal(true);
    } else {
      await saveAppointment(false);
    }
  };

  const saveAppointment = async (paid: boolean) => {
    if (paid) setIsProcessing(true);
    
    const allAppointments = storage.getAppointments();
    const newAppointments: Appointment[] = formData.serviceIds.map((id, index) => {
      const service = services.find(s => s.id === id);
      return {
        id: Date.now().toString() + '-' + index,
        userId: user!.id,
        barberId: formData.barberId,
        serviceId: id,
        servicePrice: service?.price || 0,
        date: format(date!, 'yyyy-MM-dd'),
        time: formData.time,
        status: paid ? 'confirmed' : 'pending',
        createdAt: new Date().toISOString(),
      };
    });

    storage.saveAppointments([...allAppointments, ...newAppointments]);

    const allUsers = storage.getUsers();
    const updatedUsers = allUsers.map(u =>
      u.id === user!.id ? { ...u, loyaltyPoints: (u.loyaltyPoints || 0) + 1 } : u
    );
    storage.saveUsers(updatedUsers);

    if (paid) {
      setPaymentSuccess(true);
      setIsProcessing(false);
      
      setTimeout(() => {
        toast({
          title: 'Agendamento Confirmado!',
          description: `Sinal de 50% (R$ ${depositValue.toFixed(2).replace('.', ',')}) aprovado. Seu horário está garantido! +1 ponto de fidelidade.`,
        });
        navigate('/dashboard');
      }, 2000);
    } else {
      toast({
        title: 'Agendamento solicitado!',
        description: 'Seu agendamento está em análise. Você ganhará +1 ponto de fidelidade após a confirmação!',
      });
      navigate('/dashboard');
    }
  };

  const totalValue = formData.serviceIds.reduce((sum, id) => {
    const s = services.find(srv => srv.id === id);
    return sum + (s?.price || 0);
  }, 0);
  // Rule: isFirstTime = true if user has 0 COMPLETED appointments
  const userAppointments = storage.getAppointments().filter(app => app.userId === user?.id);
  const completedCount = userAppointments.filter(app => app.status === 'completed').length;
  const isNoShowEnforcement = (user.noShowCount || 0) >= 2;
  const isFirstTime = completedCount === 0 || isNoShowEnforcement;

  const depositValue = totalValue / 2;
  const pixPayload = (storage.getPixKey() && isFirstTime) ? generatePixPayload(storage.getPixKey(), depositValue) : '';
  const qrCodeUrl = pixPayload ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixPayload)}` : '';

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold text-center mb-4">Novo <span className="text-primary">Agendamento</span></h1>
          <p className="text-center text-muted-foreground mb-8">Olá, {user.fullName}. Preencha os dados para seu agendamento.</p>
          <Card className="p-8 border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div><Label>Nome Completo</Label><Input value={user.fullName} disabled /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>E-mail</Label><Input value={user.email || ''} disabled /></div>
                <div><Label>Telefone</Label><Input value={user.phone || ''} disabled /></div>
              </div>
              <div>
                <Label className="mb-3 block">Serviços</Label>
                <div className="space-y-6">
                  {categories.map(category => {
                    const categoryServices = services.filter(s => (s.category || 'Outros') === category);
                    if (categoryServices.length === 0) return null;
                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">{category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryServices.map((service) => (
                            <label key={service.id} className="flex items-start space-x-3 p-3 rounded-md border border-border bg-card/50 cursor-pointer hover:bg-accent/50 transition-colors">
                              <Checkbox 
                                checked={formData.serviceIds.includes(service.id)}
                                onCheckedChange={(checked) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    serviceIds: checked 
                                      ? [...prev.serviceIds, service.id]
                                      : prev.serviceIds.filter(id => id !== service.id)
                                  }));
                                }}
                              />
                              <div className="flex flex-col space-y-1 leading-none">
                                <span className="font-medium text-sm">{service.name}</span>
                                <span className="text-xs text-muted-foreground">R$ {service.price.toFixed(2).replace('.', ',')}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Barbeiro</Label>
                <Select value={formData.barberId} onValueChange={(value) => setFormData({ ...formData, barberId: value })} required>
                  <SelectTrigger className="focus:ring-primary/20 focus:ring-2 focus:ring-offset-0 border-border"><SelectValue placeholder="Selecione o barbeiro" /></SelectTrigger>
                  <SelectContent>{barbers.map((barber) => (<SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')} >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP', { locale: ptBR }) : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date ? startOfDay(date) : undefined}
                      onSelect={(selectedDate) => {
                        if (selectedDate) setDate(startOfDay(selectedDate));
                        setIsCalendarOpen(false);
                      }}
                      disabled={(calendarDate) => {
                        const today = startOfDay(new Date()); // Use startOfDay
                        if (calendarDate < today) {
                          return true; // Disable past dates
                        }

                        if (formData.barberId) {
                          const selectedBarber = barbers.find(b => b.id === formData.barberId);
                          if (selectedBarber && selectedBarber.availableDates && selectedBarber.availableDates.length > 0) {
                            const formattedCalendarDate = format(calendarDate, 'yyyy-MM-dd');
                            return !selectedBarber.availableDates.includes(formattedCalendarDate);
                          }
                        }
                        return false; // Enable by default if no barber selected or no availableDates defined
                      }} initialFocus locale={ptBR} /></PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Horário</Label>
                <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })} required disabled={!date || !formData.barberId}>
                  <SelectTrigger className="focus:ring-primary/20 focus:ring-2 focus:ring-offset-0 border-border"><SelectValue placeholder={!date || !formData.barberId ? "Selecione barbeiro e data" : "Selecione o horário"} /></SelectTrigger>
                  <SelectContent>
                    {filteredTimes.length > 0 ? (
                      filteredTimes.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">Nenhum horário disponível</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isProcessing || formData.serviceIds.length === 0}>
                {isProcessing
                  ? "Processando Pagamento..."
                  : (isFirstTime ? `Pagar Sinal 50% (R$ ${depositValue.toFixed(2).replace('.', ',')})` : `Confirmar Agendamento (R$ ${totalValue.toFixed(2).replace('.', ',')})`)
                }
              </Button>
            </form>
          </Card>
        </div>
      </div>
      <Footer />

      {/* Mercado Pago Payment Simulation Modal */}
      <Dialog open={showPaymentModal} onOpenChange={(open) => !isProcessing && !paymentSuccess && setShowPaymentModal(open)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[450px] p-0 border-none bg-white dark:bg-zinc-950 rounded-[2rem] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
          <div className="overflow-y-auto flex-grow scrollbar-none pb-6">
          {!paymentSuccess ? (
            <>
              <div className="bg-[#009EE3] p-8 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
                
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                    <QrCode className="w-10 h-10 text-white drop-shadow-sm" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-black tracking-tight mb-1">
                  {isNoShowEnforcement ? "Garantia de Horário" : "Checkout da 1ª Reserva"}
                </h3>
                <p className="text-[#E0F2FE] font-medium opacity-90 text-sm">
                  {isNoShowEnforcement 
                    ? `Olá, ${user.fullName}! Devido ao histórico, o sinal é obrigatório.` 
                    : `Olá, ${user.fullName}! Pague 50% para concluir seu 1º serviço`}
                </p>
                
                <div className="mt-6 inline-block bg-white dark:bg-zinc-900 px-6 py-3 rounded-[1.5rem] shadow-xl ring-1 ring-black/5">
                  <span className="text-[10px] uppercase font-black text-zinc-500 block tracking-widest mb-0.5">Valor do Sinal</span>
                  <span className="text-3xl font-black text-[#009EE3]">R$ {depositValue.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Meios de Pagamento */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase text-zinc-600 dark:text-zinc-400 ml-1 tracking-widest">Pagar com</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-3xl border-2 border-[#009EE3] bg-white dark:bg-zinc-900 flex flex-col items-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-95">
                      <div className="p-2 bg-[#009EE3]/10 rounded-xl">
                        <QrCode className="w-5 h-5 text-[#009EE3]" />
                      </div>
                      <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-100 uppercase">PIX</span>
                    </div>
                    <div className="p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center gap-2 cursor-not-allowed opacity-60">
                      <CreditCard className="w-5 h-5 text-zinc-400" />
                      <span className="text-[11px] font-bold text-zinc-400 uppercase">Cartão</span>
                    </div>
                  </div>
                </div>

                {/* Área do QR Code */}
                <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 text-center space-y-5 shadow-inner">
                  <div className="flex flex-col items-center gap-4">
                    {qrCodeUrl ? (
                      <div className="bg-white p-3 rounded-[2rem] shadow-2xl ring-1 ring-black/5 relative group">
                        <img src={qrCodeUrl} alt="QR Code PIX" className="w-36 h-36" />
                        <div className="absolute inset-0 bg-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]">
                           <span className="bg-zinc-900 text-white text-[10px] px-3 py-1.5 rounded-full font-bold">ESCANEIE O PIX</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-36 h-36 bg-zinc-200 dark:bg-zinc-800 rounded-[2rem] flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-zinc-400 animate-pulse" />
                      </div>
                    )}

                    {pixPayload ? (
                      <div className="w-full space-y-3">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-black uppercase text-zinc-600 tracking-wider">PIX Copia e Cola</span>
                          <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 p-2 pl-4 rounded-2xl w-full justify-between shadow-sm focus-within:border-[#009EE3] transition-colors">
                            <code className="text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 truncate pr-2">{pixPayload}</code>
                            <Button 
                              variant="secondary" 
                              size="icon" 
                              className="h-10 w-10 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-700 hover:bg-[#009EE3] hover:text-white transition-all shadow-sm"
                              onClick={() => {
                                navigator.clipboard.writeText(pixPayload);
                                toast({ title: 'Copiado!', description: 'Código Pix copiado.' });
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 font-bold bg-amber-50 p-3 rounded-2xl border border-amber-100 w-full italic">Chave PIX não configurada.</p>
                    )}
                  </div>
                </div>

                {/* Resumo de Valores Moderno */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Total do Serviço</span>
                    <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">R$ {totalValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="bg-[#009EE3]/5 p-4 rounded-2xl border border-[#009EE3]/20 shadow-sm">
                    <span className="text-[10px] font-bold text-[#009EE3] uppercase block mb-1">Restante no Local</span>
                    <span className="text-sm font-bold text-[#009EE3]">R$ {depositValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => saveAppointment(true)}
                    disabled={isProcessing}
                    className="w-full h-16 bg-[#009EE3] hover:bg-[#0086C3] text-white rounded-[1.5rem] text-lg font-black shadow-xl shadow-[#009EE3]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-3">
                         <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                         <span>Processando Pix...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6" />
                        <span>JÁ PAGUEI O PIX</span>
                      </div>
                    )}
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    Transação segura via Mercado Pago
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative mx-auto w-32 h-32">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping duration-[2s]" />
                <div className="relative w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40">
                  <CheckCircle2 className="w-16 h-16 text-white animate-in zoom-in-50 duration-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Sucesso Total!</h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Seu primeiro pagamento foi aprovado e seu horário está garantido.</p>
              </div>

              <div className="pt-4 space-y-3">
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-green-500 animate-[progress_2s_linear_forwards]" />
                </div>
                <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest animate-pulse">Retornando ao painel...</p>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewAppointment;
