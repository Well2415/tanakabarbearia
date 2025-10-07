import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Scissors, LogOut, LayoutDashboard, Menu } from 'lucide-react';
import { storage } from '@/lib/storage';
import { User } from '@/types';

export const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    setUser(storage.getCurrentUser());
  }, [window.location.pathname]);

  const handleLogout = () => {
    storage.logoutUser();
    setUser(null);
    navigate('/');
  };

  const agendarLink = user ? "/new-appointment" : "/booking";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Scissors className="w-6 h-6" />
            <span className="font-bold text-xl">Beardy Flow</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">Início</Link>
            <Link to="/services" className="text-foreground hover:text-primary transition-colors">Serviços</Link>
            <Link to={agendarLink} className="text-foreground hover:text-primary transition-colors">Agendar</Link>

            {user ? (
              <>
                <span className="text-muted-foreground text-sm">Olá, {user.fullName.split(' ')[0]}</span>
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4"/>
                    Meu Painel
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Navegação</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  <Link to="/" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsSheetOpen(false)}>Início</Link>
                  <Link to="/services" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsSheetOpen(false)}>Serviços</Link>
                  <Link to={agendarLink} className="text-foreground hover:text-primary transition-colors" onClick={() => setIsSheetOpen(false)}>Agendar</Link>

                  {user ? (
                    <>
                      <span className="text-muted-foreground text-sm">Olá, {user.fullName.split(' ')[0]}</span>
                      <Link to="/dashboard" onClick={() => setIsSheetOpen(false)}>
                        <Button variant="outline" className="w-full flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4"/>
                          Meu Painel
                        </Button>
                      </Link>
                      <Button onClick={() => { handleLogout(); setIsSheetOpen(false); }} variant="ghost" className="w-full flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Sair
                      </Button>
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setIsSheetOpen(false)}>
                      <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>
    </nav>
  );
};
