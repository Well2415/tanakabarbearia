import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { LayoutDashboard, Calendar, Scissors, Users, TrendingUp, LogOut, Home, Plus, UserCog, Settings, Clock, Palmtree, UmbrellaOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CreateClientDialog } from './CreateClientDialog';
import { useToast } from '@/hooks/use-toast';

export const AdminMenu = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = storage.getCurrentUser();

    const handleLogout = () => {
        storage.logoutUser();
        navigate('/login');
    };

    const [pendingCount, setPendingCount] = useState(0);
    const [isHolidayMode, setIsHolidayMode] = useState(storage.getHolidayMode());
    const [shopLogo] = useState(storage.getShopLogo());
    const [shopName] = useState(storage.getShopName());

    useEffect(() => {
        const appointments = storage.getAppointments();
        setPendingCount(appointments.filter(a => a.status === 'pending').length);
    }, []);

    const toggleHolidayMode = (checked: boolean) => {
        storage.saveHolidayMode(checked);
        setIsHolidayMode(checked);
        toast({
            title: checked ? 'Modo de Férias Ativado' : 'Modo de Férias Desativado',
            description: checked ? 'Novos agendamentos foram bloqueados.' : 'Agenda aberta para novos agendamentos.',
            variant: checked ? 'default' : 'default'
        });
    };

    const navItems = user?.role === 'admin' ? [
        { name: 'Início', path: '/admin/dashboard', icon: LayoutDashboard },
        {
            name: 'Agenda',
            path: '/admin/appointments',
            icon: Calendar,
            badge: pendingCount > 0 ? pendingCount : undefined
        },
        { name: 'Equipe', path: '/admin/barbers', icon: UserCog },
        { name: 'Serviços', path: '/admin/services', icon: Scissors },
        { name: 'Clientes', path: '/admin/clients', icon: Users },
        { name: 'Financeiro', path: '/barber/finance', icon: TrendingUp },
        { name: 'Ajustes', path: '/admin/settings', icon: Settings },
    ] : [
        { name: 'Minha Agenda', path: '/my-schedule', icon: Calendar },
        { name: 'Financeiro', path: '/barber/finance', icon: TrendingUp },
        { name: 'Início', path: '/dashboard', icon: LayoutDashboard },
    ];

    if (!user || (user.role !== 'admin' && user.role !== 'barber')) {
        return null;
    }

    return (
        <>
            {/* Desktop Navigation Menu (Top Bar / Horizontal Tabs) */}
            <nav className="hidden md:flex bg-card border-b border-border sticky top-0 z-50 shadow-sm w-full">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center w-full">
                    <div className="flex items-center gap-6">
                        <Link to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-3 transition-colors">
                            {shopLogo ? (
                                <img src={shopLogo} alt={shopName} className="h-10 w-auto rounded-lg" />
                            ) : (
                                <h1 className="text-xl font-bold font-display uppercase tracking-wider hidden lg:block mr-4 text-primary">{user.role === 'admin' ? 'Admin' : 'Barbeiro'}</h1>
                            )}
                        </Link>
                        <div className="flex items-center gap-2">
                            {navItems.map((item) => {
                                const isActive = location.pathname.startsWith(item.path);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm font-medium ${isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                        <span>{item.name}</span>
                                        {item.badge && (
                                            <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">

                        <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            Ver Site
                        </Link>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-sm font-medium text-muted-foreground hidden lg:inline-block">Olá, {user.fullName?.split(' ')[0] || user.username}</span>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                            <LogOut className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">Sair</span>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation Menu (App-like UX) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-white/5 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.8)] pb-safe">
                <div className="flex justify-around items-center px-1 py-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex flex-col items-center justify-center flex-1 h-14 gap-1 active:scale-95 transition-transform relative group"
                            >
                                <div className={`p-2 rounded-xl transition-colors duration-200 ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'}`}>
                                    <Icon className="w-[20px] h-[20px]" strokeWidth={isActive ? 2.5 : 2} />
                                    {item.badge && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-background">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[9px] font-medium truncate w-full text-center transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                    <Link
                        to="/"
                        className="flex flex-col items-center justify-center flex-1 h-14 gap-1 active:scale-95 transition-transform relative group"
                    >
                        <div className="p-2 rounded-xl text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all">
                            <Home className="w-[20px] h-[20px]" />
                        </div>
                        <span className="text-[9px] font-medium truncate w-full text-center text-muted-foreground group-hover:text-primary transition-colors">Site</span>
                    </Link>
                </div>
            </nav>
            <AdminQuickActions isHolidayMode={isHolidayMode} toggleHolidayMode={toggleHolidayMode} role={user.role} />
        </>
    );
};

// Suggestion for a Quick Actions tool
export const AdminQuickActions = ({ isHolidayMode, toggleHolidayMode, role }: { isHolidayMode: boolean, toggleHolidayMode: (checked: boolean) => void, role: string }) => {
    const [position, setPosition] = useState({ x: 24, y: 96 }); // Default: right-6 (24px), bottom-24 (96px)
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hasMoved, setHasMoved] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setDragStart({
            x: touch.clientX + position.x,
            y: window.innerHeight - touch.clientY - position.y
        });
        setHasMoved(false);
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];

        // Calculate new position relative to right and bottom
        let newX = dragStart.x - touch.clientX;
        let newY = window.innerHeight - touch.clientY - dragStart.y;

        // Keep button within screen bounds (roughly)
        const padding = 20;
        newX = Math.max(padding, Math.min(window.innerWidth - 60, newX));
        newY = Math.max(padding, Math.min(window.innerHeight - 150, newY));

        if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
            setHasMoved(true);
        }

        setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            className="fixed z-40 transition-none touch-none"
            style={{
                right: `${position.x}px`,
                bottom: `${position.y}px`,
                transition: isDragging ? 'none' : 'all 0.3s ease-out'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <Dialog onOpenChange={(open) => {
                // Prevent opening if the user was just dragging
                if (open && hasMoved) {
                    // This is a bit tricky with Dialog, usually we'd intercept the click
                }
            }}>
                <DialogTrigger asChild>
                    <Button
                        size="lg"
                        className="h-14 w-14 rounded-full shadow-md shadow-primary/20 p-0 transition-colors opacity-80 hover:opacity-100"
                        onClick={(e) => {
                            if (hasMoved) {
                                e.preventDefault();
                                setHasMoved(false);
                            }
                        }}
                    >
                        <Plus className="w-7 h-7" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ações Rápidas</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 py-4">
                        {role === 'admin' && (
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isHolidayMode ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {isHolidayMode ? <UmbrellaOff className="w-5 h-5" /> : <Palmtree className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Modo de Férias</p>
                                        <p className="text-[10px] text-muted-foreground">{isHolidayMode ? 'Agenda Fechada' : 'Agenda Aberta'}</p>
                                    </div>
                                </div>
                                <Switch checked={isHolidayMode} onCheckedChange={toggleHolidayMode} />
                            </div>
                        )}
                        
                        <CreateClientDialog />

                        <Link to={role === 'admin' ? "/admin/appointments?action=book" : "/my-schedule?action=book"}>
                            <Button variant="outline" className="w-full justify-start gap-3 h-12 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all">
                                <Calendar className="w-5 h-5 text-primary" />
                                Marcar Horário (Manual)
                            </Button>
                        </Link>

                        {role === 'admin' && (
                            <>
                                <Link to="/admin/services?action=new-service">
                                    <Button variant="outline" className="w-full justify-start gap-3 h-12 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all">
                                        <Scissors className="w-5 h-5 text-primary" />
                                        Novo Serviço
                                    </Button>
                                </Link>
                                <Link to="/admin/barbers?action=new-barber">
                                    <Button variant="outline" className="w-full justify-start gap-3 h-12 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all">
                                        <Users className="w-5 h-5 text-primary" />
                                        Novo Barbeiro
                                    </Button>
                                </Link>
                                <Link to="/admin/recurring-schedules">
                                    <Button variant="outline" className="w-full justify-start gap-3 h-12 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all">
                                        <Clock className="w-5 h-5 text-primary" />
                                        Horários Fixos (VIP)
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
