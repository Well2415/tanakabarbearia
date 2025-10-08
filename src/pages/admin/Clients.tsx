import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { ArrowLeft, Mail, Phone, Calendar, Star, Edit } from 'lucide-react';
import { User, Appointment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Clients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [clients, setClients] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editingClient, setEditingClient] = useState<User | null>(null);
  const [newPoints, setNewPoints] = useState(0);
  const [loyaltyTarget, setLoyaltyTarget] = useState(0);
  const [newLoyaltyTarget, setNewLoyaltyTarget] = useState(0); // New state for the input

  // Effect to load loyalty target only once on mount
  useEffect(() => {
    const currentLoyaltyTarget = storage.getLoyaltyTarget();
    setLoyaltyTarget(currentLoyaltyTarget);
    setNewLoyaltyTarget(currentLoyaltyTarget);
  }, []); // Empty dependency array means it runs once on mount

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
      navigate('/dashboard');
    } else {
      const newClients = storage.getUsers().filter(u => u.role === 'client');
      const newAppointments = storage.getAppointments();

      if (JSON.stringify(newClients) !== JSON.stringify(clients)) {
        setClients(newClients);
      }
      if (JSON.stringify(newAppointments) !== JSON.stringify(appointments)) {
        setAppointments(newAppointments);
      }
    }
  }, [user, navigate, toast, clients, appointments]);

  useEffect(() => {
    if (editingClient) {
      setNewPoints(editingClient.loyaltyPoints || 0);
    }
  }, [editingClient]);

  if (!user || user.role !== 'admin') return null;

  // New function to handle saving loyalty target
  const handleSaveLoyaltyTarget = () => {
    storage.saveLoyaltyTarget(newLoyaltyTarget);
    setLoyaltyTarget(newLoyaltyTarget);
    toast({ title: 'Meta de Fidelidade Atualizada', description: `A nova meta de pontos de fidelidade é ${newLoyaltyTarget}.` });
  };

  const getClientAppointmentsCount = (userId: string) => {
    return appointments.filter(a => a.userId === userId).length;
  };

  const handlePointsChange = () => {
    if (!editingClient) return;

    const allUsers = storage.getUsers();
    const updatedUsers = allUsers.map(u => 
      u.id === editingClient.id ? { ...u, loyaltyPoints: newPoints } : u
    );
    storage.saveUsers(updatedUsers);
    setClients(updatedUsers.filter(u => u.role === 'client'));
    setEditingClient(null);
    toast({ title: 'Pontos atualizados!', description: `Os pontos de ${editingClient.fullName} foram definidos para ${newPoints}.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border"><div className="container mx-auto px-4 py-4"><Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Voltar ao Dashboard</Button></Link></div></nav>
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Gerenciar Clientes</h2>

        {/* Loyalty Plan Management Card */}
        <Card className="mb-8 p-6 border-border">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-2xl font-bold">Gerenciar Plano de Fidelidade</CardTitle>
          </CardHeader>
          <CardContent className="p-0 mb-4">
            <Label htmlFor="loyalty-target">Pontos de Fidelidade Necessários por Mês</Label>
            <Input
              id="loyalty-target"
              type="number"
              value={newLoyaltyTarget}
              onChange={(e) => setNewLoyaltyTarget(parseInt(e.target.value) || 0)}
              className="mt-2"
            />
          </CardContent>
          <CardFooter className="p-0">
            <Button onClick={handleSaveLoyaltyTarget}>Salvar Meta de Fidelidade</Button>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.length === 0 ? (
            <Card className="p-8 text-center border-border col-span-full"><p className="text-muted-foreground">Nenhum cliente cadastrado</p></Card>
          ) : (
            clients.map((client) => (
              <Card key={client.id} className="p-6 border-border flex flex-col">
                <div className="flex-grow">
                  <h3 className="text-xl font-bold mb-4">{client.fullName}</h3>
                  <div className="space-y-2 mb-4">
                    {client.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /><span className="text-sm">{client.email}</span></div>}
                    {client.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" /><span className="text-sm">{client.phone}</span></div>}
                    <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /><span className="text-sm">{getClientAppointmentsCount(client.id)} agendamento(s)</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Star className="w-4 h-4" /><span className="text-sm">{client.loyaltyPoints || 0}/{loyaltyTarget} pontos de fidelidade</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <CardFooter className="p-0 pt-4 mt-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => setEditingClient(client)}><Edit className="w-4 h-4 mr-2" />Editar Pontos</Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Points Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(isOpen) => !isOpen && setEditingClient(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Pontos de Fidelidade</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label htmlFor="points">Pontos para <span className="font-bold">{editingClient?.fullName}</span></Label>
            <Input id="points" type="number" value={newPoints} onChange={(e) => setNewPoints(parseInt(e.target.value) || 0)} className="mt-2" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handlePointsChange}>Salvar Pontos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
