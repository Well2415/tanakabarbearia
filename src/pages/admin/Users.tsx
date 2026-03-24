import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const Users = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const loggedInUser = storage.getCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<User['role'] | ''>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedBarber, setSelectedBarber] = useState<string | undefined>(undefined);

  // New states for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
    setSelectedBarber(user.barberId || (barbers.length > 0 ? barbers[0].id : undefined));
  };

  const handleUserUpdate = () => {
    if (!editingUser || !newRole) return;

    if (password && password !== confirmPassword) {
      toast({ title: 'Erro na senha', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }

    let finalBarberId = selectedBarber;
    if (newRole === 'barber' && !finalBarberId && barbers.length > 0) {
      finalBarberId = barbers[0].id;
    }

    const updatedUsers = users.map(u => {
      if (u.id === editingUser.id) {
        const updated: User = { 
          ...u, 
          role: newRole as User['role'], 
          barberId: newRole === 'barber' ? finalBarberId : undefined 
        };
        if (password) {
           updated.password = password;
        }
        return updated;
      }
      return u;
    });

    storage.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    setEditingUser(null);
    setPassword('');
    setConfirmPassword('');
    setSelectedBarber(undefined);
    toast({ title: 'Usuário atualizado!', description: `As informações de ${editingUser.fullName} foram salvas.` });
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
    admin: 'bg-primary/20 text-primary border-primary/30',
    barber: 'bg-accent text-accent-foreground border-border',
    client: 'bg-muted text-muted-foreground border-border',
  };

  // Filter Logic
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const searchLower = searchTerm.toLowerCase();
    const fullNameMatches = user.fullName ? user.fullName.toLowerCase().includes(searchLower) : false;
    const usernameMatches = user.username ? user.username.toLowerCase().includes(searchLower) : false;
    const phoneMatches = user.phone ? user.phone.includes(searchTerm) : false;
    const emailMatches = user.email ? user.email.toLowerCase().includes(searchLower) : false;

    const matchesSearch = searchTerm === '' || fullNameMatches || usernameMatches || phoneMatches || emailMatches;
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-background">
      <AdminMenu />
      <div className="container mx-auto px-4 py-8 pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold">Gerenciar Usuários</h2>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, email ou telefone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
              <SelectItem value="barber">Barbeiro</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block border rounded-lg bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{user.username}</span>
                        {user.phone && <span className="text-xs text-muted-foreground">{user.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={roleColors[user.role]}>{user.role}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/20 hover:text-primary transition-colors" onClick={() => handleEditClick(user)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => handleDelete(user.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {paginatedUsers.length > 0 ? (
            paginatedUsers.map(user => (
              <Card key={user.id} className="p-4 border-border">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-lg leading-tight truncate">{user.fullName}</h3>
                    <p className="text-sm text-muted-foreground truncate">{user.username}</p>
                    {user.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
                  </div>
                  <Badge className={roleColors[user.role]}>{user.role}</Badge>
                </div>
                <div className="flex gap-2 justify-end pt-3 border-t border-border/50">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(user)} className="flex-1">
                    <Edit className="h-4 w-4 mr-2"/> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(user.id)} className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                    <Trash2 className="h-4 w-4 mr-2"/> Excluir
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              Nenhum usuário encontrado.
            </Card>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium">{filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de <span className="font-medium">{filteredUsers.length}</span> usuários
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

      <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
        <DialogContent className="w-[95vw] max-w-[425px] rounded-xl p-6 max-h-[90vh] overflow-y-auto pb-28 md:pb-6">
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">Alterar permissões de <span className="font-bold text-foreground">{editingUser?.fullName}</span>:</p>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as User['role'])}>
              <SelectTrigger><SelectValue placeholder="Selecione uma função" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="barber">Barbeiro</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
              </SelectContent>
            </Select>

            {newRole === 'barber' && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Vincular a qual barbeiro?</p>
                <Select value={selectedBarber} onValueChange={(value) => setSelectedBarber(value)}>
                  <SelectTrigger><SelectValue placeholder="Selecione um barbeiro" /></SelectTrigger>
                  <SelectContent>
                    {barbers.map(barber => (
                      <SelectItem key={barber.id} value={barber.id}>{barber.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-bold mb-4 flex items-center gap-2">
                 <Lock className="w-4 h-4 text-primary" /> Alterar Senha
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha (deixe em branco para manter)</Label>
                  <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button></DialogClose>
            <Button onClick={handleUserUpdate} className="w-full sm:w-auto">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { Users };
