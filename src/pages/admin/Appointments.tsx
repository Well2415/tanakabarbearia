import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { ArrowLeft, Check, X, Play, DollarSign, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Appointment } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Appointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentAppointmentToComplete, setCurrentAppointmentToComplete] = useState<Appointment | null>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link' | '' >('');
  const [extraChargesInput, setExtraChargesInput] = useState(0);
  const finalPrice = (currentAppointmentToComplete?.servicePrice || 0) + extraChargesInput;

  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link' | '' >('all');
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
  const [editedDate, setEditedDate] = useState('');
  const [editedTime, setEditedTime] = useState('');
  const [editedServiceId, setEditedServiceId] = useState('');
  const [editedBarberId, setEditedBarberId] = useState('');
  const [editedPaymentType, setEditedPaymentType] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link' | '' >('');
  const [editedExtraCharges, setEditedExtraCharges] = useState(0);

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
        date: editedDate,
        time: editedTime,
        serviceId: editedServiceId,
        barberId: editedBarberId,
        paymentType: editedPaymentType,
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
    const start = startDate ? parseISO(startDate) : null;
    const end = endDate ? parseISO(endDate) : null;

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

  const users = storage.getUsers();
  const barbers = storage.getBarbers();
  const services = storage.getServices();

  const getClientName = (appointment: Appointment) => {
    if (!appointment) return 'Agendamento Inválido';
    if (appointment.guestName) return `${appointment.guestName} (Convidado)`;
    const client = users.find(u => u.id === appointment.userId);
    return client?.fullName || 'Cliente desconhecido';
  };
  const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'N/A';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'N/A';

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

    // Update user's cutsCount and favoriteProducts
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
    const updatedAppointment = appointments.find(a => a.id === id);
    if (!updatedAppointment) return;

    updateAppointmentInStorage({ ...updatedAppointment, status });
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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Voltar ao Dashboard</Button></Link>
          <Button variant="outline" size="sm" onClick={() => generateTestAppointments(5)}>Gerar 5 Agendamentos de Teste</Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Agendamentos</h2>

        <Card className="p-6 mb-8 border-border">
          <h3 className="font-bold text-xl mb-4">Relatório de Pagamentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="[&::-webkit-calendar-picker-indicator]:invert text-white" />
            </div>
            <div>
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="[&::-webkit-calendar-picker-indicator]:invert text-white" />
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
              <p className="text-lg font-semibold">Receita Total: R$ {filteredPaymentsReport.totalRevenue.toFixed(2)}</p>
              <p>Dinheiro: R$ {filteredPaymentsReport.cash.toFixed(2)}</p>
              <p>Cartão de Crédito: R$ {filteredPaymentsReport.credit_card.toFixed(2)}</p>
              <p>Cartão de Débito: R$ {filteredPaymentsReport.debit_card.toFixed(2)}</p>
              <p>Pix: R$ {filteredPaymentsReport.pix.toFixed(2)}</p>
              <p>Link de Pagamento: R$ {filteredPaymentsReport.link.toFixed(2)}</p>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {appointments.length === 0 ? (
            <Card className="p-8 text-center border-border"><p className="text-muted-foreground">Nenhum agendamento encontrado</p></Card>
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
                    <p className="text-muted-foreground"><span className="font-medium">Barbeiro:</span> {getBarberName(appointment.barberId)}</p>
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
                    {user?.role === 'admin' && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => { 
                          setAppointmentToEdit(appointment);
                          setEditedDate(appointment.date);
                          setEditedTime(appointment.time);
                          setEditedServiceId(appointment.serviceId);
                          setEditedBarberId(appointment.barberId);
                          setEditedPaymentType(appointment.paymentType || '');
                          setEditedExtraCharges(appointment.extraCharges || 0);
                          setShowEditDialog(true);
                        }}>Editar</Button>
                        <Button size="sm" variant="destructive" onClick={() => { setAppointmentToDelete(appointment); setShowDeleteDialog(true); }}>Excluir</Button>
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

      {/* Edit Appointment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Agendamento</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="editDate">Data</Label>
              <Input id="editDate" type="date" value={editedDate} onChange={(e) => setEditedDate(e.target.value)} className="[&::-webkit-calendar-picker-indicator]:invert text-white" />
            </div>
            <div>
              <Label htmlFor="editTime">Hora</Label>
              <Input id="editTime" type="time" value={editedTime} onChange={(e) => setEditedTime(e.target.value)} className="[&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            <div>
              <Label htmlFor="editService">Serviço</Label>
              <Select value={editedServiceId} onValueChange={setEditedServiceId}>
                <SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="Selecione um barbeiro" /></SelectTrigger>
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
                  <Input id="editExtraCharges" type="number" step="0.01" value={editedExtraCharges} onChange={(e) => setEditedExtraCharges(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label htmlFor="editPaymentType">Tipo de Pagamento</Label>
                  <Select value={editedPaymentType} onValueChange={(value: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'link' | '' ) => setEditedPaymentType(value)}>
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
                <div>
                  <Label htmlFor="editFinalPrice">Preço Final (R$)</Label>
                  <Input id="editFinalPrice" type="number" step="0.01" value={((appointmentToEdit?.servicePrice || 0) + editedExtraCharges).toFixed(2)} readOnly />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateAppointment}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir o agendamento de <span className="font-bold">{getClientName(appointmentToDelete!)}</span>?</p>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteAppointment}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;
