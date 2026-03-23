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
import { createPreference, isMPConfigured } from '@/lib/mercadoPago';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';
import { Appointment, Service } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Palmtree } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import LogoLoginImg from '../../img/LOGO LOGIN.png';

const GuestBooking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isHolidayMode = storage.getHolidayMode();
  const [date, setDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', serviceIds: [] as string[], barberId: '', time: '' });
  const [filteredTimes, setFilteredTimes] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

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

      const recurringTimes = recurringSchedules
        .filter(s => s.barberId === formData.barberId && s.dayOfWeek === dayOfWeek && s.active)
        .map(s => s.time);

      const available = masterHours.filter(hour => !bookedTimes.includes(hour) && !recurringTimes.includes(hour));
      setFilteredTimes(available);

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

      if (isPaid) {
        const selectedBarber = barbers.find(b => b.id === finalForm.barberId);
        const service = services.find(s => s.id === finalForm.serviceIds[0]);
        if (selectedBarber && service) {
          await sendWhatsAppConfirmation(newAppointment, selectedBarber, service);
        }
      }

      toast({
        title: 'Agendamento Confirmado!',
        description: isPaid 
          ? 'Pagamento aprovado. Seu horário está garantido!' 
          : 'Seu agendamento foi registrado e aguarda confirmação.',
      });
      
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

    if (status === 'approved' && paymentId) {
      const pendingJson = localStorage.getItem('pending_guest_booking');
      if (pendingJson) {
        try {
          const { formData: savedForm, date: savedDateStr } = JSON.parse(pendingJson);
          saveAppointment(true, 'card', savedForm, new Date(savedDateStr));
          localStorage.removeItem('pending_guest_booking');
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('❌ Erro no retorno MP:', err);
        }
      }
    }
  }, []);

  const handleCheckout = async () => {
    setIsLoadingCheckout(true);
    try {
      const selectedServices = formData.serviceIds.map(id => services.find(s => s.id === id)).filter(Boolean) as Service[];
      const description = `Sinal: ${selectedServices.map(s => s.name).join(', ')} - Barbearia (Convidado)`;
      localStorage.setItem('pending_guest_booking', JSON.stringify({ formData, date: date?.toISOString() }));
      const url = await createPreference(depositValue, description, formData.email, window.location.href);
      if (url) {
        window.location.href = url;
      } else {
        localStorage.removeItem('pending_guest_booking');
        toast({ title: 'Erro no Checkout', description: 'Não foi possível iniciar o pagamento. Tente novamente.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Erro ao gerar checkout:', error);
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
    handleCheckout();
  };

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
                        const today = startOfDay(new Date());
                        if (calendarDate < today) return true;
                        if (formData.barberId) {
                          const selectedBarber = barbers.find(b => b.id === formData.barberId);
                          if (selectedBarber && selectedBarber.availableDates && selectedBarber.availableDates.length > 0) {
                            const formattedCalendarDate = format(calendarDate, 'yyyy-MM-dd');
                            return !selectedBarber.availableDates.includes(formattedCalendarDate);
                          }
                        }
                        return false;
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
              <Button type="submit" className="w-full" size="lg" disabled={isProcessing || isLoadingCheckout || formData.serviceIds.length === 0}>
                {isProcessing || isLoadingCheckout
                  ? "Redirecionando..."
                  : `Pagar Sinal 50% (R$ ${depositValue.toFixed(2).replace('.', ',')})`
                }
              </Button>
            </form>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GuestBooking;
