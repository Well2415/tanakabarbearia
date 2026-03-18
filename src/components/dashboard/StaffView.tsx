import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { Calendar, Users, Scissors, TrendingUp, Clock, UserCog, Star, Wallet } from 'lucide-react';
import { User } from '@/types';

interface StaffViewProps {
  user: User;
}

export const StaffView = ({ user }: StaffViewProps) => {
  const appointments = storage.getAppointments();
  const services = storage.getServices();
  const clients = storage.getUsers().filter(u => u.role === 'client');
  
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  
  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => {
      // Use finalPrice if available, otherwise calculate from servicePrice and extraCharges
      const price = a.finalPrice !== undefined ? a.finalPrice : (a.servicePrice || 0) + (a.extraCharges || 0);
      return sum + price;
    }, 0);

  return (
    <>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-8"> {/* Added mt-8 */}
        <Card className="p-6 border-border h-full flex flex-col justify-between"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Agendamentos Hoje</p><p className="text-3xl font-bold">{todayAppointments.length}</p></div><Calendar className="w-10 h-10 text-primary" /></div></Card>
        <Card className="p-6 border-border h-full flex flex-col justify-between"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Pendentes</p><p className="text-3xl font-bold">{pendingAppointments.length}</p></div><Calendar className="w-10 h-10 text-primary" /></div></Card>
        {user.role === 'admin' && (
          <>
            <Card className="p-6 border-border h-full flex flex-col justify-between"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Total Clientes</p><p className="text-3xl font-bold">{clients.length}</p></div><Users className="w-10 h-10 text-primary" /></div></Card>
            <Card className="p-6 border-border h-full flex flex-col justify-between"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground mb-1">Receita Total</p><p className="text-3xl font-bold whitespace-nowrap">R$ {totalRevenue}</p></div><TrendingUp className="w-10 h-10 text-primary" /></div></Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to={user.role === 'barber' ? "/my-schedule" : "/admin/appointments"}>
          <Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer h-full flex flex-col justify-between">
            <Calendar className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Agendamentos</h3>
            <p className="text-muted-foreground">
              {user.role === 'barber' ? 'Visualize seus agendamentos' : 'Gerencie todos os agendamentos'}
            </p>
          </Card>
        </Link>
        
        {user.role === 'barber' && (
          <>
            <Link to="/barber/availability"><Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer h-full flex flex-col justify-between"><Clock className="w-12 h-12 text-primary mb-4" /><h3 className="text-xl font-bold mb-2">Minha Disponibilidade</h3><p className="text-muted-foreground">Gerencie suas datas e horários de trabalho</p></Card></Link>
            <Link to="/barber/finance"><Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer h-full flex flex-col justify-between"><Wallet className="w-12 h-12 text-primary mb-4" /><h3 className="text-xl font-bold mb-2">Financeiro</h3><p className="text-muted-foreground">Acompanhe despesas e receitas do mês</p></Card></Link>
          </>
        )}
        


        {user.role === 'admin' && (
          <>
            <Link to="/barber/finance"><Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer h-full flex flex-col justify-between"><Wallet className="w-12 h-12 text-primary mb-4" /><h3 className="text-xl font-bold mb-2">Financeiro Geral</h3><p className="text-muted-foreground">Caixa, receitas globais e despesas</p></Card></Link>
            <Link to="/admin/users"><Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer"><UserCog className="w-12 h-12 text-primary mb-4" /><h3 className="text-xl font-bold mb-2">Gerenciar Usuários</h3><p className="text-muted-foreground">Contas e permissões</p></Card></Link>
            <Link to="/admin/barbers"><Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer h-full flex flex-col justify-between"><Scissors className="w-12 h-12 text-primary mb-4" /><h3 className="text-xl font-bold mb-2">Barbeiros</h3><p className="text-muted-foreground">Perfis públicos dos barbeiros</p></Card></Link>
            <Link to="/admin/services"><Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer"><Scissors className="w-12 h-12 text-primary mb-4" /><h3 className="text-xl font-bold mb-2">Serviços</h3><p className="text-muted-foreground">Cadastro e preços de serviços</p></Card></Link>
            <Link to="/admin/clients"><Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer"><Star className="w-12 h-12 text-primary mb-4" /><h3 className="text-xl font-bold mb-2">Plano de Fidelidade</h3><p className="text-muted-foreground">Gerencie os pontos dos clientes</p></Card></Link>
          </>
        )}
      </div>
    </>
  );
};