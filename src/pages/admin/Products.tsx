import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { storage } from '@/lib/storage';
import { Plus, Trash2, Edit, ShoppingBag, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const AdminProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [products, setProducts] = useState<Product[]>(storage.getProducts());
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: '',
    active: true
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('action') === 'new-product') {
      setIsOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast({ title: "Acesso Negado", variant: "destructive" });
      navigate('/dashboard');
    }
  }, [user, navigate, toast]);

  if (!user || user.role !== 'admin') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      image: formData.image,
      active: formData.active
    };

    let updatedProducts;
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === productData.id ? productData : p);
      toast({ title: 'Produto atualizado' });
    } else {
      updatedProducts = [...products, productData];
      toast({ title: 'Produto adicionado' });
    }

    storage.saveProducts(updatedProducts);
    setProducts(updatedProducts);
    handleClose();
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category || '',
      stock: (product.stock || 0).toString(),
      image: product.image || '',
      active: product.active
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    storage.saveProducts(updated);
    setProducts(updated);
    toast({ title: 'Produto removido' });
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', category: '', stock: '', image: '', active: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminMenu />

      <div className="container mx-auto px-4 py-8 pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold">Gestão de Produtos</h2>

          <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto gap-2">
                <Plus className="w-4 h-4" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input id="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="Ex: Pomada, Óleo" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Estoque</Label>
                    <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Imagem do Produto</Label>
                  <ImageUpload 
                    value={formData.image} 
                    onChange={(image) => setFormData({...formData, image})} 
                    label="Carregar Foto"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="space-y-0.5">
                    <Label>Produto Ativo</Label>
                    <p className="text-xs text-muted-foreground italic">Visível para os clientes no site</p>
                  </div>
                  <Switch checked={formData.active} onCheckedChange={(active) => setFormData({...formData, active})} />
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-bold">
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {products.length === 0 ? (
          <Card className="p-12 text-center border-dashed bg-muted/20">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum produto cadastrado.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className={`overflow-hidden border-border flex flex-col group transition-all ${!product.active ? 'opacity-60 grayscale' : ''}`}>
                <div className="relative">
                  <AspectRatio ratio={1}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-muted-foreground/20" />
                      </div>
                    )}
                  </AspectRatio>
                  {!product.active && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                       <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Inativo</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{product.category || 'Geral'}</p>
                      <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleEditClick(product)}>
                        <Edit className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">{product.description}</p>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-border">
                    <span className="font-black text-xl text-primary">{formatCurrency(product.price)}</span>
                    <span className="text-xs font-medium text-muted-foreground">Estoque: {product.stock || 0}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
