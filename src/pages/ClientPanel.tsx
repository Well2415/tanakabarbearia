import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { User, Appointment, Service, Barber } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { parseLocalDate } from '@/lib/timeUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const AVAILABLE_AVATARS = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
];

const ClientPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(() => storage.getCurrentUser());
  // ... (rest of states)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    avatarUrl: '',
    stylePreferences: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
      const allAppointments = storage.getAppointments();
      const userAppointments = allAppointments.filter(app => app.userId === currentUser.id);
      setAppointments(userAppointments);
      setServices(storage.getServices());
      setBarbers(storage.getBarbers());
      setEditProfileData({
        avatarUrl: currentUser.avatarUrl || '',
        stylePreferences: currentUser.stylePreferences?.join(', ') || '',
        newPassword: '',
        confirmPassword: '',
      });

      // Busca dados atualizados do usuário no banco (pontos de fidelidade, etc)
      storage.fetchUser(currentUser.id).then(updated => {
        if (updated) setUser({ ...updated });
      });
    }
  }, [navigate]);

  if (!user) {
    return null;
  }

  const getServiceName = (id: string | string[]) => {
    const ids = Array.isArray(id) ? id : [id];
    return ids.map(serviceId => services.find(s => s.id === serviceId)?.name).filter(Boolean).join(' + ') || 'Serviço desconhecido';
  };
  const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'Barbeiro desconhecido';

  const handleUpdateProfile = () => {
    if (!user) return;

    if (editProfileData.newPassword && editProfileData.newPassword !== editProfileData.confirmPassword) {
      toast({
        title: 'Erro na senha',
        description: 'As senhas não coincidem.',
        variant: 'destructive'
      });
      return;
    }

    const updatedUsers = storage.getUsers().map(u =>
      u.id === user.id ? {
        ...u,
        avatarUrl: editProfileData.avatarUrl || undefined,
        stylePreferences: editProfileData.stylePreferences.split(',').map(p => p.trim()).filter(p => p !== '') || undefined,
        password: editProfileData.newPassword || u.password,
      } : u
    );
    storage.saveUsers(updatedUsers);
    setUser(updatedUsers.find(u => u.id === user.id) || null);
    setIsEditProfileOpen(false);
    setEditProfileData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    toast({
      title: 'Perfil atualizado!',
      description: 'Seu perfil foi atualizado com sucesso.'
    });
  };

  const loyaltyPoints = user.loyaltyPoints || 0;
  const pointsToFreeHaircut = storage.getLoyaltyTarget();

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    confirmed: 'bg-blue-500/10 text-blue-600',
    cancelled: 'bg-red-500/10 text-red-600',
    in_progress: 'bg-purple-500/10 text-purple-600',
    completed: 'bg-green-500/10 text-green-600',
    no_show: 'bg-orange-500/10 text-orange-600',
  };

  const statusLabels = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    in_progress: 'Em Progresso',
    completed: 'Concluído',
    no_show: 'Não Compareceu',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <div className="pt-32 pb-20 px-4 flex-grow">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">
            Painel do Cliente
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Bem-vindo de volta, <span className="text-primary">{user.fullName}</span>!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* User Profile Card */}
            <Card className="p-6 flex flex-col items-center text-center border-border">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-24 h-24 rounded-full object-cover mb-4" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-4xl font-bold mb-4">{user.fullName.charAt(0)}</div>
              )}
              <h3 className="text-2xl font-bold mb-2">{user.fullName}</h3>
              {showSensitiveData && (
                <div className="text-muted-foreground text-sm mb-2">
                  <p>{user.email}</p>
                  <p>{user.phone}</p>
                </div>
              )}
              <Button variant="link" onClick={() => setShowSensitiveData(!showSensitiveData)} className="mb-4">
                {showSensitiveData ? 'Ocultar Dados' : 'Exibir Dados'}
              </Button>
              {user.cutsCount !== undefined && (
                <p className="text-muted-foreground mb-2">Cortes realizados: <span className="font-bold text-primary">{user.cutsCount}</span></p>
              )}
              {user.stylePreferences && user.stylePreferences.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Preferências de Estilo:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {user.stylePreferences.map((style, idx) => (
                      <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{style}</span>
                    ))}
                  </div>
                </div>
              )}
              <Button variant="outline" className="mt-4" onClick={() => setIsEditProfileOpen(true)}>Editar Perfil</Button>
            </Card>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointments.length > 0 ? (
                    <ul className="space-y-4">
                      {appointments.map(app => (
                        <li key={app.id} className="p-4 border rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-bold">{getServiceName(app.serviceIds || app.serviceId)}</p>
                            <p className="text-sm text-muted-foreground">com {getBarberName(app.barberId)}</p>
                            <p className="text-sm text-muted-foreground">{format(parseLocalDate(app.date), 'PPP', { locale: ptBR })} às {app.time}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[app.status] || 'bg-gray-500/10 text-gray-600'}`}>
                              {statusLabels[app.status] || app.status}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Você ainda não tem agendamentos.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Plano de Fidelidade</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-6xl font-bold text-primary">{loyaltyPoints}</p>
                  <p className="text-muted-foreground mb-4">pontos</p>
                  <div className="w-full bg-border rounded-full h-2.5 mb-2">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(loyaltyPoints / pointsToFreeHaircut) * 100}%` }}></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Faltam {Math.max(0, pointsToFreeHaircut - loyaltyPoints)} pontos para seu próximo corte grátis!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="mb-2 block">Escolha seu Avatar</Label>
              <div className="grid grid-cols-4 gap-4">
                {AVAILABLE_AVATARS.map((url) => (
                  <div
                    key={url}
                    onClick={() => setEditProfileData({ ...editProfileData, avatarUrl: url })}
                    className={cn(
                      "cursor-pointer rounded-full border-2 p-1 transition-all hover:scale-105",
                      editProfileData.avatarUrl === url ? "border-primary bg-primary/10" : "border-transparent"
                    )}
                  >
                    <img src={url} alt="Avatar Option" className="w-full h-full rounded-full object-cover aspect-square" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-stylePreferences">Preferências de Estilo (separados por vírgula)</Label>
              <Textarea id="edit-stylePreferences" value={editProfileData.stylePreferences} onChange={(e) => setEditProfileData({ ...editProfileData, stylePreferences: e.target.value })} placeholder="Degradê, Barba Alinhada" />
            </div>
            <div className="pt-4 border-t border-border space-y-4">
              <h4 className="font-semibold text-sm">Alterar Senha</h4>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={editProfileData.newPassword}
                  onChange={(e) => setEditProfileData({ ...editProfileData, newPassword: e.target.value })}
                  placeholder="Deixe em branco para não alterar"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={editProfileData.confirmPassword}
                  onChange={(e) => setEditProfileData({ ...editProfileData, confirmPassword: e.target.value })}
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateProfile}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default ClientPanel;
