import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import { ArrowLeft, Plus, Trash2, Scissors } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Barber } from '@/types';

const Barbers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [barbers, setBarbers] = useState(storage.getBarbers());
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialties: '',
  });

  useEffect(() => {
    if (!user) navigate('/admin/login');
  }, [user, navigate]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBarber: Barber = {
      id: Date.now().toString(),
      name: formData.name,
      specialties: formData.specialties.split(',').map(s => s.trim()),
      availableHours: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
    };

    const updated = [...barbers, newBarber];
    storage.saveBarbers(updated);
    setBarbers(updated);
    setIsOpen(false);
    setFormData({ name: '', specialties: '' });
    
    toast({
      title: 'Barbeiro adicionado',
      description: 'O barbeiro foi cadastrado com sucesso',
    });
  };

  const handleDelete = (id: string) => {
    const updated = barbers.filter(b => b.id !== id);
    storage.saveBarbers(updated);
    setBarbers(updated);
    toast({
      title: 'Barbeiro removido',
      description: 'O barbeiro foi removido com sucesso',
    });
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Barbeiros</h2>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Barbeiro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Barbeiro</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
                  <Input
                    id="specialties"
                    value={formData.specialties}
                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                    placeholder="Corte Clássico, Fade, Barba"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Cadastrar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map((barber) => (
            <Card key={barber.id} className="p-6 border-border">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Scissors className="w-8 h-8 text-primary" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(barber.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="text-xl font-bold mb-2">{barber.name}</h3>
              <div className="flex flex-wrap gap-2">
                {barber.specialties.map((specialty, idx) => (
                  <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {specialty}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Barbers;
