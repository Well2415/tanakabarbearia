import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
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
    image2: '',
    image3: '',
    image4: '',
    active: true,
    variants: [] as any[]
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'new-product') {
      setIsOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast({ title: "Acesso Negado", variant: "destructive" });
      navigate('/dashboard');
    }
  }, [user, navigate, toast]);

  if (!user || user.role !== 'admin') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      image: formData.image,
      image2: formData.image2,
      image3: formData.image3,
      image4: formData.image4,
      active: formData.active,
      variants: formData.variants.length > 0 ? formData.variants : undefined
    };

    await storage.updateProduct(productData);
    if (editingProduct) {
      setProducts(products.map(p => p.id === productData.id ? productData : p));
      toast({ title: 'Produto atualizado' });
    } else {
      setProducts([...products, productData]);
      toast({ title: 'Produto adicionado' });
    }
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
      image2: product.image2 || '',
      image3: product.image3 || '',
      image4: product.image4 || '',
      active: product.active,
      variants: product.variants || []
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    await storage.deleteProduct(id);
    setProducts(products.filter(p => p.id !== id));
    toast({ title: 'Produto removido' });
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', category: '', stock: '', image: '', image2: '', image3: '', image4: '', active: true, variants: [] });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminMenu />

      <div className="container mx-auto px-4 py-8 pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold">Gestão de Produtos</h2>

          <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto gap-2" onClick={() => setIsOpen(true)}>
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Foto 1</Label>
                    <ImageUpload 
                      value={formData.image} 
                      onChange={(image) => setFormData({...formData, image})} 
                      label="Principal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Foto 2</Label>
                    <ImageUpload 
                      value={formData.image2} 
                      onChange={(image2) => setFormData({...formData, image2})} 
                      label="Foto 2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Foto 3</Label>
                    <ImageUpload 
                      value={formData.image3} 
                      onChange={(image3) => setFormData({...formData, image3})} 
                      label="Foto 3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Foto 4</Label>
                    <ImageUpload 
                      value={formData.image4} 
                      onChange={(image4) => setFormData({...formData, image4})} 
                      label="Foto 4"
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-bold">Variantes de Peso (Gramatura)</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFormData({
                        ...formData, 
                        variants: [
                          ...formData.variants, 
                          { id: Date.now().toString(), weight: '', price: parseFloat(formData.price) || 0, stock: parseInt(formData.stock) || 0, imageIndices: [0] }
                        ]
                      })}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Peso
                    </Button>
                  </div>
                  
                  {formData.variants.length > 0 ? (
                    <div className="space-y-3">
                      {formData.variants.map((variant, index) => (
                        <div key={variant.id} className="grid grid-cols-12 gap-2 items-end bg-card p-3 rounded-lg border border-border/50">
                          <div className="col-span-3 space-y-1">
                            <Label className="text-[10px] uppercase">Grama</Label>
                            <Input 
                              placeholder="100g" 
                              value={variant.weight} 
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].weight = e.target.value;
                                setFormData({...formData, variants: newVariants});
                              }}
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px] uppercase">R$</Label>
                            <Input 
                              type="number" 
                              step="0.01"
                              value={variant.price} 
                              className="px-1"
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].price = parseFloat(e.target.value);
                                setFormData({...formData, variants: newVariants});
                              }}
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px] uppercase">Estoque</Label>
                            <Input 
                              type="number" 
                              value={variant.stock || 0} 
                              className="px-1"
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].stock = parseInt(e.target.value);
                                setFormData({...formData, variants: newVariants});
                              }}
                            />
                          </div>
                          <div className="col-span-3 space-y-1">
                            <Label className="text-[10px] uppercase text-center block">Fotos</Label>
                            <div className="flex justify-center gap-0.5">
                              {[0, 1, 2, 3].map((idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const newVariants = [...formData.variants];
                                    const currentIndices = newVariants[index].imageIndices || [];
                                    if (currentIndices.includes(idx)) {
                                      newVariants[index].imageIndices = currentIndices.filter(i => i !== idx);
                                    } else {
                                      newVariants[index].imageIndices = [...currentIndices, idx].sort();
                                    }
                                    setFormData({...formData, variants: newVariants});
                                  }}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold border transition-all ${
                                    (variant.imageIndices || []).includes(idx)
                                      ? 'bg-primary border-primary text-primary-foreground'
                                      : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                                  }`}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="col-span-2 flex justify-center pb-1">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive h-8 w-8"
                              onClick={() => {
                                const newVariants = formData.variants.filter((_, i) => i !== index);
                                setFormData({...formData, variants: newVariants});
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center">Nenhuma variante cadastrada para este produto.</p>
                  )}
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
