import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scissors } from 'lucide-react';

export const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Scissors className="w-6 h-6" />
            <span className="font-bold text-xl">Beardy Flow</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Início
            </Link>
            <Link to="/services" className="text-foreground hover:text-primary transition-colors">
              Serviços
            </Link>
            <Link to="/booking" className="text-foreground hover:text-primary transition-colors">
              Agendar
            </Link>
            <Link to="/admin/login">
              <Button variant="outline" size="sm">
                Admin
              </Button>
            </Link>
          </div>

          <Link to="/booking" className="md:hidden">
            <Button size="sm">Agendar</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
