import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { Calendar, Users, Scissors, TrendingUp } from 'lucide-react';
import { User } from '@/types';
import { format } from 'date-fns';

interface StaffViewProps {
  user: User;
}

export const StaffView = ({ user }: StaffViewProps) => {
  const appointments = storage.getAppointments();
  const services = storage.getServices();
  const clients = storage.getUsers().filter(u => u.role === 'client');
  
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const todayAppointments = appointments.filter(a => a.date === today);
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  
  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (a.servicePrice || 0), 0);

  return (
    <>
      <p className="text-xl text-muted-foreground mb-8">
        Bem-vindo, <span className="text-primary">{user.fullName}</span>. Você está no painel de staff.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-border"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Agendamentos Hoje</p><p className="text-3xl font-bold">{todayAppointments.length}</p></div><Calendar className="w-10 h-10 text-primary" /></div></Card>
        <Card className="p-6 border-border"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Pendentes</p><p className="text-3xl font-bold">{pendingAppointments.length}</p></div><Calendar className="w-10 h-10 text-primary" /></div></Card>
        {user.role === 'admin' && (
          <>
            <Card className="p-6 border-border"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Total Clientes</p><p className="text-3xl font-bold">{clients.length}</p></div><Users className="w-10 h-10 text-primary" /></div></Card>
            <Card className="p-6 border-border"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Receita Total</p><p className="text-3xl font-bold">R$ {totalRevenue}</p></div><TrendingUp className="w-10 h-10 text-primary" /></div></Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/admin/appointments"><Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer"><Calendar className="w-12 h-12 text-primary mb-4" /><h3 className="text-xl font-bold mb-2">Agendamentos</h3><p className="text-muted-foreground">Gerencie todos os agendamentos</p></Card></Link>
        
        {user.role === 'admin' && (
          <>
            <Link to="/admin/barbers"><Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer"><Scissors className="w-12 h-12 text-primary mb-4" /><h3 className="text-xl font-bold mb-2">Barbeiros</h3><p className="text-muted-foreground">Cadastro e gestão de barbeiros</p></Card></Link>
            <Link to="/admin/services"><Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer"><Scissors className="w-12 h-12 text-primary mb-4" /><h3 className="text-xl font-bold mb-2">Serviços</h3><p className="text-muted-foreground">Cadastro e preços de serviços</p></Card></Link>
            <Link to="/admin/clients"><Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer"><Users className="w-12 h-12 text-primary mb-4" /><h3 className="text-xl font-bold mb-2">Clientes</h3><p className="text-muted-foreground">Base de clientes e histórico</p></Card></Link>
          </>
        )}
      </div>
    </>
  );
};
