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
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const GuestBooking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // New state for calendar popover
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', serviceId: '', barberId: '', time: '' });
  const [filteredTimes, setFilteredTimes] = useState<string[]>([]);

  const services = storage.getServices();
  const barbers = storage.getBarbers();

  useEffect(() => {
    if (date && formData.barberId) {
      const selectedBarber = barbers.find(b => b.id === formData.barberId);
      if (!selectedBarber) return;

      const masterHours = selectedBarber.availableHours;
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const allAppointments = storage.getAppointments();
      const bookedTimes = allAppointments
        .filter(app => app.barberId === formData.barberId && app.date === formattedDate)
        .map(app => app.time);

      const available = masterHours.filter(hour => !bookedTimes.includes(hour));
      setFilteredTimes(available);
      setFormData(current => ({ ...current, time: '' })); // Move this line here
    } else {
      setFilteredTimes([]);
      setFormData(current => ({ ...current, time: '' })); // And here
    }
  }, [date, formData.barberId, barbers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !formData.time) {
      toast({ title: 'Erro', description: 'Por favor, selecione data e horário', variant: 'destructive' });
      return;
    }

    const appointments = storage.getAppointments();
    const newAppointment = {
      id: Date.now().toString(),
      userId: null, // Guest appointment
      guestName: formData.name,
      guestEmail: formData.email,
      guestPhone: formData.phone,
      barberId: formData.barberId,
      serviceId: formData.serviceId,
      date: format(date, 'yyyy-MM-dd'),
      time: formData.time,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    storage.saveAppointments([...appointments, newAppointment]);

    toast({ title: 'Agendamento realizado!', description: 'Você receberá uma confirmação em breve.' });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold text-center mb-4">Agendar como <span className="text-primary">Convidado</span></h1>
          <p className="text-center text-muted-foreground mb-8">Preencha os dados abaixo para fazer seu agendamento</p>
          <Card className="p-8 border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div><Label htmlFor="name">Nome Completo</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
                <div><Label htmlFor="phone">Telefone</Label><Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div>
              </div>
              <div>
                <Label>Serviço</Label>
                <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })} required>
                  <SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
                  <SelectContent>{services.map((service) => (<SelectItem key={service.id} value={service.id}>{service.name} - R$ {service.price}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Barbeiro</Label>
                <Select value={formData.barberId} onValueChange={(value) => setFormData({ ...formData, barberId: value })} required>
                  <SelectTrigger><SelectValue placeholder="Selecione o barbeiro" /></SelectTrigger>
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
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date ? startOfDay(date) : undefined} onSelect={(selectedDate) => { setDate(selectedDate); setIsCalendarOpen(false); }} disabled={(calendarDate) => {
                    const today = startOfDay(new Date()); // Use startOfDay
                    if (calendarDate < today) {
                      return true; // Disable past dates
                    }

                    if (formData.barberId) {
                      const selectedBarber = barbers.find(b => b.id === formData.barberId);
                      if (selectedBarber && selectedBarber.availableDates) {
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
                  <SelectTrigger><SelectValue placeholder={!date || !formData.barberId ? "Selecione o barbeiro e a data" : "Selecione o horário"} /></SelectTrigger>
                  <SelectContent>
                    {filteredTimes.length > 0 ? (
                      filteredTimes.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">Nenhum horário disponível.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" size="lg">Confirmar Agendamento</Button>
            </form>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GuestBooking;
