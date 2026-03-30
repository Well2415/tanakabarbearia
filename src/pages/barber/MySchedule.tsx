import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { ArrowLeft, Check, X, Play, DollarSign, QrCode, Copy, Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Appointment } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isAfter } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPixPayment, createPreference, checkPaymentStatus, isMPConfigured, PixPaymentResponse } from '@/lib/mercadoPago';
import { AdminMenu } from '@/components/admin/AdminMenu';

const MyAppointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentAppointmentToComplete, setCurrentAppointmentToComplete] = useState<Appointment | null>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit_card' | 'debit_card' | 'link' | ''>('');
  const [extraChargesInput, setExtraChargesInput] = useState(0);
  const [discountInput, setDiscountInput] = useState(0);
  const [preferenceUrl, setPreferenceUrl] = useState<string | null>(null);
  const [isLoadingLink, setIsLoadingLink] = useState(false);

  const finalPrice = Math.max(0, (currentAppointmentToComplete?.servicePrice || 0) + extraChargesInput - discountInput);

  useEffect(() => {
    const initAndFetch = async () => {
      await storage.initialize();
      const user = storage.getCurrentUser();

      const isBarber = user?.role === 'barber';
      if (!user || !isBarber) {
        toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
        navigate('/dashboard');
        return;
      }

      const allAppointments = storage.getAppointments();
      const recurringSchedules = storage.getRecurringSchedules();
      const barberProfile = storage.getBarbers().find(b => b.id === user.barberId);

      if (barberProfile) {
        const today = new Date();
        const todayFormatted = format(today, 'yyyy-MM-dd');
        const dayOfWeek = today.getDay();

        // 1. Agendamentos reais do barbeiro
        const barberAppointments = allAppointments.filter(appt => appt.barberId === barberProfile.id);
        
        // 2. Agendamentos fixos (recorrentes) para HOJE
        const todayRecurring = recurringSchedules
          .filter(s => s.barberId === barberProfile.id && s.dayOfWeek === dayOfWeek && s.active)
          .filter(s => {
            // Evitar duplicados: Se já existe um agendamento real para este cliente neste horário hoje, não mostrar o virtual
            return !barberAppointments.some(appt => 
              appt.date === todayFormatted && 
              appt.time === s.time && 
              appt.userId === s.userId
            );
          })
          .map(s => {
            const servicesData = storage.getServices();
            const sIds = s.serviceIds || [s.serviceId];
            const totalPrice = sIds.reduce((sum, id) => {
              const srv = servicesData.find(x => x.id === id);
              return sum + (srv?.price || 0);
            }, 0);

            return {
              id: `recurring-v-${s.id}`, // v de virtual
              userId: s.userId,
              barberId: s.barberId,
              serviceId: sIds[0],
              serviceIds: sIds,
              date: todayFormatted,
              time: s.time,
              status: 'pending' as const,
              servicePrice: totalPrice,
              amountPaid: 0,
              paymentType: '',
              isRecurring: true, // Flag para a UI
            };
          });

        // Combinar e ordenar (appointments já estão tipados, estender se necessário ou usar any temporário para a flag)
        setAppointments([...barberAppointments, ...todayRecurring as any]);
      } else {
        toast({ title: "Perfil não encontrado", description: "Não foi possível encontrar um perfil de barbeiro associado a este usuário.", variant: "destructive" });
        navigate('/dashboard');
      }
    };

    initAndFetch();
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
  const getServiceName = (id: string | string[]) => {
    const ids = Array.isArray(id) ? id : [id];
    return ids.map(serviceId => services.find(s => s.id === serviceId)?.name).filter(Boolean).join(' + ') || 'N/A';
  };

  const updateAppointmentInStorage = async (updatedAppointment: Appointment) => {
    await storage.updateAppointment(updatedAppointment);
    
    // Atualiza o estado local para garantir que a UI reflita a mudança imediatamente
    const barberProfile = storage.getBarbers().find(b => b.id === user?.barberId);
    if (barberProfile) {
      const allAppointments = storage.getAppointments();
      const barberAppointments = allAppointments.filter(appt => appt.barberId === barberProfile.id);
      setAppointments(barberAppointments);
    }
  };

  const handleStartService = async (appointment: Appointment) => {
    const now = new Date();
    const scheduledDateTime = parseISO(`${appointment.date}T${appointment.time}:00`);
    const isDelayed = isAfter(now, scheduledDateTime);

    let finalAppointment = { ...appointment };

    // Se for virtual, cria o agendamento real no banco agora
    if (appointment.id.startsWith('recurring-v-')) {
      const servicesData = storage.getServices();
      const sIds = appointment.serviceIds || [appointment.serviceId];
      const totalServicePrice = sIds.reduce((sum, id) => {
        const s = servicesData.find(srv => srv.id === id);
        return sum + (s?.price || 0);
      }, 0);

      finalAppointment = {
        ...appointment,
        id: `rec-${Date.now()}`, // Novo ID real
        servicePrice: totalServicePrice,
        createdAt: new Date().toISOString(),
      };
      
      // Salva no banco (spread para remover flags extras se houver)
      const { ...dbAppointment } = finalAppointment;
      // @ts-ignore (remover a flag isRecurring se existir)
      delete dbAppointment.isRecurring;
      
      await storage.saveAppointments([...storage.getAppointments(), dbAppointment as Appointment]);
    }

    const updatedAppointment = {
      ...finalAppointment,
      startTime: format(now, 'HH:mm'),
      isDelayed: isDelayed,
      status: 'in_progress' as const,
    };
    try {
      await updateAppointmentInStorage(updatedAppointment);
      toast({ title: 'Serviço Iniciado', description: `O corte de ${getClientName(appointment)} foi iniciado.` });
    } catch (error) {
      toast({
        title: 'Erro ao iniciar',
        description: 'Não foi possível iniciar o serviço. Verifique sua conexão e tente novamente.',
        variant: 'destructive'
      });
    }
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
      finalPrice: finalPrice,
      status: 'completed' as const,
    };
    try {
      await updateAppointmentInStorage(updatedAppointment);

      if (currentAppointmentToComplete.userId) {
        const userToUpdate = storage.getUsers().find(u => u.id === currentAppointmentToComplete.userId);
        if (userToUpdate) {
          const updatedUser = { ...userToUpdate };
          updatedUser.cutsCount = (updatedUser.cutsCount || 0) + 1;

          const service = services.find(s => s.id === currentAppointmentToComplete.serviceId);
          if (service && updatedUser.stylePreferences && !updatedUser.stylePreferences.includes(service.name)) {
            updatedUser.stylePreferences = [...updatedUser.stylePreferences, service.name];
          } else if (service && !updatedUser.stylePreferences) {
            updatedUser.stylePreferences = [service.name];
          }

          await storage.updateUser(updatedUser);
        }
      }

      setPreferenceUrl(null);
      setCurrentAppointmentToComplete(null);
      setPaymentType('');
      setExtraChargesInput(0);
      setDiscountInput(0);
      setShowPaymentDialog(false); // Fechar o diálogo após sucesso
      toast({ title: 'Serviço Finalizado', description: `O corte de ${getClientName(currentAppointmentToComplete)} foi concluído e pago via ${paymentType}. Total: R$ ${finalPrice.toFixed(2)}.` });
    } catch (error) {
      console.error('Erro ao finalizar serviço:', error);
      toast({
        title: 'Erro ao finalizar',
        description: 'Ocorreu um erro no banco de dados. Certifique-se de que todas as colunas SQL foram criadas.',
        variant: 'destructive'
      });
    }
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
    const appointmentToUpdate = appointments.find(a => a.id === id);
    if (!appointmentToUpdate) return;

    await updateAppointmentInStorage({ ...appointmentToUpdate, status });
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

  const paymentTypeLabels: Record<string, string> = {
    cash: 'Dinheiro',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    link: 'Link de Pagamento',
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminMenu />

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
                      {(appointment as any).isRecurring && <Badge variant="outline" className="border-primary text-primary font-bold">FIXO</Badge>}
                      {appointment.isDelayed && <Badge variant="destructive" className="bg-red-500/20 text-red-700">Atrasado</Badge>}
                    </div>
                    <p className="text-muted-foreground"><span className="font-medium">Serviço:</span> {getServiceName(appointment.serviceIds || appointment.serviceId)}</p>
                    <p className="text-muted-foreground"><span className="font-medium">Data:</span> {new Date(appointment.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {appointment.time}</p>
                    {appointment.startTime && <p className="text-muted-foreground"><span className="font-medium">Início:</span> {appointment.startTime}</p>}
                    {appointment.endTime && <p className="text-muted-foreground"><span className="font-medium">Fim:</span> {appointment.endTime}</p>}
                    {appointment.paymentType && <p className="text-muted-foreground"><span className="font-medium">Pagamento:</span> {paymentTypeLabels[appointment.paymentType] || appointment.paymentType}</p>}
                    {appointment.status === 'completed' && appointment.finalPrice && <p className="text-muted-foreground"><span className="font-medium">Valor Pago:</span> R$ {appointment.finalPrice.toFixed(2)}</p>}
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                    {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <Button size="sm" onClick={() => handleStartService(appointment)} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto h-11 md:h-9"><Play className="w-4 h-4 mr-2" />Iniciar Corte</Button>
                    )}
                    {appointment.status === 'in_progress' && (
                      <Button size="sm" onClick={() => { setCurrentAppointmentToComplete(appointment); setShowPaymentDialog(true); }} className="bg-green-600 hover:bg-green-700 w-full md:w-auto h-11 md:h-9"><DollarSign className="w-4 h-4 mr-2" />Finalizar</Button>
                    )}
                    {appointment.status === 'pending' && (
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button size="sm" onClick={() => updateStatus(appointment.id, 'confirmed')} className="bg-green-600 hover:bg-green-700 flex-1 h-11 md:h-9"><Check className="w-4 h-4 mr-1" />Confirmar</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(appointment.id, 'cancelled')} className="flex-1 h-11 md:h-9"><X className="w-4 h-4 mr-1" />Cancelar</Button>
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
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-5 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Finalizar Agendamento</DialogTitle></DialogHeader>
          <div className="py-2 space-y-4">
            <p className="mb-2 text-sm text-muted-foreground">
              Finalizando atemdimento de <span className="font-bold text-foreground">{getClientName(currentAppointmentToComplete!)}</span>.<br />
              Valor do Serviço: R$ {currentAppointmentToComplete?.servicePrice?.toFixed(2)}
            </p>

            <div>
              <Label htmlFor="extraCharges">Encargos Extras (R$)</Label>
              <Input id="extraCharges" type="text" inputMode="decimal" className="h-12 mt-1" placeholder="0.00" value={extraChargesInput === 0 ? '' : extraChargesInput} onChange={(e) => {
                const val = e.target.value.replace(',', '.');
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setExtraChargesInput(val === '' ? 0 : parseFloat(val));
                }
              }} />
            </div>

            <div>
              <Label htmlFor="discount">Desconto (R$)</Label>
              <Input id="discount" type="text" inputMode="decimal" className="h-12 mt-1 border-primary/40 focus-visible:ring-primary/40" placeholder="0.00" value={discountInput === 0 ? '' : discountInput} onChange={(e) => {
                const val = e.target.value.replace(',', '.');
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setDiscountInput(val === '' ? 0 : parseFloat(val));
                }
              }} />
            </div>

            <div>
              <Label htmlFor="finalPrice">Preço Final (R$)</Label>
              <Input id="finalPrice" type="number" step="0.01" className="h-12 mt-1 font-bold text-primary" value={finalPrice} readOnly disabled />
            </div>

            <div>
              <Label htmlFor="paymentType">Tipo de Pagamento</Label>
              <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                <SelectTrigger className="h-12 mt-1"><SelectValue placeholder="Tipo de Pagamento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="link">Mercado Pago (Pix/Cartão)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seção de Pix removida para unificação com Mercado Pago */}

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
          <DialogFooter className="flex-col gap-2 sm:flex-row mt-4">
            <Button onClick={handleCompleteService} disabled={!paymentType || finalPrice < 0} className="w-full h-12 text-lg">Confirmar</Button>
            <DialogClose asChild><Button type="button" variant="ghost" className="w-full h-12">Cancelar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyAppointments;
