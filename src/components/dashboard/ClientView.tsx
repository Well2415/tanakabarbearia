import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { User, Appointment, Service, Barber } from '@/types';
import { format, parse, differenceInHours, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { XCircle, Clock } from 'lucide-react';
import { parseLocalDate } from '@/lib/timeUtils';

interface ClientViewProps {
  user: User;
}

export const ClientView = ({ user }: ClientViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const allAppointments = storage.getAppointments();
    const userAppointments = allAppointments.filter(app => app.userId === user.id);
    setAppointments(userAppointments);
    setServices(storage.getServices());
    setBarbers(storage.getBarbers());
  }, [user.id]);

  const handleCancelAppointment = (appId: string) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      const allAppts = storage.getAppointments();
      const updated = allAppts.map(a => 
        a.id === appId ? { ...a, status: 'cancelled' as const } : a
      );
      storage.saveAppointments(updated);
      setAppointments(updated.filter(a => a.userId === user.id));
      toast({ title: 'Agendamento Cancelado', description: 'Seu horário foi liberado com sucesso.' });
    }
  };

  const isCancellable = (dateStr: string, timeStr: string) => {
    try {
      const appDateTime = parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
      if (isPast(appDateTime)) return false;
      const hoursDiff = differenceInHours(appDateTime, new Date());
      return hoursDiff >= 2;
    } catch {
      return false;
    }
  };

  const getServiceName = (id: string | string[]) => {
    const ids = Array.isArray(id) ? id : [id];
    return ids.map(serviceId => services.find(s => s.id === serviceId)?.name).filter(Boolean).join(' + ') || 'Serviço desconhecido';
  };
  const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'Barbeiro desconhecido';

  const loyaltyPoints = user.loyaltyPoints || 0;
  const pointsToFreeHaircut = 10; // Example value

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    confirmed: 'bg-blue-500/10 text-blue-600',
    cancelled: 'bg-red-500/10 text-red-600',
    in_progress: 'bg-purple-500/10 text-purple-600',
    completed: 'bg-green-500/10 text-green-600',
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

  return (
    <>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle>Meus Agendamentos</CardTitle></CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <ul className="space-y-4">
                  {appointments.map(app => (
                    <li key={app.id} className="p-4 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-bold">{getServiceName(app.serviceIds || app.serviceId)}</p>
                        <p className="text-sm text-muted-foreground">com {getBarberName(app.barberId)}</p>
                        <p className="text-sm text-muted-foreground">{format(parseLocalDate(app.date), 'PPP', { locale: ptBR })} às {app.time}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[app.status] || 'bg-gray-500/10 text-gray-600'}`}>
                          {statusLabels[app.status] || app.status}
                        </span>
                        
                        {(app.status === 'pending' || app.status === 'confirmed') && (
                          isCancellable(app.date, app.time) ? (
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="h-8 text-xs px-2"
                              onClick={() => handleCancelAppointment(app.id)}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
                            </Button>
                          ) : (
                            <div className="flex items-center text-xs text-amber-600 bg-amber-500/10 px-2 py-1 rounded-md mt-1" title="Cancelamentos só são permitidos com até 2 horas de antecedência.">
                              <Clock className="w-3 h-3 mr-1" /> No prazo limite (-2h)
                            </div>
                          )
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground py-8">Você ainda não tem agendamentos.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>Plano de Fidelidade</CardTitle></CardHeader>
            <CardContent className="text-center">
              <p className="text-6xl font-bold text-primary">{loyaltyPoints}</p>
              <p className="text-muted-foreground mb-4">pontos</p>
              <div className="w-full bg-border rounded-full h-2.5 mb-2">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(loyaltyPoints / pointsToFreeHaircut) * 100}%` }}></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Faltam {Math.max(0, pointsToFreeHaircut - loyaltyPoints)} pontos para seu próximo corte grátis!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
