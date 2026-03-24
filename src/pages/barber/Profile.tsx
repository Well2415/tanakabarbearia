import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, User as UserIcon, Lock, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { AdminMenu } from '@/components/admin/AdminMenu';

const BarberProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [barberData, setBarberData] = useState<any>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'barber' && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const barbers = storage.getBarbers();
    // Encontrar o barbeiro associado ao usuário logado
    const bId = user.role === 'admin' ? 'admin' : (user.barberId || user.id);
    const barber = barbers.find(b => b.id === bId);

    if (barber) {
      setBarberData(barber);
      setName(barber.name || user.fullName);
      setBio(barber.bio || '');
      setDescription(barber.description || '');
      setPhoto(barber.photo || user.avatarUrl || '');
    } else {
      setName(user.fullName);
      setPhoto(user.avatarUrl || '');
    }
  }, [user, navigate]);

  const handleSave = async () => {
    if (!user) return;

    if (password && password !== confirmPassword) {
      toast({
        title: 'Erro na senha',
        description: 'As senhas não coincidem.',
        variant: 'destructive'
      });
      return;
    }

    // Save to User
    const users = storage.getUsers();
    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          fullName: name,
          avatarUrl: photo,
          password: password ? password : u.password
        };
      }
      return u;
    });
    await storage.saveUsers(updatedUsers);

    // Save to Barber
    if (barberData) {
      const barbers = storage.getBarbers();
      const updatedBarbers = barbers.map(b => {
        if (b.id === barberData.id) {
          return { ...b, name, bio, description, photo };
        }
        return b;
      });
      await storage.saveBarbers(updatedBarbers);
    }

    toast({ title: 'Perfil Atualizado', description: 'Suas informações foram salvas com sucesso!' });
    navigate('/dashboard');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminMenu />

      <main className="flex-grow pt-8 pb-20 px-4">
        <div className="container mx-auto max-w-2xl space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary"/> Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-[200px]">
                <ImageUpload
                  value={photo}
                  onChange={setPhoto}
                  label="Alterar Foto"
                  maxWidth={400}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserIcon className="w-5 h-5 text-primary"/> Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome de Exibição</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
              </div>

              {barberData && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografia Curta</Label>
                    <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Especialista em degrade..." className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição Completa</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="h-24" placeholder="Fale um pouco sobre a sua experiência..." />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-primary"/>  Segurança</CardTitle>
              <CardDescription>Deixe em branco se não quiser alterar a senha.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="h-12" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full h-14 text-lg font-bold">
            <Save className="w-5 h-5 mr-2" /> Salvar Alterações
          </Button>
        </div>
      </main>
    </div>
  );
};

export default BarberProfile;
