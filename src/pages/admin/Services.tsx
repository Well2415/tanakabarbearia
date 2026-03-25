import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import { ArrowLeft, Plus, Trash2, Clock, Star, Edit, Camera, Image as ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, cn } from '@/lib/utils';
import { Service } from '@/types';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { optimizeImage } from '@/lib/imageUtils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import serviceHaircut from '@/assets/service-haircut.jpg';
import serviceBeard from '@/assets/service-beard.jpg';
import serviceStyling from '@/assets/service-styling.jpg';

const defaultServiceImages = [serviceHaircut, serviceBeard, serviceStyling];

const Services = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    loyaltyPoints: '',
    image: '',
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'new-service') {
      setIsOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
      navigate('/dashboard');
    }
  }, [user, navigate, toast]);

  if (!user || user.role !== 'admin') return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
        image: formData.image,
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
        image: formData.image,
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
    setFormData({ name: '', description: '', duration: '', price: '', loyaltyPoints: '', image: '' }); // Reset form
  };

  const handleEditClick = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration: (service.duration || 0).toString(),
      price: (service.price || 0).toString(),
      loyaltyPoints: (service.loyaltyPoints || 0).toString(),
      image: service.image || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const updated = services.filter(s => s.id !== id);
    await storage.saveServices(updated);
    setServices(updated);
    toast({
      title: 'Serviço removido',
      description: 'O serviço foi removido com sucesso',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminMenu />

      <div className="container mx-auto px-4 py-8 pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold">Serviços</h2>

          {/* Dialog for New/Edit Service */}
          <Dialog open={isOpen || isEditModalOpen} onOpenChange={(open) => {
            if (!open) {
              setIsOpen(false);
              setIsEditModalOpen(false);
              setEditingService(null);
              setFormData({ name: '', description: '', duration: '', price: '', loyaltyPoints: '', image: '' }); // Reset form
            }
          }}>
            <DialogTrigger asChild onClick={() => {
              setEditingService(null); // Ensure no service is being edited when opening for new
              setFormData({ name: '', description: '', duration: '', price: '', loyaltyPoints: '', image: '' }); // Clear form
              setIsOpen(true);
            }}>
              <Button className="hidden md:flex w-full md:w-auto gap-2 h-12 md:h-10 text-lg md:text-base order-first md:order-last">
                <Plus className="w-5 h-5 md:w-4 h-4" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto pb-28 md:pb-6">
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

                <div className="space-y-2">
                  <Label>Foto do Serviço</Label>
                  <div className="max-w-[200px]">
                    <ImageUpload
                      value={formData.image}
                      onChange={(image) => setFormData({ ...formData, image })}
                      label="Carregar Foto"
                      maxWidth={600}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 italic mt-1">Otimização automática ativada.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duração (min)</Label>
                    <Input
                      id="duration"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.duration}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, duration: value });
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="text"
                      inputMode="decimal"
                      value={formData.price}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        // Allow only one decimal point
                        const parts = value.split('.');
                        if (parts.length > 2) return;
                        setFormData({ ...formData, price: value });
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="loyaltyPoints">Pontos</Label>
                    <Input
                      id="loyaltyPoints"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.loyaltyPoints}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, loyaltyPoints: value });
                      }}
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
          {services.map((service, index) => (
            <Card key={service.id} className="overflow-hidden border-border group shadow-md hover:shadow-lg transition-all">
              <div className="relative overflow-hidden">
                <AspectRatio ratio={16 / 9}>
                  <img
                    src={service.image || defaultServiceImages[index % defaultServiceImages.length]}
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </AspectRatio>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{service.name}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(service)}
                      className="rounded-full hover:bg-primary/20 hover:text-primary transition-colors h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
