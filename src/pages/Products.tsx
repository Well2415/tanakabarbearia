import { useState } from 'react';
import { storage } from '@/lib/storage';
import { Product } from '@/types';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, MessageSquare, Package, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Input } from '@/components/ui/input';

const Products = () => {
  const [products] = useState<Product[]>(storage.getProducts().filter(p => p.active));
  const [searchTerm, setSearchTerm] = useState('');
  
  const shopPhone = storage.getShopPhone() || '5501199999999'; // Fallback
  const shopName = storage.getShopName() || 'Barbearia Tanaka';

  const handleWhatsAppBuy = (product: Product) => {
    const message = `Olá! Tenho interesse no produto: *${product.name}* (${formatCurrency(product.price)}). Ainda está disponível no estoque?`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${shopPhone}?text=${encodedMessage}`, '_blank');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-grow pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
              <ShoppingBag className="w-3 h-3" /> Nossos Produtos
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter italic">
              Produtos & <span className="text-primary">Acessórios</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Utilize os mesmos produtos que usamos na barbearia para manter seu visual impecável todos os dias.
            </p>
          </div>

          <div className="max-w-xl mx-auto mb-12 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar produtos ou categorias..." 
              className="pl-10 h-12 rounded-xl bg-card border-border/50 text-lg shadow-sm focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {!filteredProducts.length ? (
            <div className="text-center py-20 bg-card/30 rounded-3xl border border-dashed border-border py-20">
              <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-xl font-bold text-muted-foreground">Ops! Nenhum produto encontrado.</p>
              <Button variant="link" onClick={() => setSearchTerm('')} className="text-primary mt-2">Limpar busca</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden border-border bg-card/50 flex flex-col group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
                  <div className="relative">
                    <AspectRatio ratio={1}>
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ShoppingBag className="w-16 h-16 text-muted-foreground/10" />
                        </div>
                      )}
                    </AspectRatio>
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                        {product.category || 'Destaque'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-6 pt-4 border-t border-border/50">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Preço</span>
                        <span className="text-2xl font-black text-primary">{formatCurrency(product.price)}</span>
                      </div>
                      {product.stock !== undefined && (
                        <div className="text-right">
                           <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">Estoque</span>
                           <span className="text-sm font-bold text-foreground">{product.stock} unids</span>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl gap-3 shadow-lg shadow-green-900/10 active:scale-[0.98] transition-all"
                      onClick={() => handleWhatsAppBuy(product)}
                    >
                      <MessageSquare className="w-5 h-5 fill-current" />
                      Pedir pelo WhatsApp
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
