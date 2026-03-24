import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { ArrowLeft, Mail, Phone, Calendar, Star, Edit, Search, ChevronDown, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { User, Appointment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { CreateClientDialog } from '@/components/admin/CreateClientDialog';
import { useSearchParams } from 'react-router-dom';

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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchParams] = useSearchParams();
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new-client') {
      setIsAddOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const search = searchTerm.toLowerCase();
      const nameMatch = client.fullName.toLowerCase().includes(search);
      const emailMatch = client.email?.toLowerCase().includes(search);
      const phoneMatch = client.phone?.includes(search);
      return nameMatch || emailMatch || phoneMatch;
    });
  }, [clients, searchTerm]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const displayedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const handlePasswordChange = () => {
    if (!editingClient) return;
    if (!password) {
      toast({ title: 'Erro', description: 'Por favor, insira uma nova senha.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }

    const allUsers = storage.getUsers();
    const updatedUsers = allUsers.map(u =>
      u.id === editingClient.id ? { ...u, password: password } : u
    );
    storage.saveUsers(updatedUsers);
    setClients(updatedUsers.filter(u => u.role === 'client'));
    setEditingClient(null);
    setIsChangingPassword(false);
    setPassword('');
    setConfirmPassword('');
    toast({ title: 'Senha atualizada!', description: `A senha de ${editingClient.fullName} foi alterada com sucesso.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminMenu />
      <div className="container mx-auto px-4 py-6 md:py-8 pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Gerenciar Clientes</h2>
          <div className="w-full md:w-auto">
            <CreateClientDialog />
          </div>
        </div>

        {/* Loyalty Plan Management Card */}
        <Card className="mb-6 p-4 md:p-6 border-border">
          <CardHeader className="p-0 mb-3 md:mb-4">
            <CardTitle className="text-xl md:text-2xl font-bold">Plano de Fidelidade</CardTitle>
          </CardHeader>
          <CardContent className="p-0 mb-4">
            <Label htmlFor="loyalty-target" className="text-sm text-muted-foreground">Pontos necessários para recompensa</Label>
            <Input
              id="loyalty-target"
              type="number"
              inputMode="numeric"
              value={newLoyaltyTarget}
              onChange={(e) => setNewLoyaltyTarget(parseInt(e.target.value) || 0)}
              className="mt-2 h-11 md:h-10 bg-card border-border"
            />
          </CardContent>
          <CardFooter className="p-0">
            <Button onClick={handleSaveLoyaltyTarget} className="w-full md:w-auto h-11 md:h-10">Salvar Meta de Fidelidade</Button>
          </CardFooter>
        </Card>

        {/* Barra de Pesquisa */}
        <div className="relative w-full mb-6 mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, e-mail ou telefone..." 
            className="pl-11 h-12 bg-card border-border rounded-xl w-full text-base"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {displayedClients.length === 0 ? (
            <Card className="p-8 text-center border-border border-dashed bg-muted/20 col-span-full">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum cliente encontrado para sua pesquisa.' : 'Nenhum cliente cadastrado ainda.'}
              </p>
            </Card>
          ) : (
            displayedClients.map((client) => (
              <Card key={client.id} className="p-4 md:p-6 border-border flex flex-col hover:border-primary/30 transition-colors">
                <div className="flex-grow">
                  <h3 className="text-lg md:text-xl font-bold mb-3">{client.fullName}</h3>
                  <div className="space-y-1.5 md:space-y-2 mb-4">
                    {client.phone && <div className="flex items-center gap-2 text-zinc-500"><Phone className="w-4 h-4 shrink-0 text-primary/70" /><span className="text-sm">{client.phone}</span></div>}
                    {client.email && <div className="flex items-center gap-2 text-zinc-500"><Mail className="w-4 h-4 shrink-0 text-primary/70" /><span className="text-sm truncate">{client.email}</span></div>}
                    <div className="flex items-center gap-2 text-zinc-500"><Calendar className="w-4 h-4 shrink-0 text-primary/70" /><span className="text-sm">{getClientAppointmentsCount(client.id)} agendamento(s)</span></div>
                    <div className="flex items-center gap-2 text-primary font-bold bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20"><Star className="w-3.5 h-3.5" /><span className="text-[11px]">{client.loyaltyPoints || 0}/{loyaltyTarget} pts de fidelidade</span></div>
                  </div>
                  <p className="text-xs text-muted-foreground opacity-70">Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <CardFooter className="p-0 pt-4 mt-4 border-t border-border/50 gap-2">
                  <Button variant="outline" className="flex-1 text-sm h-11 md:h-10 border-primary/20 text-primary hover:bg-primary/10 transition-colors rounded-xl font-medium" onClick={() => setEditingClient(client)}>
                    <Edit className="w-4 h-4 mr-2" />Pontos
                  </Button>
                  <Button variant="outline" className="flex-1 text-sm h-11 md:h-10 border-primary/20 text-primary hover:bg-primary/10 transition-colors rounded-xl font-medium" onClick={() => { setEditingClient(client); setIsChangingPassword(true); }}>
                    <Lock className="w-4 h-4 mr-2" />Senha
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Mostrando <span className="font-medium">{filteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredClients.length)}</span> de <span className="font-medium">{filteredClients.length}</span> clientes
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium px-2">
              Página {currentPage} de {Math.max(1, totalPages)}
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!editingClient && !isChangingPassword} onOpenChange={(isOpen) => !isOpen && setEditingClient(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Pontos de Fidelidade</DialogTitle>
            <DialogDescription>
               Atualize o saldo de pontos de fidelidade do cliente selecionado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handlePointsChange(); }} className="py-4">
            <Label htmlFor="points">Pontos para <span className="font-bold">{editingClient?.fullName}</span></Label>
            <Input id="points" type="number" inputMode="numeric" value={newPoints} onChange={(e) => setNewPoints(parseInt(e.target.value) || 0)} className="mt-2" />
            
            <DialogFooter className="mt-6">
              <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
              <Button type="submit">Salvar Pontos</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!editingClient && isChangingPassword} onOpenChange={(isOpen) => !isOpen && (setEditingClient(null), setIsChangingPassword(false))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alterar Senha do Cliente</DialogTitle>
            <DialogDescription>
              Defina uma nova senha segura para o acesso deste cliente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Definindo nova senha para <span className="font-bold text-foreground">{editingClient?.fullName}</span></p>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
            
            <DialogFooter className="mt-6">
              <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
              <Button type="submit">Alterar Senha</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
