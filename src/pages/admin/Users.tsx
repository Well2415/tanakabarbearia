import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const Users = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const loggedInUser = storage.getCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<User['role'] | '' >('');
  const [selectedBarber, setSelectedBarber] = useState<string | undefined>(undefined);

  const barbers = storage.getBarbers();

  const usersLoaded = useRef(false);

  useEffect(() => {
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      toast({ title: "Acesso Negado", variant: "destructive" });
      navigate('/dashboard');
    } else if (!usersLoaded.current) {
      setUsers(storage.getUsers());
      usersLoaded.current = true;
    }
  }, [loggedInUser, navigate, toast]);

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
    setSelectedBarber(user.barberId || (barbers.length > 0 ? barbers[0].id : undefined));
  };

  const handleRoleChange = () => {
    if (!editingUser || !newRole) return;

    let finalBarberId = selectedBarber;
    if (newRole === 'barber' && !finalBarberId && barbers.length > 0) {
      finalBarberId = barbers[0].id;
    }

    const updatedUsers = users.map(u => 
      u.id === editingUser.id 
        ? { ...u, role: newRole as User['role'], barberId: newRole === 'barber' ? finalBarberId : undefined } 
        : u
    );
    storage.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    setEditingUser(null);
    setSelectedBarber(undefined);
    toast({ title: 'Permissão alterada!', description: `O usuário ${editingUser.fullName} agora é ${newRole}.` });
  };

  const handleDelete = (userId: string) => {
    if (userId === loggedInUser?.id) {
      toast({ title: 'Ação inválida', description: 'Você não pode remover sua própria conta.', variant: 'destructive' });
      return;
    }
    const updatedUsers = users.filter(u => u.id !== userId);
    storage.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    toast({ title: 'Usuário removido', description: 'A conta de usuário foi removida com sucesso.' });
  };



  const roleColors: { [key in User['role']]: string } = {
    admin: 'bg-red-500/20 text-red-700',
    barber: 'bg-blue-500/20 text-blue-700',
    client: 'bg-gray-500/20 text-gray-700',
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border"><div className="container mx-auto px-4 py-4"><Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Voltar ao Dashboard</Button></Link></div></nav>
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Gerenciar Usuários</h2>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell><Badge className={roleColors[user.role]}>{user.role}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(user.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Função do Usuário</DialogTitle></DialogHeader>
          <div className="py-4">
            <p>Alterar a função de <span className="font-bold">{editingUser?.fullName}</span> para:</p>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as User['role'])}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Selecione uma função" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="barber">Barbeiro</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
              </SelectContent>
            </Select>

            {newRole === 'barber' && (
              <div className="mt-4">
                <p>Vincular a qual barbeiro?</p>
                <Select value={selectedBarber} onValueChange={(value) => setSelectedBarber(value)}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Selecione um barbeiro" /></SelectTrigger>
                  <SelectContent>
                    {barbers.map(barber => (
                      <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleRoleChange}>Salvar Alteração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { Users };
