import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { Calendar, Users, Scissors, TrendingUp, DollarSign, Check, X, Wallet, UserCog } from 'lucide-react';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { formatCurrency, cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = storage.getCurrentUser();

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const appointments = storage.getAppointments();
  const clients = storage.getUsers().filter(u => u.role === 'client');
  const services = storage.getServices();

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  const pendingAppointments = appointments.filter(a => a.status === 'pending');

  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (a.servicePrice || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <AdminMenu />

      <div className="container mx-auto px-4 py-8 pb-32">
        <h2 className="text-3xl font-bold mb-8">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Agendamentos Hoje</p>
                <p className="text-3xl font-bold">{todayAppointments.length}</p>
              </div>
              <Calendar className="w-10 h-10 text-primary" />
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
                <p className="text-3xl font-bold">{pendingAppointments.length}</p>
              </div>
              <Calendar className="w-10 h-10 text-primary" />
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Clientes</p>
                <p className="text-3xl font-bold">{clients.length}</p>
              </div>
              <Users className="w-10 h-10 text-primary" />
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
                <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
          </Card>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/admin/appointments">
            <Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer">
              <Calendar className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Agendamentos</h3>
              <p className="text-muted-foreground">Gerencie todos os agendamentos</p>
            </Card>
          </Link>

          <Link to="/admin/barbers">
            <Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer">
              <Scissors className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Barbeiros</h3>
              <p className="text-muted-foreground">Cadastro e gestão de barbeiros</p>
            </Card>
          </Link>

          <Link to="/admin/services">
            <Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer">
              <Scissors className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Serviços</h3>
              <p className="text-muted-foreground">Cadastro e preços de serviços</p>
            </Card>
          </Link>

          <Link to="/admin/clients">
            <Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Clientes</h3>
              <p className="text-muted-foreground">Base de clientes e histórico</p>
            </Card>
          </Link>

          <Link to="/barber/finance">
            <Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer h-full flex flex-col justify-between">
              <Wallet className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Financeiro Geral</h3>
              <p className="text-muted-foreground">Caixa, receitas globais e despesas</p>
            </Card>
          </Link>

          <Link to="/admin/users">
            <Card className="p-6 border-border hover:border-primary transition-colors cursor-pointer h-full flex flex-col justify-between">
              <UserCog className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Usuários</h3>
              <p className="text-muted-foreground">Gerenciar contas e acessos</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
