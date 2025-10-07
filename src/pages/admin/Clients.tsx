import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';

const Clients = () => {
  const navigate = useNavigate();
  const user = storage.getCurrentUser();
  const [clients] = useState(storage.getClients());
  const [appointments] = useState(storage.getAppointments());

  useEffect(() => {
    if (!user) navigate('/admin/login');
  }, [user, navigate]);

  if (!user) return null;

  const getClientAppointments = (clientId: string) => {
    return appointments.filter(a => a.clientId === clientId);
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
        <h2 className="text-3xl font-bold mb-8">Clientes</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.length === 0 ? (
            <Card className="p-8 text-center border-border col-span-full">
              <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
            </Card>
          ) : (
            clients.map((client) => {
              const clientAppointments = getClientAppointments(client.id);
              return (
                <Card key={client.id} className="p-6 border-border">
                  <h3 className="text-xl font-bold mb-4">{client.name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {clientAppointments.length} agendamento(s)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;
