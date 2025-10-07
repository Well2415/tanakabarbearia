import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { Calendar, Users, Scissors, TrendingUp, LogOut } from 'lucide-react';

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
  const clients = storage.getClients();
  const services = storage.getServices();
  
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  
  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => {
      const service = services.find(s => s.id === a.serviceId);
      return sum + (service?.price || 0);
    }, 0);

  const handleLogout = () => {
    storage.setCurrentUser(null);
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Beardy Flow Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Olá, {user.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
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
                <p className="text-3xl font-bold">R$ {totalRevenue}</p>
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
