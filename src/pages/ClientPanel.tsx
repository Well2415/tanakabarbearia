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

const ClientPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showSensitiveData, setShowSensitiveData] = useState(false); // New state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false); // New state for edit profile dialog
  const [editProfileData, setEditProfileData] = useState({
    avatarUrl: '',
    favoriteProducts: '',
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
        favoriteProducts: currentUser.favoriteProducts?.join(', ') || '',
      });
    }
  }, [navigate]);

  if (!user) {
    return null; // or a loading spinner
  }

  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Serviço desconhecido';
  const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'Barbeiro desconhecido';

  const handleUpdateProfile = () => {
    if (!user) return;

    const updatedUsers = storage.getUsers().map(u =>
      u.id === user.id ? {
        ...u,
        avatarUrl: editProfileData.avatarUrl || undefined,
        favoriteProducts: editProfileData.favoriteProducts.split(',').map(p => p.trim()).filter(p => p !== '') || undefined,
      } : u
    );
    storage.saveUsers(updatedUsers);
    setUser(updatedUsers.find(u => u.id === user.id) || null); // Update current user state
    setIsEditProfileOpen(false);
    toast({ title: 'Perfil atualizado!', description: 'Seu perfil foi atualizado com sucesso.' });
  };

  const loyaltyPoints = user.loyaltyPoints || 0;
  const pointsToFreeHaircut = 10; // Example value

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
              {user.favoriteProducts && user.favoriteProducts.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Produtos Favoritos:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {user.favoriteProducts.map((product, idx) => (
                      <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{product}</span>
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
                            <p className="font-bold">{getServiceName(app.serviceId)}</p>
                            <p className="text-sm text-muted-foreground">com {getBarberName(app.barberId)}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(app.date), 'PPP', { locale: ptBR })} às {app.time}</p>
                          </div>
                          <div className="text-right">
                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' : 'bg-green-500/20 text-green-700'}`}>
                              {app.status}
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
              <Label htmlFor="edit-avatarUrl">URL do Avatar</Label>
              <Input id="edit-avatarUrl" value={editProfileData.avatarUrl} onChange={(e) => setEditProfileData({ ...editProfileData, avatarUrl: e.target.value })} placeholder="https://example.com/avatar.jpg" />
            </div>
            <div>
              <Label htmlFor="edit-favoriteProducts">Produtos Favoritos (separados por vírgula)</Label>
              <Textarea id="edit-favoriteProducts" value={editProfileData.favoriteProducts} onChange={(e) => setEditProfileData({ ...editProfileData, favoriteProducts: e.target.value })} placeholder="Pomada, Shampoo" />
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
