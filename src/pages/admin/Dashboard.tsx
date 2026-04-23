import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { Calendar, Users, Scissors, TrendingUp, DollarSign, Check, X, Wallet, UserCog } from 'lucide-react';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { formatCurrency, cn } from '@/lib/utils';
import { format, subDays, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/timeUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = storage.getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCount: 0,
    pendingCount: 0,
    clientsCount: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        await storage.initializeConfig();
        
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const startOfMonth = format(now, 'yyyy-MM-01');
        
        // Buscas paralelas otimizadas (usando head: true quando possível para evitar download de linhas)
        const [todayRes, pendingRes, monthRes, clientsRes] = await Promise.all([
          supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today),
          supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('appointments').select('finalPrice, servicePrice, extraCharges, discount').eq('status', 'completed').gte('date', startOfMonth),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client')
        ]);

        const revenue = monthRes.data?.reduce((sum, a) => {
          const price = a.finalPrice !== undefined ? a.finalPrice : (a.servicePrice || 0) + (a.extraCharges || 0) - (a.discount || 0);
          return sum + price;
        }, 0) || 0;

        setStats({
          todayCount: todayRes.count || 0,
          pendingCount: pendingRes.count || 0,
          clientsCount: clientsRes.count || 0,
          monthlyRevenue: revenue
        });
      } catch (error) {
        console.error('❌ [Dashboard] Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (!user) return null;


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
                <p className="text-3xl font-bold">{stats.todayCount}</p>
              </div>
              <Calendar className="w-10 h-10 text-primary" />
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
                <p className="text-3xl font-bold">{stats.pendingCount}</p>
              </div>
              <Calendar className="w-10 h-10 text-primary" />
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Clientes</p>
                <p className="text-3xl font-bold">{stats.clientsCount}</p>
              </div>
              <Users className="w-10 h-10 text-primary" />
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Receita (Mês)</p>
                <p className="text-3xl font-bold text-green-500">R$ {stats.monthlyRevenue.toFixed(2).replace('.', ',')}</p>
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
