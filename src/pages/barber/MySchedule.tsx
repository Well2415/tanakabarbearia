import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { ArrowLeft, Check, X, Play, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Appointment } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isAfter } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MyAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentAppointmentToComplete, setCurrentAppointmentToComplete] = useState<Appointment | null>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link' | '' >('');
  const [extraChargesInput, setExtraChargesInput] = useState(0);
  const finalPrice = (currentAppointmentToComplete?.servicePrice || 0) + extraChargesInput;

  useEffect(() => {
    const user = storage.getCurrentUser();

    const isBarber = user?.role === 'barber';
    if (!user || !isBarber) {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
      navigate('/dashboard');
      return;
    }

    const allAppointments = storage.getAppointments();
    const barberProfile = storage.getBarbers().find(b => b.id === user.barberId);

    if (barberProfile) {
      const barberAppointments = allAppointments.filter(appt => appt.barberId === barberProfile.id);
      setAppointments(barberAppointments);
    } else {
      toast({ title: "Perfil não encontrado", description: "Não foi possível encontrar um perfil de barbeiro associado a este usuário.", variant: "destructive" });
      navigate('/dashboard');
    }
  }, [navigate, toast]);

  if (!user || user.role !== 'barber') return null;

  const users = storage.getUsers();
  const services = storage.getServices();

  const getClientName = (appointment: Appointment) => {
    if (!appointment) return 'Agendamento Inválido';
    if (appointment.guestName) return `${appointment.guestName} (Convidado)`;
    const client = users.find(u => u.id === appointment.userId);
    return client?.fullName || 'Cliente desconhecido';
  };
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'N/A';

  const updateAppointmentInStorage = (updatedAppointment: Appointment) => {
    const allAppointments = storage.getAppointments();
    const updatedAppointments = allAppointments.map(a =>
      a.id === updatedAppointment.id ? updatedAppointment : a
    );
    storage.saveAppointments(updatedAppointments);
    const barberProfile = storage.getBarbers().find(b => b.name === user.fullName);
    if (barberProfile) {
      const barberAppointments = updatedAppointments.filter(appt => appt.barberId === barberProfile.id);
      setAppointments(barberAppointments);
    }
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
      finalPrice: finalPrice,
      status: 'completed' as const,
    };
    updateAppointmentInStorage(updatedAppointment);

    if (currentAppointmentToComplete.userId) {
      const allUsers = storage.getUsers();
      const userToUpdate = allUsers.find(u => u.id === currentAppointmentToComplete.userId);
      if (userToUpdate) {
        const updatedUser = { ...userToUpdate };
        updatedUser.cutsCount = (updatedUser.cutsCount || 0) + 1;

        const service = services.find(s => s.id === currentAppointmentToComplete.serviceId);
        if (service && updatedUser.favoriteProducts && !updatedUser.favoriteProducts.includes(service.name)) {
          updatedUser.favoriteProducts = [...updatedUser.favoriteProducts, service.name];
        } else if (service && !updatedUser.favoriteProducts) {
          updatedUser.favoriteProducts = [service.name];
        }

        const finalUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        storage.saveUsers(finalUsers);
      }
    }

    setShowPaymentDialog(false);
    setCurrentAppointmentToComplete(null);
    setPaymentType('');
    setExtraChargesInput(0);
    toast({ title: 'Serviço Finalizado', description: `O corte de ${getClientName(currentAppointmentToComplete)} foi concluído e pago via ${paymentType}. Total: R$ ${finalPrice.toFixed(2)}.` });
  };

  const updateStatus = (id: string, status: 'confirmed' | 'cancelled') => {
    const appointmentToUpdate = appointments.find(a => a.id === id);
    if (!appointmentToUpdate) return;

    updateAppointmentInStorage({ ...appointmentToUpdate, status });
    toast({ title: 'Status atualizado', description: 'O agendamento foi atualizado com sucesso' });
  };

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    confirmed: 'bg-blue-500/10 text-blue-500',
    cancelled: 'bg-red-500/10 text-red-500',
    in_progress: 'bg-purple-500/10 text-purple-500',
    completed: 'bg-green-500/10 text-green-500',
  };

  const statusLabels = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    in_progress: 'Em Progresso',
    completed: 'Concluído',
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Voltar ao Dashboard</Button></Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Meus Agendamentos</h2>

        <div className="space-y-4">
          {appointments.length === 0 ? (
            <Card className="p-8 text-center border-border"><p className="text-muted-foreground">Nenhum agendamento encontrado para você.</p></Card>
          ) : (
            appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((appointment) => (
              <Card key={appointment.id} className="p-6 border-border">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{getClientName(appointment)}</h3>
                      <Badge className={statusColors[appointment.status]}>{statusLabels[appointment.status]}</Badge>
                      {appointment.isDelayed && <Badge variant="destructive" className="bg-red-500/20 text-red-700">Atrasado</Badge>}
                    </div>
                    <p className="text-muted-foreground"><span className="font-medium">Serviço:</span> {getServiceName(appointment.serviceId)}</p>
                    <p className="text-muted-foreground"><span className="font-medium">Data:</span> {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}</p>
                    {appointment.startTime && <p className="text-muted-foreground"><span className="font-medium">Início:</span> {appointment.startTime}</p>}
                    {appointment.endTime && <p className="text-muted-foreground"><span className="font-medium">Fim:</span> {appointment.endTime}</p>}
                    {appointment.paymentType && <p className="text-muted-foreground"><span className="font-medium">Pagamento:</span> {appointment.paymentType}</p>}
                    {appointment.status === 'completed' && appointment.finalPrice && <p className="text-muted-foreground"><span className="font-medium">Valor Pago:</span> R$ {appointment.finalPrice.toFixed(2)}</p>}
                  </div>
                  <div className="flex flex-col gap-2 items-start">
                    {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <Button size="sm" onClick={() => handleStartService(appointment)} className="bg-blue-600 hover:bg-blue-700"><Play className="w-4 h-4 mr-1" />Iniciar Corte</Button>
                    )}
                    {appointment.status === 'in_progress' && (
                      <Button size="sm" onClick={() => { setCurrentAppointmentToComplete(appointment); setShowPaymentDialog(true); }} className="bg-green-600 hover:bg-green-700"><DollarSign className="w-4 h-4 mr-1" />Finalizar</Button>
                    )}
                    {appointment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateStatus(appointment.id, 'confirmed')} className="bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-1" />Confirmar</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(appointment.id, 'cancelled')}><X className="w-4 h-4 mr-1" />Cancelar</Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Finalizar Agendamento</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="mb-2">
              Finalizar agendamento de <span className="font-bold">{getClientName(currentAppointmentToComplete!)}</span>.<br />
              Valor do Serviço: R$ {currentAppointmentToComplete?.servicePrice?.toFixed(2)}
            </p>
            
            <div>
              <Label htmlFor="extraCharges">Encargos Extras (R$)</Label>
              <Input id="extraCharges" type="number" step="0.01" value={extraChargesInput} onChange={(e) => setExtraChargesInput(parseFloat(e.target.value) || 0)} />
            </div>

            <div>
              <Label htmlFor="finalPrice">Preço Final (R$)</Label>
              <Input id="finalPrice" type="number" step="0.01" value={finalPrice} readOnly />
            </div>

            <div>
              <Label htmlFor="paymentType">Tipo de Pagamento</Label>
              <Select value={paymentType} onValueChange={(value: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link') => setPaymentType(value)}>
                <SelectTrigger><SelectValue placeholder="Tipo de Pagamento" /></SelectTrigger>
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
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleCompleteService} disabled={!paymentType || finalPrice < 0}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyAppointments;
