import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { storage } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit, Eye, EyeOff, Scissors, Tag, Mail, Phone, Star } from 'lucide-react';
import { User, Barber, Cut } from '@/types';
import { ClientView } from '@/components/dashboard/ClientView';
import { StaffView } from '@/components/dashboard/StaffView';
import { MiniProfile } from '@/components/dashboard/MiniProfile';
import { cn } from '@/lib/utils';
import { notificationManager } from '@/lib/notifications';
import { Bell, BellOff } from 'lucide-react';

const AVAILABLE_AVATARS = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(() => storage.getCurrentUser());
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    avatarUrl: '',
    phone: '',
    stylePreferences: '',
  });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);

  // Placeholder for My Best Barber
  const bestBarber: Barber | null = storage.getBarbers().find(barber => barber.name === 'João Silva') || null; // Example: picking João Silva

  // Placeholder for My Latest Cuts
  const placeholderCuts: Cut[] = user?.latestCuts || [
    { id: 'cut1', date: '2025-09-28', barberName: 'João Silva', imageUrl: '/public/service-haircut.jpg', service: 'Corte Clássico' },
    { id: 'cut2', date: '2025-09-15', barberName: 'Carlos Santos', imageUrl: '/public/service-beard.jpg', service: 'Barba Completa' },
  ];

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setEditProfileData({
        avatarUrl: currentUser.avatarUrl || '',
        phone: currentUser.phone || '',
        stylePreferences: currentUser.stylePreferences?.join(', ') || '',
      });

      // Check Push Status
      notificationManager.isSupported().then(supported => {
        setIsPushSupported(supported);
        if (supported) {
          notificationManager.getPermissionStatus().then(status => {
            setPushEnabled(status === 'granted' && !!currentUser.pushSubscription);
          });
        }
      });
    }
  }, [navigate]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    const updatedUser = {
      ...user,
      phone: editProfileData.phone || undefined,
      avatarUrl: editProfileData.avatarUrl || undefined,
      stylePreferences: editProfileData.stylePreferences.split(',').map(p => p.trim()).filter(p => p !== '') || undefined,
    };
    
    await storage.updateUser(updatedUser);
    setUser(updatedUser);
    setIsEditProfileOpen(false);
    toast({ title: 'Perfil atualizado!', description: 'Seu perfil foi atualizado com sucesso.' });
  };

  const handleTogglePush = async () => {
    if (!user) return;

    if (!pushEnabled) {
      const granted = await notificationManager.requestPermission();
      if (granted) {
        const sub = await notificationManager.subscribe();
        if (sub) {
          await notificationManager.syncSubscriptionWithUser(user.id, sub);
          setPushEnabled(true);
          toast({ title: 'Notificações Ativadas!', description: 'Você receberá avisos sobre seus agendamentos.' });
          
          // Refresh user in context
          const updatedUser = { ...user, pushSubscription: JSON.stringify(sub) };
          setUser(updatedUser);
          const allUsers = storage.getUsers().map(u => u.id === user.id ? updatedUser : u);
          storage.saveUsers(allUsers);
        } else {
          toast({ title: 'Erro', description: 'Não foi possível configurar as notificações.', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Permissão Negatada', description: 'Ative as notificações nas configurações do seu navegador.', variant: 'destructive' });
      }
    } else {
      // Unsubscribe logic (Optional for now)
      await notificationManager.syncSubscriptionWithUser(user.id, null);
      setPushEnabled(false);
      toast({ title: 'Notificações Desativadas', description: 'Você não receberá mais avisos por este dispositivo.' });
      
      const updatedUser = { ...user, pushSubscription: null };
      setUser(updatedUser);
      const allUsers = storage.getUsers().map(u => u.id === user.id ? updatedUser : u);
      storage.saveUsers(allUsers);
    }
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  const isStaff = user.role === 'admin' || user.role === 'barber';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-grow pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold mb-8 px-4 text-center lg:text-left">
            Meu Painel
          </h1>
          <div className="mb-24">
            <MiniProfile 
              user={user} 
              setIsEditProfileOpen={() => {
                if (isStaff) {
                  navigate('/barber/profile');
                } else {
                  setIsEditProfileOpen(true);
                }
              }} 
              bestBarber={bestBarber} 
            />
          </div>

          {/* Notificações Push Seção */}
          {isPushSupported && (
            <Card className="mb-8 p-6 border-primary/20 bg-primary/5 backdrop-blur-sm rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  pushEnabled ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-500"
                )}>
                  {pushEnabled ? <Bell className="w-6 h-6 animate-pulse" /> : <BellOff className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">Notificações no Celular</h3>
                  <p className="text-xs text-muted-foreground">Receba avisos de confirmação e lembretes 2h antes.</p>
                </div>
              </div>
              <Button 
                onClick={handleTogglePush}
                variant={pushEnabled ? "outline" : "default"}
                className={cn(
                  "rounded-xl font-bold px-8 h-12",
                  pushEnabled ? "border-primary/50 text-primary" : "bg-primary text-primary-foreground"
                )}
              >
                {pushEnabled ? "DESATIVAR" : "ATIVAR AGORA"}
              </Button>
            </Card>
          )}

          <div className="flex flex-col gap-8 mt-8">
            {isStaff ? <StaffView user={user} /> : <ClientView user={user} />}
          </div>
        </div> {/* Closing tag for container mx-auto max-w-6xl */}
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
                <Label htmlFor="edit-phone">Número de Telefone</Label>
                <Input id="edit-phone" type="tel" value={editProfileData.phone} onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })} placeholder="(11) 99999-9999" className="h-12" />
              </div>
              <div>
                <Label htmlFor="edit-stylePreferences">Preferências de Estilo (separados por vírgula)</Label>
                <Textarea id="edit-stylePreferences" value={editProfileData.stylePreferences} onChange={(e) => setEditProfileData({ ...editProfileData, stylePreferences: e.target.value })} placeholder="Degradê, Barba Alinhada" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
              <Button onClick={handleUpdateProfile}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );

};

export default Dashboard;
