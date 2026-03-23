import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage } from '@/lib/storage';
import { createPixPayment, createPreference, checkPaymentStatus, isMPConfigured, PixPaymentResponse } from '@/lib/mercadoPago';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';
import { Appointment, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { CalendarIcon, CreditCard, QrCode, ShieldCheck, CheckCircle2, Copy, Loader2, X } from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import LogoLoginImg from '../../img/LOGO LOGIN.png';

import { Palmtree } from 'lucide-react';

const GuestBooking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isHolidayMode = storage.getHolidayMode();
  const [date, setDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // New state for calendar popover
  const [formData, setFormData] = useState<{ name: string, email: string, phone: string, serviceIds: string[], barberId: string, time: string }>({ name: '', email: '', phone: '', serviceIds: [], barberId: '', time: '' });
  const [filteredTimes, setFilteredTimes] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const services = storage.getServices();
  const barbers = storage.getBarbers();
  const categories = Array.from(new Set(services.map(s => s.category || 'Outros')));
  const [lastBarberDate, setLastBarberDate] = useState({ barberId: '', date: '' });
 
  useEffect(() => {
    if (barbers.length === 1 && !formData.barberId) {
      setFormData(prev => ({ ...prev, barberId: barbers[0].id }));
    }
  }, [barbers, formData.barberId]);


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


  const totalValue = formData.serviceIds.reduce((sum, id) => {
    const s = services.find(srv => srv.id === id);
    return sum + (s?.price || 0);
  }, 0);
  const depositValue = totalValue / 2;

  const saveAppointment = async (isPaid: boolean = false, method: 'pix' | 'card' = 'pix', restoredForm?: typeof formData, restoredDate?: Date) => {
    setIsProcessing(true);
    const finalForm = restoredForm || formData;
    const finalDate = restoredDate || date;

    if (!finalDate) return;

    try {
      const totalServicePrice = finalForm.serviceIds.reduce((sum, id) => {
        const s = services.find(srv => srv.id === id);
        return sum + (s?.price || 0);
      }, 0);

      const newAppointment: Appointment = {
        id: Date.now().toString(),
        userId: null,
        guestName: finalForm.name,
        guestEmail: finalForm.email,
        guestPhone: finalForm.phone,
        barberId: finalForm.barberId,
        serviceId: finalForm.serviceIds[0],
        serviceIds: finalForm.serviceIds,
        date: format(finalDate, 'yyyy-MM-dd'),
        time: finalForm.time,
        status: isPaid ? 'confirmed' : 'pending',
        servicePrice: totalServicePrice,
        amountPaid: isPaid ? depositValue : 0,
        paymentType: method === 'pix' ? 'pix' : 'credit_card',
        createdAt: new Date().toISOString()
      };

      storage.saveAppointments([...storage.getAppointments(), newAppointment]);

      // Notificação WhatsApp para agendamentos pagos
      if (isPaid) {
        const barbers = storage.getBarbers();
        const selectedBarber = barbers.find(b => b.id === finalForm.barberId);
        const services = storage.getServices();
        const service = services.find(s => s.id === finalForm.serviceIds[0]);
        if (selectedBarber && service) {
          await sendWhatsAppConfirmation(newAppointment, selectedBarber, service);
        }
      }

      toast({
        title: 'Agendamento Confirmado!',
        description: isPaid 
          ? (method === 'pix' ? 'Pagamento via Pix aprovado. Seu horário está garantido!' : 'Pagamento via Cartão aprovado. Seu horário está garantido!')
          : 'Seu agendamento foi registrado e aguarda confirmação.',
      });
      
      setPaymentSuccess(true);
      setShowPaymentModal(false);
      navigate('/');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: 'Erro', description: 'Erro ao registrar agendamento.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const paymentId = urlParams.get('payment_id');

    console.log('🔍 Retorno MP (Guest):', { status, paymentId });

    if (status === 'approved' && paymentId) {
      console.log('✅ Pagamento aprovado (Guest)! Verificando dados pendentes...');
      const pendingJson = localStorage.getItem('pending_guest_booking');
      console.log('📦 Dados recuperados (Guest):', pendingJson);

      if (pendingJson) {
        try {
          const { formData: savedForm, date: savedDateStr } = JSON.parse(pendingJson);
          console.log('🔄 Restaurando e salvando agendamento (Guest)...', { savedForm, savedDateStr });
          saveAppointment(true, 'card', savedForm, new Date(savedDateStr));
          localStorage.removeItem('pending_guest_booking');
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('❌ Erro no retorno MP (Guest):', err);
        }
      } else {
        console.warn('⚠️ Nenhum agendamento pendente (Guest) encontrado no localStorage.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Removido useEffect de verificação de status manual do Pix interno

  const handleCheckout = async () => {
    setIsLoadingCheckout(true);
    setShowPaymentModal(true); // Mostrar modal de "Redirecionando"
    
    try {
      const selectedServices = formData.serviceIds.map(id => services.find(s => s.id === id)).filter(Boolean) as Service[];
      const description = `Sinal: ${selectedServices.map(s => s.name).join(', ')} - Tanaka Barbearia (Convidado)`;
      
      // Salvar dados pendentes para quando o Mercado Pago retornar
      localStorage.setItem('pending_guest_booking', JSON.stringify({ formData, date: date?.toISOString() }));
      
      const url = await createPreference(depositValue, description, formData.email, window.location.href);
      
      if (url) {
        setCheckoutUrl(url);
        // Redirecionamento automático
        window.location.href = url;
      } else {
        localStorage.removeItem('pending_guest_booking');
        toast({ 
          title: 'Erro no Checkout', 
          description: 'Não foi possível iniciar o pagamento. Tente novamente.', 
          variant: 'destructive' 
        });
        setShowPaymentModal(false);
      }
    } catch (error) {
      console.error('Erro ao gerar checkout:', error);
      setShowPaymentModal(false);
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !formData.time) {
      toast({ title: 'Erro', description: 'Selecione data e horário', variant: 'destructive' });
      return;
    }
    if (formData.serviceIds.length === 0) {
      toast({ title: 'Erro', description: 'Selecione um serviço', variant: 'destructive' });
      return;
    }
    
    // Iniciar fluxo direto do Mercado Pago (que contém Pix e Cartão)
    handleCheckout();
  };

  useEffect(() => {
    setCheckoutUrl(null);
  }, [formData.serviceIds, formData.barberId]);

  if (isHolidayMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6 border-border shadow-2xl">
          <div className="flex justify-center">
            <div className="p-6 bg-primary/10 rounded-full">
              <Palmtree className="w-20 h-20 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-bold">Agenda em Pausa</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Estamos em período de descanso ou manutenção. Novos agendamentos estão temporariamente bloqueados.
          </p>
          <div className="pt-6">
            <Link to="/">
              <Button size="lg" className="w-full h-14 rounded-xl font-bold text-lg">Voltar ao Site</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex justify-center mb-6">
            <img src={LogoLoginImg} alt="Logotipo da Barbearia" className="h-32 w-auto object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-center mb-4">Agendar como <span className="text-primary">Convidado</span></h1>
          <p className="text-center text-muted-foreground mb-8">Preencha os dados abaixo para fazer seu agendamento</p>
          <Card className="p-8 border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div><Label htmlFor="name">Nome Completo</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="email">E-mail (Opcional)</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div>
                  <Label htmlFor="phone">Telefone (apenas números)</Label>
                  <Input
                    id="phone"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, phone: value });
                    }}
                    placeholder="Ex: 11999999999"
                    required
                  />
                </div>
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
                  : `Pagar Sinal 50% (R$ ${depositValue.toFixed(2).replace('.', ',')})`
                }
              </Button>
            </form>
          </Card>
        </div>
      </div>
      <Footer />

      {/* Mercado Pago Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={(open) => !isProcessing && !paymentSuccess && setShowPaymentModal(open)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[450px] p-0 border-none bg-white dark:bg-zinc-950 rounded-[2rem] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden [&>button]:hidden">
          <div className="overflow-y-auto flex-grow scrollbar-none pb-6 relative">
            {/* Custom Close Button for visibility */}
            <div className="absolute top-4 right-4 z-[60]">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="p-2 bg-black/20 backdrop-blur-md hover:bg-black/30 text-white rounded-full transition-all shadow-lg border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

          {!paymentSuccess ? (
            <>
              <div className="bg-[#009EE3] p-8 text-white text-center relative overflow-hidden">
                <div className="sr-only">
                  <DialogTitle>Finalizar Reserva</DialogTitle>
                  <DialogDescription>Redirecionando para o pagamento seguro do Mercado Pago.</DialogDescription>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
                
                <div className="flex justify-center mb-4">
                  <img 
                    src={storage.getShopLogo()} 
                    alt="Logo" 
                    className="w-32 h-32 object-contain drop-shadow-2xl"
                  />
                </div>
                
                <h3 className="text-2xl font-black tracking-tight mb-1">Redirecionando...</h3>
                <p className="text-[#E0F2FE] font-medium opacity-90 text-sm">Garantindo seu horário com segurança</p>
                
                <div className="mt-8 flex justify-center">
                   <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              </div>

              <div className="p-8 space-y-6 text-center">
                <div className="space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                    <ShieldCheck className="w-12 h-12 text-[#009EE3] mx-auto mb-3" />
                    <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase mb-1">Checkout Seguro</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Você será levado ao Mercado Pago para escolher entre Cartão, Pix ou outros métodos.
                    </p>
                  </div>

                  {!checkoutUrl && (
                    <p className="text-[10px] text-[#009EE3] font-black uppercase tracking-widest animate-pulse">
                      Preparando gateway de pagamento...
                    </p>
                  )}

                  {checkoutUrl && (
                    <Button 
                      className="w-full h-14 bg-[#009EE3] hover:bg-[#0086C3] text-white rounded-2xl text-base font-black shadow-lg shadow-[#009EE3]/20 transition-all hover:scale-[1.02]"
                      onClick={() => window.location.href = checkoutUrl}
                    >
                      CLIQUE SE NÃO REDIRECIONAR
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Total Sinal</span>
                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">R$ {depositValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Restante Local</span>
                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">R$ {depositValue.toFixed(2).replace('.', ',')}</span>
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
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Seu pagamento de 50% foi identificado e o horário está garantido na agenda.</p>
              </div>

              <div className="pt-4 space-y-3">
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-green-500 animate-[progress_2s_linear_forwards]" />
                </div>
                <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest animate-pulse">Retornando ao painel em instantes...</p>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuestBooking;
