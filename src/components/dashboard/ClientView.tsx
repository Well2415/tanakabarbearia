import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { User, Appointment, Service, Barber } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientViewProps {
  user: User;
}

export const ClientView = ({ user }: ClientViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  useEffect(() => {
    const allAppointments = storage.getAppointments();
    const userAppointments = allAppointments.filter(app => app.userId === user.id);
    setAppointments(userAppointments);
    setServices(storage.getServices());
    setBarbers(storage.getBarbers());
  }, [user.id]);

  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Serviço desconhecido';
  const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'Barbeiro desconhecido';

  const loyaltyPoints = user.loyaltyPoints || 0;
  const pointsToFreeHaircut = 10; // Example value

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
                        <p className="font-bold">{getServiceName(app.serviceId)}</p>
                        <p className="text-sm text-muted-foreground">com {getBarberName(app.barberId)}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(app.date), 'PPP', { locale: ptBR })} às {app.time}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' : 'bg-green-500/20 text-green-700'}`}>
                          {app.status}
                        </span>
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
