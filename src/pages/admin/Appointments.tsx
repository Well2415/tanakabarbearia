import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Appointments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [appointments, setAppointments] = useState(storage.getAppointments());

  useEffect(() => {
    if (!user) navigate('/admin/login');
  }, [user, navigate]);

  if (!user) return null;

  const clients = storage.getClients();
  const barbers = storage.getBarbers();
  const services = storage.getServices();

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'N/A';
  const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'N/A';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'N/A';

  const updateStatus = (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    const updated = appointments.map(a => a.id === id ? { ...a, status } : a);
    storage.saveAppointments(updated);
    setAppointments(updated);
    toast({
      title: 'Status atualizado',
      description: 'O agendamento foi atualizado com sucesso',
    });
  };

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    confirmed: 'bg-blue-500/10 text-blue-500',
    cancelled: 'bg-red-500/10 text-red-500',
    completed: 'bg-green-500/10 text-green-500',
  };

  const statusLabels = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Agendamentos</h2>

        <div className="space-y-4">
          {appointments.length === 0 ? (
            <Card className="p-8 text-center border-border">
              <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
            </Card>
          ) : (
            appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((appointment) => (
              <Card key={appointment.id} className="p-6 border-border">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{getClientName(appointment.clientId)}</h3>
                      <Badge className={statusColors[appointment.status]}>
                        {statusLabels[appointment.status]}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Serviço:</span> {getServiceName(appointment.serviceId)}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Barbeiro:</span> {getBarberName(appointment.barberId)}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-medium">Data:</span> {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                    </p>
                  </div>

                  {appointment.status === 'pending' && (
                    <div className="flex gap-2 items-start">
                      <Button
                        size="sm"
                        onClick={() => updateStatus(appointment.id, 'confirmed')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(appointment.id, 'cancelled')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  )}

                  {appointment.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(appointment.id, 'completed')}
                    >
                      Marcar como Concluído
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;
