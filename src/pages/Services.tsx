import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { storage } from '@/lib/storage';
import { Clock } from 'lucide-react';

const Services = () => {
  const services = storage.getServices();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold text-center mb-4">
            Nossos <span className="text-primary">Serviços</span>
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Oferecemos uma gama completa de serviços para cuidar do seu visual
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.map((service) => (
              <Card key={service.id} className="p-8 border-border hover:border-primary transition-all hover:shadow-lg">
                <h3 className="text-2xl font-bold mb-3">{service.name}</h3>
                <p className="text-muted-foreground mb-6">{service.description}</p>
                
                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{service.duration} minutos</span>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-border">
                  <span className="text-3xl font-bold text-primary">
                    R$ {service.price}
                  </span>
                  <Link to="/booking">
                    <Button size="sm">Agendar</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/booking">
              <Button size="lg">Agendar Agora</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Services;
