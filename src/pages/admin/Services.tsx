import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import { ArrowLeft, Plus, Trash2, Clock, Star, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Service } from '@/types';

const Services = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [services, setServices] = useState(storage.getServices());
  const [isOpen, setIsOpen] = useState(false); // For new service dialog
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // For edit service dialog
  const [editingService, setEditingService] = useState<Service | null>(null); // Service being edited
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    loyaltyPoints: '', // New field
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
      navigate('/dashboard');
    }
  }, [user, navigate, toast]);

  if (!user || user.role !== 'admin') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingService) {
      // Editing existing service
      const updatedService: Service = {
        ...editingService,
        name: formData.name,
        description: formData.description,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        loyaltyPoints: parseInt(formData.loyaltyPoints),
      };
      const updatedServices = services.map(s => s.id === updatedService.id ? updatedService : s);
      storage.saveServices(updatedServices);
      setServices(updatedServices);
      setIsEditModalOpen(false);
      setEditingService(null);
      toast({
        title: 'Serviço atualizado',
        description: 'O serviço foi atualizado com sucesso',
      });
    } else {
      // Creating new service
      const newService: Service = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        loyaltyPoints: parseInt(formData.loyaltyPoints),
      };
      const updatedServices = [...services, newService];
      storage.saveServices(updatedServices);
      setServices(updatedServices);
      setIsOpen(false);
      toast({
        title: 'Serviço adicionado',
        description: 'O serviço foi cadastrado com sucesso',
      });
    }
    setFormData({ name: '', description: '', duration: '', price: '', loyaltyPoints: '' }); // Reset form
  };

  const handleEditClick = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration: (service.duration || 0).toString(),
      price: (service.price || 0).toString(),
      loyaltyPoints: (service.loyaltyPoints || 0).toString(),
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = services.filter(s => s.id !== id);
    storage.saveServices(updated);
    setServices(updated);
    toast({
      title: 'Serviço removido',
      description: 'O serviço foi removido com sucesso',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Serviços</h2>
          
          {/* Dialog for New/Edit Service */}
          <Dialog open={isOpen || isEditModalOpen} onOpenChange={(open) => {
            if (!open) {
              setIsOpen(false);
              setIsEditModalOpen(false);
              setEditingService(null);
              setFormData({ name: '', description: '', duration: '', price: '', loyaltyPoints: '' }); // Reset form
            }
          }}>
            <DialogTrigger onClick={() => { // onClick directly on DialogTrigger
                setEditingService(null); // Ensure no service is being edited when opening for new
                setFormData({ name: '', description: '', duration: '', price: '', loyaltyPoints: '' }); // Clear form
                setIsOpen(true);
              }}>
                <span className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Serviço
                </span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}</DialogTitle>
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
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duração (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="loyaltyPoints">Pontos de Fidelidade</Label>
                    <Input
                      id="loyaltyPoints"
                      type="number"
                      value={formData.loyaltyPoints}
                      onChange={(e) => setFormData({ ...formData, loyaltyPoints: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">{editingService ? 'Salvar Alterações' : 'Cadastrar'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="p-6 border-border">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{service.name}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(service)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">{service.description}</p>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{service.duration} min</span>
              </div>
              <div className="text-2xl font-bold text-primary mb-2">
                R$ {service.price.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="w-4 h-4" />
                <span className="text-sm">{service.loyaltyPoints} pontos de fidelidade</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
