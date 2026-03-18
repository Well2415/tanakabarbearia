import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, LayoutDashboard, Menu, Scissors } from 'lucide-react';
import { storage } from '@/lib/storage';
import { User } from '@/types';

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(() => storage.getCurrentUser());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [shopName, setShopName] = useState(() => storage.getShopName());
  const [shopLogo, setShopLogo] = useState(() => storage.getShopLogo());

  useEffect(() => {
    setUser(storage.getCurrentUser());
    setShopName(storage.getShopName());
    setShopLogo(storage.getShopLogo());
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    storage.logoutUser();
    setUser(null);
    navigate('/');
  };

  const handleHomeClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const agendarLink = user ? "/new-appointment" : "/booking";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-md shadow-md border-b border-border' : 'bg-transparent'}`}>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          <Link to="/" className="flex items-center gap-3 transition-colors" onClick={handleHomeClick}>
            {shopLogo ? (
              <img src={shopLogo} alt={shopName} className="h-16 w-auto drop-shadow-md transition-opacity hover:opacity-80" />
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-xl font-black text-primary drop-shadow-md leading-tight uppercase tracking-tighter italic">
                  {shopName.split(' ')[0]}
                </span>
                <span className="text-[10px] font-bold text-foreground/80 tracking-[0.2em] uppercase -mt-1">
                  {shopName.split(' ').slice(1).join(' ')}
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 font-medium">
            <Link to="/" className="text-foreground hover:text-primary transition-colors" onClick={handleHomeClick}>Início</Link>
            <Link to="/services" className="text-foreground hover:text-primary transition-colors">Serviços</Link>

            {user ? (
              <div className="flex items-center gap-4 ml-4">
                <span className="text-muted-foreground text-sm">Olá, {user.fullName.split(' ')[0]}</span>
                <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-700 bg-transparent text-foreground hover:bg-zinc-800 text-sm font-medium transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  Painel Central
                </Link>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4 ml-4">
                <Link to="/login" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium hover:bg-accent hover:text-accent-foreground h-9 px-3 rounded-md transition-colors">
                  Login
                </Link>
                <Link to={agendarLink} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 h-9 shadow-lg shadow-primary/20 transition-colors">
                  Agendar Agora
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/20">
                  <Menu className="h-8 w-8" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background border-l border-border w-[300px] sm:w-[400px]">
                <SheetHeader className="text-left pb-4 mb-4 border-b border-border flex items-center justify-center">
                  <SheetTitle className="sr-only">Navegação</SheetTitle>
                  {shopLogo ? (
                    <img src={shopLogo} alt={shopName} className="h-12 w-auto drop-shadow-md" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-black text-primary drop-shadow-md leading-tight uppercase tracking-tighter italic">
                        {shopName.split(' ')[0]}
                      </span>
                      <span className="text-[10px] font-bold text-foreground/80 tracking-[0.2em] uppercase -mt-1">
                        {shopName.split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                  )}
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-4 font-medium text-lg">
                  <Link to="/" className="text-foreground hover:text-primary transition-colors" onClick={() => { handleHomeClick(); setIsSheetOpen(false); }}>Início</Link>
                  <Link to="/services" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsSheetOpen(false)}>Serviços</Link>

                  <div className="h-px bg-border w-full my-2"></div>

                  {user ? (
                    <div className="flex flex-col gap-4">
                      <span className="text-muted-foreground text-sm">Logado como {user.fullName}</span>
                      <Link to="/dashboard" onClick={() => setIsSheetOpen(false)} className="flex items-center gap-3 w-full px-4 py-3 rounded-md border border-zinc-800 bg-transparent text-foreground hover:bg-zinc-800 text-sm font-medium transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                        Acessar Painel
                      </Link>
                      <Button onClick={() => { handleLogout(); setIsSheetOpen(false); }} variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground h-12">
                        <LogOut className="w-5 h-5 mr-3" />
                        Sair
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Link to="/login" onClick={() => setIsSheetOpen(false)} className="inline-flex items-center justify-center w-full whitespace-nowrap text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 rounded-xl transition-colors">
                        Login
                      </Link>
                      <Link to={agendarLink} onClick={() => setIsSheetOpen(false)} className="inline-flex items-center justify-center w-full whitespace-nowrap text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl shadow-md shadow-primary/20 transition-colors">
                        Agendar Agora
                      </Link>
                    </div>
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
