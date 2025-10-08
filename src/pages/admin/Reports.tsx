import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Appointment, Service } from '@/types';
import { format } from 'date-fns';

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
      navigate('/dashboard');
    } else {
      setAppointments(storage.getAppointments());
      setServices(storage.getServices());
    }
  }, [user, navigate, toast]);

  if (!user || user.role !== 'admin') return null;

  // --- Lógica de Relatórios ---
  const completedAppointments = appointments.filter(appt => appt.status === 'completed');

  // 1. Receita Total
  const totalRevenue = completedAppointments.reduce((sum, appt) => sum + (appt.finalPrice || 0), 0);

  // 2. Serviços Mais Vendidos (por quantidade)
  const serviceCounts = completedAppointments.reduce((acc, appt) => {
    acc[appt.serviceId] = (acc[appt.serviceId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedServiceCounts = Object.entries(serviceCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([serviceId, count]) => {
      const service = services.find(s => s.id === serviceId);
      return { name: service?.name || 'Serviço Desconhecido', count };
    });

  // 3. Serviços Menos Vendidos (por quantidade)
  const sortedServiceCountsAsc = Object.entries(serviceCounts)
    .sort(([, countA], [, countB]) => countA - countB)
    .map(([serviceId, count]) => {
      const service = services.find(s => s.id === serviceId);
      return { name: service?.name || 'Serviço Desconhecido', count };
    });

  // 4. Receita por Serviço
  const revenueByService = completedAppointments.reduce((acc, appt) => {
    const service = services.find(s => s.id === appt.serviceId);
    if (service) {
      acc[service.name] = (acc[service.name] || 0) + (appt.finalPrice || 0);
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedRevenueByService = Object.entries(revenueByService)
    .sort(([, revenueA], [, revenueB]) => revenueB - revenueA)
    .map(([name, revenue]) => ({ name, revenue }));


  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/admin/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Voltar ao Dashboard</Button></Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Relatórios e Análises</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Receita Total */}
          <Card className="p-6 border-border">
            <h3 className="text-xl font-bold mb-2">Receita Total</h3>
            <p className="text-3xl font-bold text-primary">R$ {totalRevenue.toFixed(2)}</p>
          </Card>

          {/* Serviços Mais Vendidos */}
          <Card className="p-6 border-border">
            <h3 className="text-xl font-bold mb-2">Serviços Mais Vendidos</h3>
            <ul className="space-y-1">
              {sortedServiceCounts.slice(0, 5).map((item, index) => (
                <li key={index} className="flex justify-between text-muted-foreground">
                  <span>{item.name}</span>
                  <span>{item.count} vendas</span>
                </li>
              ))}
            </ul>
            {sortedServiceCounts.length === 0 && <p className="text-muted-foreground">Nenhum serviço vendido.</p>}
          </Card>

          {/* Serviços Menos Vendidos */}
          <Card className="p-6 border-border">
            <h3 className="text-xl font-bold mb-2">Serviços Menos Vendidos</h3>
            <ul className="space-y-1">
              {sortedServiceCountsAsc.slice(0, 5).map((item, index) => (
                <li key={index} className="flex justify-between text-muted-foreground">
                  <span>{item.name}</span>
                  <span>{item.count} vendas</span>
                </li>
              ))}
            </ul>
            {sortedServiceCountsAsc.length === 0 && <p className="text-muted-foreground">Nenhum serviço vendido.</p>}
          </Card>

          {/* Receita por Serviço */}
          <Card className="p-6 border-border col-span-full">
            <h3 className="text-xl font-bold mb-2">Receita por Serviço</h3>
            <ul className="space-y-1">
              {sortedRevenueByService.map((item, index) => (
                <li key={index} className="flex justify-between text-muted-foreground">
                  <span>{item.name}</span>
                  <span>R$ {item.revenue.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            {sortedRevenueByService.length === 0 && <p className="text-muted-foreground">Nenhuma receita registrada.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
