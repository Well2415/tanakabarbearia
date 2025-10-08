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

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    avatarUrl: '',
    favoriteProducts: '',
  });

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
      setUser(currentUser);
      setEditProfileData({
        avatarUrl: currentUser.avatarUrl || '',
        favoriteProducts: currentUser.favoriteProducts?.join(', ') || '',
      });
    }
  }, [navigate]);

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
          <MiniProfile user={user} setIsEditProfileOpen={setIsEditProfileOpen} bestBarber={bestBarber} className="mb-24" /> {/* Increased mb to mb-24 for even more spacing */}
          <div className="flex flex-col gap-8 mt-8"> {/* Main content wrapper, added mt-8 */}
            {isStaff ? <StaffView user={user} /> : <ClientView user={user} />}
          </div>
        </div> {/* Closing tag for container mx-auto max-w-6xl */}
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
      </main>
      <Footer />
    </div>
  );

};

export default Dashboard;
