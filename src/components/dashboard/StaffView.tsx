import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { Calendar, Users, Scissors, TrendingUp, Clock, UserCog, Star, Wallet } from 'lucide-react';
import { User, Appointment } from '@/types';
import { isSameMonth, format } from 'date-fns';
import { parseLocalDate } from '@/lib/timeUtils';

interface StaffViewProps {
  user: User;
}

export const StaffView = ({ user }: StaffViewProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const services = storage.getServices();
  const clients = storage.getUsers().filter(u => u.role === 'client');
  
  const fetchData = async () => {
    const targetBarberId = user.barberId || user.id;
    const { data } = await storage.fetchAppointments(undefined, undefined, 500, 0, undefined, targetBarberId, true);
    setAppointments(data);
  };

  useEffect(() => {
    fetchData();

    // Assinatura Realtime para atualizar o Dashboard instantaneamente
    const channel = storage.subscribeToAppointments(() => {
      fetchData();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user.id, user.barberId]);

  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const todayAppointments = appointments.filter(a => a.date === today);
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  
  const currentMonth = new Date();
  
  const totalRevenue = appointments
    .filter(a => a.status === 'completed' && isSameMonth(parseLocalDate(a.date), currentMonth))
    .reduce((sum, a) => {
      const price = a.finalPrice !== undefined ? a.finalPrice : (a.servicePrice || 0) + (a.extraCharges || 0) - (a.discount || 0);
      return sum + price;
    }, 0);

  const upcomingAppointments = appointments
    .filter(a => (a.status === 'confirmed' || a.status === 'pending') && (a.date > today || (a.date === today && a.time >= format(now, 'HH:mm'))))
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateA - dateB;
    })
    .slice(0, 5);

  const getClientName = (appointment: Appointment) => {
    if (appointment.guestName) return `${appointment.guestName} (C)`;
    const client = storage.getUsers().find(u => u.id === appointment.userId);
    return client?.fullName.split(' ')[0] || 'Cliente';
  };

  const getServiceName = (id: string | string[]) => {
    const ids = Array.isArray(id) ? id : [id];
    return ids.map(serviceId => services.find(s => s.id === serviceId)?.name).filter(Boolean).join(' + ') || 'Serviço';
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8">
        <Card className="p-6 border-border h-full flex flex-col justify-between"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Agendamentos Hoje</p><p className="text-3xl font-bold">{todayAppointments.length}</p></div><Calendar className="w-10 h-10 text-primary" /></div></Card>
        <Card className="p-6 border-border h-full flex flex-col justify-between"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Pendentes</p><p className="text-3xl font-bold">{pendingAppointments.length}</p></div><Calendar className="w-10 h-10 text-primary" /></div></Card>
        {user.role === 'admin' && (
          <>
            <Card className="p-6 border-border h-full flex flex-col justify-between"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Total Clientes</p><p className="text-3xl font-bold">{clients.length}</p></div><Users className="w-10 h-10 text-primary" /></div></Card>
            <Card className="p-6 border-border h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Receita (Mês)</p>
                  <p className="text-3xl font-bold whitespace-nowrap text-green-500">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-primary" />
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Próximos Atendimentos
          </h3>
          <div className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appt) => (
                <Card key={appt.id} className="p-4 border-border bg-card/50 hover:bg-accent/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {appt.time}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{getClientName(appt)}</p>
                        <p className="text-xs text-muted-foreground">{getServiceName(appt.serviceIds || appt.serviceId)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-primary">{appt.date === today ? 'Hoje' : format(parseLocalDate(appt.date), 'dd/MM')}</p>
                      <p className="text-[10px] text-muted-foreground">{appt.status === 'pending' ? 'Aguardando' : 'Confirmado'}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl">
                <p className="text-muted-foreground text-sm">Nenhum agendamento futuro encontrado.</p>
              </div>
            )}
            <Link to={user.role === 'barber' ? "/my-schedule" : "/admin/appointments"}>
              <Button variant="ghost" className="w-full mt-2 text-xs text-primary hover:text-primary hover:bg-primary/5">
                Ver Agenda Completa
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <Link to={user.role === 'barber' ? "/my-schedule" : "/admin/appointments"}>
              <Card className="p-4 border-border hover:border-primary transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="font-bold text-sm">Agendamentos</h4>
                    <p className="text-[10px] text-muted-foreground">Gerenciar horários</p>
                  </div>
                </div>
              </Card>
            </Link>

            {user.role === 'barber' && (
              <>
                <Link to="/barber/availability">
                  <Card className="p-4 border-border hover:border-primary transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="font-bold text-sm">Minha Disponibilidade</h4>
                        <p className="text-[10px] text-muted-foreground">Datas e horários</p>
                      </div>
                    </div>
                  </Card>
                </Link>
                <Link to="/barber/finance">
                  <Card className="p-4 border-border hover:border-primary transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="font-bold text-sm">Financeiro</h4>
                        <p className="text-[10px] text-muted-foreground">Receitas do mês</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <Link to="/barber/finance">
                  <Card className="p-4 border-border hover:border-primary transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="font-bold text-sm">Financeiro Geral</h4>
                        <p className="text-[10px] text-muted-foreground">Caixa e receitas</p>
                      </div>
                    </div>
                  </Card>
                </Link>
                <Link to="/admin/users">
                  <Card className="p-4 border-border hover:border-primary transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <UserCog className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="font-bold text-sm">Usuários</h4>
                        <p className="text-[10px] text-muted-foreground">Contas e permissões</p>
                      </div>
                    </div>
                  </Card>
                </Link>
                <Link to="/admin/barbers">
                  <Card className="p-4 border-border hover:border-primary transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Scissors className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="font-bold text-sm">Barbeiros</h4>
                        <p className="text-[10px] text-muted-foreground">Gerenciar perfis</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};