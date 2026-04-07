import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Calendar as CalendarIcon, Clock, User, Scissors, ArrowLeft, Check, ChevronsUpDown, CalendarDays, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { RecurringSchedule, User as UserType, Barber, Service } from '@/types';
import { parseLocalDate } from '@/lib/timeUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const DAYS_OF_WEEK = [
    { id: 0, name: 'Domingo' },
    { id: 1, name: 'Segunda-feira' },
    { id: 2, name: 'Terça-feira' },
    { id: 3, name: 'Quarta-feira' },
    { id: 4, name: 'Quinta-feira' },
    { id: 5, name: 'Sexta-feira' },
    { id: 6, name: 'Sábado' },
];

const RecurringSchedules = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
    const [users, setUsers] = useState<UserType[]>([]);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        userId: '',
        barberId: '',
        serviceIds: [] as string[],
        dayOfWeek: '1',
        time: '',
        frequency: 'weekly' as 'weekly' | 'biweekly',
        startDate: startOfDay(new Date()),
    });
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const currentUser = storage.getCurrentUser();
            if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'barber')) {
                navigate('/login');
                return;
            }

            await storage.initialize();
            setSchedules(storage.getRecurringSchedules());
            setUsers(storage.getUsers().filter(u => u.role === 'client'));
            const barbersList = storage.getBarbers();
            setBarbers(barbersList);
            setServices(storage.getServices());

            if (barbersList.length === 1 && !formData.barberId) {
                setFormData(prev => ({ ...prev, barberId: barbersList[0].id }));
            }
            setLoading(false);
        };
        init();
    }, [navigate, formData.barberId]);

    const groupedSchedules = useMemo(() => {
        const groups: Record<string, RecurringSchedule[]> = {};
        schedules.forEach(schedule => {
            if (!groups[schedule.userId]) groups[schedule.userId] = [];
            groups[schedule.userId].push(schedule);
        });
        return groups;
    }, [schedules]);

    const handleSaveSchedule = async () => {
        if (!formData.userId || !formData.barberId || formData.serviceIds.length === 0 || !formData.time) {
            toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' });
            return;
        }

        if (editingId) {
            const updated = schedules.map(s => {
                if (s.id === editingId) {
                    return {
                        ...s,
                        userId: formData.userId,
                        barberId: formData.barberId,
                        serviceId: formData.serviceIds[0],
                        serviceIds: formData.serviceIds,
                        dayOfWeek: parseInt(formData.dayOfWeek),
                        time: formData.time,
                        frequency: formData.frequency,
                        startDate: formData.frequency === 'biweekly' ? format(formData.startDate, 'yyyy-MM-dd') : undefined,
                    };
                }
                return s;
            });
            await storage.saveRecurringSchedules(updated);
            setSchedules(updated);
            toast({ title: 'Sucesso', description: 'Horário fixo atualizado.' });
        } else {
            const newSchedule: RecurringSchedule = {
                id: Date.now().toString(),
                userId: formData.userId,
                barberId: formData.barberId,
                serviceId: formData.serviceIds[0],
                serviceIds: formData.serviceIds,
                dayOfWeek: parseInt(formData.dayOfWeek),
                time: formData.time,
                frequency: formData.frequency,
                startDate: formData.frequency === 'biweekly' ? format(formData.startDate, 'yyyy-MM-dd') : undefined,
                active: true,
                createdAt: new Date().toISOString(),
            };
            const updated = [...schedules, newSchedule];
            await storage.saveRecurringSchedules(updated);
            setSchedules(updated);
            toast({ title: 'Sucesso', description: 'Horário fixo cadastrado.' });
        }

        setIsDialogOpen(false);
        setEditingId(null);
        setFormData({ userId: '', barberId: '', serviceIds: [], dayOfWeek: '1', time: '', frequency: 'weekly', startDate: startOfDay(new Date()) });
    };

    const handleEdit = (schedule: RecurringSchedule) => {
        setEditingId(schedule.id);
        setFormData({
            userId: schedule.userId,
            barberId: schedule.barberId,
            serviceIds: schedule.serviceIds || (schedule.serviceId ? [schedule.serviceId] : []),
            dayOfWeek: schedule.dayOfWeek.toString(),
            time: schedule.time,
            frequency: schedule.frequency || 'weekly',
            startDate: schedule.startDate ? parseLocalDate(schedule.startDate) : startOfDay(new Date()),
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        const updated = schedules.filter(s => s.id !== id);
        await storage.saveRecurringSchedules(updated);
        setSchedules(updated);
        toast({ title: 'Removido', description: 'Horário fixo removido.' });
    };

    const getClientName = (id: string) => users.find(u => u.id === id)?.fullName || 'Desconhecido';
    const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'N/A';
    const getServiceName = (ids: string | string[]) => {
        const idList = Array.isArray(ids) ? ids : [ids];
        return idList.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(' + ') || 'N/A';
    };
    const getDayName = (day: number) => DAYS_OF_WEEK.find(d => d.id === day)?.name || '';

    return (
        <div className="min-h-screen bg-background">
            <AdminMenu />
            <div className="container mx-auto px-4 py-8 pb-32">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-3xl font-bold">Horários <span className="text-primary">Fixos</span></h1>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setEditingId(null);
                        setFormData({ userId: '', barberId: '', serviceIds: [], dayOfWeek: '1', time: '', frequency: 'weekly', startDate: startOfDay(new Date()) });
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="mb-8 w-full md:w-auto gap-2" onClick={() => {
                            setEditingId(null);
                            setFormData({ userId: '', barberId: '', serviceIds: [], dayOfWeek: '1', time: '', frequency: 'weekly', startDate: startOfDay(new Date()) });
                        }}>
                            <Plus className="w-4 h-4" /> Novo Horário Fixo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md w-[95vw] h-auto max-h-[96dvh] overflow-hidden flex flex-col p-0 rounded-3xl border-white/10 bg-zinc-950 shadow-2xl">
                        <DialogHeader className="p-6 pb-0 text-left">
                            <DialogTitle className="text-2xl font-bold text-white">
                                {editingId ? 'Editar Horário Fixo' : 'Cadastrar Horário Fixo'}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                {editingId ? 'Altere as configurações deste agendamento.' : 'Configure um agendamento recorrente para este cliente.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-zinc-300 font-medium ml-1">Cliente</Label>
                                <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isComboboxOpen}
                                            className="w-full justify-between h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white text-lg font-normal px-4"
                                        >
                                            {formData.userId
                                                ? users.find((user) => user.id === formData.userId)?.fullName
                                                : "Pesquisar cliente..."}
                                            <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-900 border-white/10 rounded-2xl shadow-2xl">
                                        <Command className="bg-transparent">
                                            <CommandInput placeholder="Digite o nome..." className="h-12" />
                                            <CommandList className="max-h-[300px]">
                                                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {users.map((user) => (
                                                        <CommandItem
                                                            key={user.id}
                                                            value={`${user.fullName} ${user.id}`.toLowerCase()}
                                                            onSelect={() => {
                                                                setFormData(prev => ({ ...prev, userId: user.id }));
                                                                setIsComboboxOpen(false);
                                                            }}
                                                            className="data-[selected='true']:bg-primary data-[selected='true']:text-primary-foreground cursor-pointer px-4 py-3 rounded-xl m-1"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.userId === user.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {user.fullName}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-zinc-300 font-medium ml-1">Barbeiro</Label>
                                <Select value={formData.barberId} onValueChange={(v) => setFormData({ ...formData, barberId: v })}>
                                    <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white text-lg">
                                        <SelectValue placeholder="Selecione o barbeiro" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                                        {barbers.map(b => (
                                            <SelectItem key={b.id} value={b.id} className="py-3 pl-10 pr-4 focus:bg-zinc-800 focus:text-white rounded-lg m-1">{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-zinc-300 font-medium ml-1">Serviços</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between h-auto min-h-[56px] bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white text-lg font-normal px-4 py-3 hover:bg-zinc-900 hover:text-white transition-colors">
                                            <div className="flex flex-wrap gap-2 items-center text-left">
                                                {formData.serviceIds.length > 0 ? (
                                                    formData.serviceIds.map(id => (
                                                        <Badge key={id} variant="secondary" className="bg-primary/20 text-primary border-none font-bold py-1 px-3">
                                                            {services.find(s => s.id === id)?.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-zinc-500">Selecione os serviços</span>
                                                )}
                                            </div>
                                            <ChevronsUpDown className="h-5 w-5 opacity-50 shrink-0 ml-2" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-900 border-white/10 rounded-2xl shadow-2xl" align="start">
                                        <Command className="bg-transparent">
                                            <CommandInput placeholder="Pesquisar serviço..." className="h-12" />
                                            <CommandList className="max-h-[300px]">
                                                <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {services.map((service) => (
                                                        <CommandItem
                                                            key={service.id}
                                                            value={service.name}
                                                            onSelect={() => {
                                                                const current = formData.serviceIds;
                                                                const next = current.includes(service.id)
                                                                    ? current.filter(id => id !== service.id)
                                                                    : [...current, service.id];
                                                                setFormData(prev => ({ ...prev, serviceIds: next }));
                                                            }}
                                                            className="cursor-pointer px-4 py-3 rounded-xl m-1 aria-selected:bg-zinc-800 aria-selected:text-white group/item transition-colors"
                                                        >
                                                            <div className={cn(
                                                                "mr-3 flex h-5 w-5 items-center justify-center rounded-md border-2 border-primary",
                                                                formData.serviceIds.includes(service.id)
                                                                    ? "bg-primary text-primary-foreground border-primary"
                                                                    : "border-white/20"
                                                            )}>
                                                                {formData.serviceIds.includes(service.id) && <Check className="h-3.5 w-3.5" />}
                                                            </div>
                                                            <span className="flex-1 text-white font-medium">{service.name}</span>
                                                            <span className="text-primary group-aria-selected/item:text-primary-foreground font-bold ml-2">R$ {service.price}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-zinc-300 font-medium ml-1">Dia da Semana</Label>
                                    <Select value={formData.dayOfWeek} onValueChange={(v) => setFormData({ ...formData, dayOfWeek: v })}>
                                        <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white text-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                                            {DAYS_OF_WEEK.map(d => (
                                                <SelectItem key={d.id} value={d.id.toString()} className="py-3 pl-10 pr-4 focus:bg-zinc-800 focus:text-white rounded-lg m-1">{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-zinc-300 font-medium ml-1">Horário</Label>
                                    <Select value={formData.time} onValueChange={(v) => setFormData({ ...formData, time: v })}>
                                        <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white text-lg text-center font-bold">
                                            <SelectValue placeholder="HH:mm" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                                            {(() => {
                                                const barber = barbers.find(b => b.id === formData.barberId);
                                                if (!barber) return [];
                                                const dayIdx = parseInt(formData.dayOfWeek);
                                                return (barber.scheduleByDay && barber.scheduleByDay[dayIdx]) || barber.availableHours || [];
                                            })().map(h => (
                                                <SelectItem key={h} value={h} className="py-3 pl-10 pr-4 focus:bg-zinc-800 focus:text-white rounded-lg m-1 font-bold">{h}</SelectItem>
                                            )) || <SelectItem value="0" disabled>Selecione um barbeiro</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-zinc-300 font-medium ml-1">Frequência</Label>
                                <Select value={formData.frequency} onValueChange={(v: any) => setFormData({ ...formData, frequency: v })}>
                                    <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white text-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-white/10 rounded-xl">
                                        <SelectItem value="weekly" className="py-3 pl-10 pr-4 focus:bg-zinc-800 focus:text-white rounded-lg m-1">Toda semana</SelectItem>
                                        <SelectItem value="biweekly" className="py-3 pl-10 pr-4 focus:bg-zinc-800 focus:text-white rounded-lg m-1">Semana sim, semana não</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.frequency === 'biweekly' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label className="text-zinc-300 font-medium ml-1">Semana de Início (Âncora)</Label>
                                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white text-lg font-normal px-4",
                                                    !formData.startDate && "text-zinc-500"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-5 w-5 opacity-50" />
                                                {formData.startDate ? format(formData.startDate, "PPP", { locale: ptBR }) : <span>Selecione a semana</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10 rounded-2xl shadow-2xl" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.startDate}
                                                onSelect={(date) => {
                                                    if (date) setFormData({ ...formData, startDate: startOfDay(date) });
                                                    setIsDatePickerOpen(false);
                                                }}
                                                initialFocus
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <p className="text-[10px] text-zinc-500 ml-1">
                                        O horário será ativo nesta semana e em todas as semanas ímpares a partir dela (pulando uma).
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="p-6 border-t border-white/5">
                            <Button onClick={handleSaveSchedule} className="w-full h-16 rounded-[2rem] text-xl font-black shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-[1.02] transition-all duration-300">
                                {editingId ? 'Salvar Alterações' : 'Cadastrar Horário'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.keys(groupedSchedules).length === 0 ? (
                        <Card className="p-8 text-center col-span-full border-dashed bg-muted/20">
                            <p className="text-muted-foreground">Nenhum horário fixo cadastrado.</p>
                        </Card>
                    ) : (
                        Object.entries(groupedSchedules).map(([userId, userSchedules]) => (
                            <Card key={userId} className="p-6 relative border-border hover:border-primary/50 transition-all bg-card shadow-sm h-fit">
                                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                                    <div className="p-3 bg-primary/10 rounded-2xl">
                                        <User className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl leading-tight">{getClientName(userId)}</h3>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">
                                            {userSchedules.length} {userSchedules.length === 1 ? 'Horário' : 'Horários'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {userSchedules.map((schedule) => (
                                        <div key={schedule.id} className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 relative group/item hover:bg-zinc-900 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2 text-primary font-bold">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{getDayName(schedule.dayOfWeek)} às {schedule.time}</span>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleEdit(schedule)} 
                                                        className="w-8 h-8 rounded-full hover:bg-zinc-800 hover:text-white"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleDelete(schedule.id)} 
                                                        className="w-8 h-8 rounded-full hover:bg-red-500/20 hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 pl-6 border-l-2 border-primary/20">
                                                <p className="text-sm font-medium text-zinc-300">
                                                    {getServiceName(schedule.serviceIds || schedule.serviceId)}
                                                </p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                                        <CalendarDays className="w-3 h-3" />
                                                        {schedule.frequency === 'biweekly' ? 'Semana sim/não' : 'Semanal'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                                        <Scissors className="w-3 h-3" />
                                                        {getBarberName(schedule.barberId)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecurringSchedules;
