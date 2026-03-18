import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { Plus, Trash2, Calendar, Clock, User, Scissors, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RecurringSchedule, User as UserType, Barber, Service } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    const [formData, setFormData] = useState({
        userId: '',
        barberId: '',
        serviceId: '',
        dayOfWeek: '1',
        time: '',
    });

    useEffect(() => {
        const currentUser = storage.getCurrentUser();
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'barber')) {
            navigate('/login');
            return;
        }

        setSchedules(storage.getRecurringSchedules());
        setUsers(storage.getUsers().filter(u => u.role === 'client'));
        setBarbers(storage.getBarbers());
        setServices(storage.getServices());
    }, [navigate]);

    const handleCreateSchedule = () => {
        if (!formData.userId || !formData.barberId || !formData.serviceId || !formData.time) {
            toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' });
            return;
        }

        const newSchedule: RecurringSchedule = {
            id: Date.now().toString(),
            userId: formData.userId,
            barberId: formData.barberId,
            serviceId: formData.serviceId,
            dayOfWeek: parseInt(formData.dayOfWeek),
            time: formData.time,
            active: true,
            createdAt: new Date().toISOString(),
        };

        const updated = [...schedules, newSchedule];
        storage.saveRecurringSchedules(updated);
        setSchedules(updated);
        setIsDialogOpen(false);
        setFormData({ userId: '', barberId: '', serviceId: '', dayOfWeek: '1', time: '' });
        toast({ title: 'Sucesso', description: 'Horário fixo cadastrado com sucesso.' });
    };

    const handleDelete = (id: string) => {
        const updated = schedules.filter(s => s.id !== id);
        storage.saveRecurringSchedules(updated);
        setSchedules(updated);
        toast({ title: 'Removido', description: 'Horário fixo removido.' });
    };

    const getClientName = (id: string) => users.find(u => u.id === id)?.fullName || 'Desconhecido';
    const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'N/A';
    const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'N/A';
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

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="mb-8 w-full md:w-auto gap-2">
                            <Plus className="w-4 h-4" /> Novo Horário Fixo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Cadastrar Horário Fixo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Cliente</Label>
                                <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isComboboxOpen}
                                            className="w-full justify-between font-normal"
                                        >
                                            {formData.userId
                                                ? users.find((user) => user.id === formData.userId)?.fullName
                                                : "Pesquisar cliente..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput placeholder="Digite o nome..." />
                                            <CommandList>
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
                                                            className="data-[selected='true']:bg-primary data-[selected='true']:text-primary-foreground cursor-pointer"
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

                            <div className="space-y-2">
                                <Label>Barbeiro</Label>
                                <Select value={formData.barberId} onValueChange={(v) => setFormData({ ...formData, barberId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o barbeiro" /></SelectTrigger>
                                    <SelectContent>
                                        {barbers.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Serviço</Label>
                                <Select value={formData.serviceId} onValueChange={(v) => setFormData({ ...formData, serviceId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
                                    <SelectContent>
                                        {services.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name} - R$ {s.price}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Dia da Semana</Label>
                                    <Select value={formData.dayOfWeek} onValueChange={(v) => setFormData({ ...formData, dayOfWeek: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {DAYS_OF_WEEK.map(d => (
                                                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Horário</Label>
                                    <Select value={formData.time} onValueChange={(v) => setFormData({ ...formData, time: v })}>
                                        <SelectTrigger><SelectValue placeholder="HH:mm" /></SelectTrigger>
                                        <SelectContent>
                                            {barbers.find(b => b.id === formData.barberId)?.availableHours.map(h => (
                                                <SelectItem key={h} value={h}>{h}</SelectItem>
                                            )) || <SelectItem value="0" disabled>Selecione um barbeiro</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateSchedule} className="w-full">Salvar Horário Fixo</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schedules.length === 0 ? (
                        <Card className="p-8 text-center col-span-full border-dashed bg-muted/20">
                            <p className="text-muted-foreground">Nenhum horário fixo cadastrado.</p>
                        </Card>
                    ) : (
                        schedules.map(schedule => (
                            <Card key={schedule.id} className="p-6 relative group border-border hover:border-primary/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Calendar className="w-5 h-5 text-primary" />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(schedule.id)} className="rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <h3 className="font-bold text-lg mb-1">{getClientName(schedule.userId)}</h3>
                                <p className="text-sm text-primary font-medium mb-4">{getServiceName(schedule.serviceId)}</p>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span>{getDayName(schedule.dayOfWeek)} às <b>{schedule.time}</b></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="w-4 h-4" />
                                        <span>Barbeiro: {getBarberName(schedule.barberId)}</span>
                                    </div>
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
