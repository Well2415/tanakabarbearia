import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import { ArrowLeft, Plus, Trash2, Scissors, Edit, CalendarIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Barber } from '@/types';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { sortTimes } from '@/lib/timeUtils';

const COMMON_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
];

const DAYS_OF_WEEK = [
  { id: 0, name: 'Dom' },
  { id: 1, name: 'Seg' },
  { id: 2, name: 'Ter' },
  { id: 3, name: 'Qua' },
  { id: 4, name: 'Qui' },
  { id: 5, name: 'Sex' },
  { id: 6, name: 'Sáb' },
];

const Barbers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [barbers, setBarbers] = useState(storage.getBarbers());

  const initSchedule = () => ({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newBarberData, setNewBarberData] = useState({ name: '', photo: '', yearsOfExperience: '', description: '', specialties: '', availableHours: [] as string[], availableDates: [] as string[], customHours: '', scheduleByDay: initSchedule() as Record<number, string[]> });

  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [editBarberData, setEditBarberData] = useState({ id: '', name: '', photo: '', yearsOfExperience: '', description: '', specialties: '', availableHours: [] as string[], availableDates: [] as string[], customHours: '', scheduleByDay: initSchedule() as Record<number, string[]> });

  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState(false);
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);

  const [activeDayNew, setActiveDayNew] = useState<number>(1);
  const [activeDayEdit, setActiveDayEdit] = useState<number>(1);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
      navigate('/dashboard');
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'new-barber') {
      setIsAddOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

  useEffect(() => {
    if (editingBarber) {
      const fallbackSchedule = initSchedule();
      if (editingBarber.scheduleByDay) {
        Object.assign(fallbackSchedule, editingBarber.scheduleByDay);
      } else {
        // Fallback legacy items inside each day
        DAYS_OF_WEEK.forEach(d => {
          fallbackSchedule[d.id as keyof typeof fallbackSchedule] = [...(editingBarber.availableHours || [])];
        });
      }

      setEditBarberData({
        id: editingBarber.id,
        name: editingBarber.name,
        specialties: editingBarber.specialties.join(', '),
        availableHours: editingBarber.availableHours.filter(h => COMMON_HOURS.includes(h)) || [],
        availableDates: editingBarber.availableDates || [],
        customHours: '',
        scheduleByDay: fallbackSchedule,
        photo: editingBarber.photo || '',
        yearsOfExperience: editingBarber.yearsOfExperience?.toString() || '',
        description: editingBarber.description || '',
      });
    }
  }, [editingBarber]);

  if (!user || user.role !== 'admin') return null;

  const handleAddNewBarber = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert scheduleByDay items into a unified availableHours list
    const combinedHours = new Set<string>();
    Object.values(newBarberData.scheduleByDay).forEach(hours => {
      hours.forEach(h => combinedHours.add(h));
    });
    const customH = newBarberData.customHours.split(',').map(h => h.trim()).filter(h => h !== '');
    customH.forEach(h => combinedHours.add(h));

    // Apply customH to active day
    if (customH.length > 0) {
      newBarberData.scheduleByDay[activeDayNew] = [...new Set([...newBarberData.scheduleByDay[activeDayNew], ...customH])];
    }

    const newBarber: Barber = {
      id: Date.now().toString(),
      name: newBarberData.name,
      photo: newBarberData.photo || undefined,
      yearsOfExperience: parseInt(newBarberData.yearsOfExperience) || undefined,
      description: newBarberData.description || undefined,
      specialties: newBarberData.specialties.split(',').map(s => s.trim()),
      availableHours: sortTimes(Array.from(combinedHours)),
      scheduleByDay: newBarberData.scheduleByDay,
      availableDates: newBarberData.availableDates,
    };
    const updated = [...barbers, newBarber];
    await storage.updateBarber(newBarber);
    setBarbers(updated);
    setIsAddOpen(false);
    setNewBarberData({ name: '', photo: '', yearsOfExperience: '', description: '', specialties: '', availableHours: [], availableDates: [], customHours: '', scheduleByDay: initSchedule() });
    toast({ title: 'Barbeiro adicionado', description: 'O barbeiro foi cadastrado com sucesso' });
  };

  const handleUpdateBarber = async (e: React.FormEvent) => {
    e.preventDefault();

    const customH = editBarberData.customHours.split(',').map(h => h.trim()).filter(h => h !== '');
    if (customH.length > 0) {
      editBarberData.scheduleByDay[activeDayEdit] = [...new Set([...editBarberData.scheduleByDay[activeDayEdit], ...customH])];
    }

    const combinedHours = new Set<string>();
    Object.values(editBarberData.scheduleByDay).forEach(hours => {
      hours.forEach(h => combinedHours.add(h));
    });

    const finalBarber = {
      ...editingBarber!,
      name: editBarberData.name,
      photo: editBarberData.photo || undefined,
      yearsOfExperience: parseInt(editBarberData.yearsOfExperience) || undefined,
      description: editBarberData.description || undefined,
      specialties: editBarberData.specialties.split(',').map(s => s.trim()),
      availableHours: sortTimes(Array.from(combinedHours)),
      scheduleByDay: editBarberData.scheduleByDay,
      availableDates: editBarberData.availableDates,
    };
    
    await storage.updateBarber(finalBarber);
    const updatedBarbers = barbers.map(b => b.id === finalBarber.id ? finalBarber : b);
    setBarbers(updatedBarbers);
    setEditingBarber(null);
    toast({ title: 'Barbeiro atualizado', description: 'Os dados do barbeiro foram atualizados.' });
  };

  const handleDelete = async (id: string) => {
    await storage.deleteBarber(id);
    const updated = barbers.filter(b => b.id !== id);
    setBarbers(updated);
    toast({ title: 'Barbeiro removido', description: 'O barbeiro foi removido com sucesso' });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminMenu />

      <div className="container mx-auto px-4 py-8 pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold">Gerenciar Barbeiros</h2>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild><Button className="hidden md:flex w-full md:w-auto gap-2 h-12 md:h-10 text-lg md:text-base order-first md:order-last"><Plus className="w-5 h-5 md:w-4 h-4" />Novo Barbeiro</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto pb-28 md:pb-6">
              <DialogHeader><DialogTitle>Cadastrar Novo Barbeiro</DialogTitle></DialogHeader>
              <form onSubmit={handleAddNewBarber} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="name">Nome</Label><Input id="name" value={newBarberData.name} onChange={(e) => setNewBarberData({ ...newBarberData, name: e.target.value })} required /></div>
                  <div><Label htmlFor="yearsOfExperience">Anos de Profissão</Label><Input id="yearsOfExperience" type="text" inputMode="numeric" pattern="[0-9]*" value={newBarberData.yearsOfExperience} onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setNewBarberData({ ...newBarberData, yearsOfExperience: value });
                  }} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Foto do Barbeiro</Label>
                    <ImageUpload
                      value={newBarberData.photo}
                      onChange={(photo) => setNewBarberData({ ...newBarberData, photo })}
                      label="Carregar Foto"
                      maxWidth={400}
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
                      <Input id="specialties" value={newBarberData.specialties} onChange={(e) => setNewBarberData({ ...newBarberData, specialties: e.target.value })} placeholder="Corte, Barba" required />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea id="description" value={newBarberData.description} onChange={(e) => setNewBarberData({ ...newBarberData, description: e.target.value })} className="h-24" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border p-4 rounded-lg bg-accent/5">
                  <div className="flex flex-col gap-2">
                    <Label>Dias da Semana (Clique para configurar)</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <Button
                          key={day.id}
                          type="button"
                          variant={activeDayNew === day.id ? 'default' : 'outline'}
                          onClick={() => setActiveDayNew(day.id)}
                          className={cn("h-8 px-3 text-xs", activeDayNew === day.id ? "bg-primary text-primary-foreground" : "")}
                        >
                          {day.name} {newBarberData.scheduleByDay[day.id].length > 0 && `(${newBarberData.scheduleByDay[day.id].length})`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-primary font-bold">Horários para {DAYS_OF_WEEK.find(d => d.id === activeDayNew)?.name}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {COMMON_HOURS.map(hour => {
                        const isSelected = newBarberData.scheduleByDay[activeDayNew].includes(hour);
                        return (
                          <Button
                            key={hour}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => {
                              const currentDayHours = newBarberData.scheduleByDay[activeDayNew];
                              const newDayHours = isSelected
                                ? currentDayHours.filter(h => h !== hour)
                                : [...currentDayHours, hour].sort();

                              setNewBarberData({
                                ...newBarberData,
                                scheduleByDay: {
                                  ...newBarberData.scheduleByDay,
                                  [activeDayNew]: newDayHours
                                }
                              });
                            }}
                          >
                            {hour}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="customHours" className="text-xs text-muted-foreground">Adicionar horários extras que não estão na lista para este dia (separados por vírgula)</Label>
                    <Input
                      id="customHours"
                      value={newBarberData.customHours}
                      onChange={(e) => setNewBarberData({ ...newBarberData, customHours: e.target.value })}
                      placeholder="Ex para este dia: 08:30, 12:15"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="button" variant="secondary" size="sm" onClick={() => {
                      // Copy hours from this day to all other days
                      const copyHours = newBarberData.scheduleByDay[activeDayNew];
                      const updatedSchedule = { ...newBarberData.scheduleByDay };
                      DAYS_OF_WEEK.forEach(d => {
                        updatedSchedule[d.id] = [...copyHours];
                      });
                      setNewBarberData({ ...newBarberData, scheduleByDay: updatedSchedule });
                      toast({ title: 'Horários Copiados', description: `Os horários de ${DAYS_OF_WEEK.find(d => d.id === activeDayNew)?.name} foram copiados para toda a semana.` });
                    }}>Copiar para todos os dias</Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="dates">Datas Disponíveis</Label>
                  <Popover open={isAddCalendarOpen} onOpenChange={setIsAddCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal overflow-hidden',
                          newBarberData.availableDates.length === 0 && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="flex-grow overflow-hidden whitespace-nowrap text-ellipsis">
                          {newBarberData.availableDates.length > 0
                            ? newBarberData.availableDates.length + ' datas selecionadas'
                            : 'Selecionar datas'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="multiple"
                        selected={newBarberData.availableDates.map(d => new Date(d + 'T12:00:00'))}
                        onSelect={(dates) => {
                          const formatted = (dates as Date[] || []).map(d => format(d, 'yyyy-MM-dd'));
                          setNewBarberData({ ...newBarberData, availableDates: formatted.sort() });
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  {newBarberData.availableDates.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newBarberData.availableDates.map(dateStr => (
                        <Badge
                          key={dateStr}
                          variant="secondary"
                          className="gap-1 pr-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={() => {
                            setNewBarberData({
                              ...newBarberData,
                              availableDates: newBarberData.availableDates.filter(d => d !== dateStr)
                            });
                          }}
                        >
                          {format(new Date(dateStr + 'T12:00:00'), 'dd/MM/yyyy')}
                          <X className="w-3 h-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full">Cadastrar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map((barber) => (
            <Card key={barber.id} className="p-6 border-border flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  {barber.photo ? (
                    <img src={barber.photo} alt={barber.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"><Scissors className="w-8 h-8 text-primary" /></div>
                  )}
                  <h3 className="text-xl font-bold">{barber.name}</h3>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/20 transition-colors" onClick={() => setEditingBarber(barber)}><Edit className="w-4 h-4 text-primary" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => handleDelete(barber.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              {barber.yearsOfExperience && <p className="text-sm text-muted-foreground mb-2">{barber.yearsOfExperience} anos de profissão</p>}
              {barber.description && <p className="text-muted-foreground text-sm mb-4">{barber.description}</p>}
              <div className="flex flex-wrap gap-2">
                {barber.specialties.map((specialty, idx) => (<span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{specialty}</span>))}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex-grow">
                <h4 className="text-sm font-semibold mb-2">Horários</h4>
                <div className="flex flex-wrap gap-2">
                  {barber.availableHours.map((hour, idx) => (<span key={idx} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{hour}</span>))}
                </div>
                <h4 className="text-sm font-semibold mt-4 mb-2">Datas Disponíveis</h4>
                <div className="flex flex-wrap gap-2">
                  {barber.availableDates.map((dateStr, idx) => (<span key={idx} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{format(new Date(dateStr), 'dd/MM/yyyy')}</span>))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingBarber} onOpenChange={(isOpen) => !isOpen && setEditingBarber(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Barbeiro</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateBarber} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="edit-name">Nome</Label><Input id="edit-name" value={editBarberData.name} onChange={(e) => setEditBarberData({ ...editBarberData, name: e.target.value })} required /></div>
              <div><Label htmlFor="edit-yearsOfExperience">Anos de Profissão</Label><Input id="edit-yearsOfExperience" type="text" inputMode="numeric" pattern="[0-9]*" value={editBarberData.yearsOfExperience} onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setEditBarberData({ ...editBarberData, yearsOfExperience: value });
              }} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Foto do Barbeiro</Label>
                <ImageUpload
                  value={editBarberData.photo}
                  onChange={(photo) => setEditBarberData({ ...editBarberData, photo })}
                  label="Alterar Foto"
                  maxWidth={400}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-specialties">Especialidades (separadas por vírgula)</Label>
                  <Input id="edit-specialties" value={editBarberData.specialties} onChange={(e) => setEditBarberData({ ...editBarberData, specialties: e.target.value })} placeholder="Corte, Barba" required />
                </div>
                <div>
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Textarea id="edit-description" value={editBarberData.description} onChange={(e) => setEditBarberData({ ...editBarberData, description: e.target.value })} className="h-24" />
                </div>
              </div>
            </div>

            <div className="space-y-4 border p-4 rounded-lg bg-accent/5">
              <div className="flex flex-col gap-2">
                <Label>Dias da Semana (Clique para configurar)</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <Button
                      key={day.id}
                      type="button"
                      variant={activeDayEdit === day.id ? 'default' : 'outline'}
                      onClick={() => setActiveDayEdit(day.id)}
                      className={cn("h-8 px-3 text-xs", activeDayEdit === day.id ? "bg-primary text-primary-foreground" : "")}
                    >
                      {day.name} {editBarberData.scheduleByDay[day.id].length > 0 && `(${editBarberData.scheduleByDay[day.id].length})`}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-primary font-bold">Horários para {DAYS_OF_WEEK.find(d => d.id === activeDayEdit)?.name}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {COMMON_HOURS.map(hour => {
                    const isSelected = editBarberData.scheduleByDay[activeDayEdit].includes(hour);
                    return (
                      <Button
                        key={hour}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => {
                          const currentDayHours = editBarberData.scheduleByDay[activeDayEdit];
                          const newDayHours = isSelected
                            ? currentDayHours.filter(h => h !== hour)
                            : [...currentDayHours, hour].sort();

                          setEditBarberData({
                            ...editBarberData,
                            scheduleByDay: {
                              ...editBarberData.scheduleByDay,
                              [activeDayEdit]: newDayHours
                            }
                          });
                        }}
                      >
                        {hour}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-customHours" className="text-xs text-muted-foreground">Adicionar horários extras que não estão na lista para este dia (separados por vírgula)</Label>
                <Input
                  id="edit-customHours"
                  value={editBarberData.customHours}
                  onChange={(e) => setEditBarberData({ ...editBarberData, customHours: e.target.value })}
                  placeholder="Ex para este dia: 08:30, 12:15"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={() => {
                  // Copy hours from this day to all other days
                  const copyHours = editBarberData.scheduleByDay[activeDayEdit];
                  const updatedSchedule = { ...editBarberData.scheduleByDay };
                  DAYS_OF_WEEK.forEach(d => {
                    updatedSchedule[d.id] = [...copyHours];
                  });
                  setEditBarberData({ ...editBarberData, scheduleByDay: updatedSchedule });
                  toast({ title: 'Horários Copiados', description: `Os horários de ${DAYS_OF_WEEK.find(d => d.id === activeDayEdit)?.name} foram copiados para toda a semana.` });
                }}>Copiar para todos os dias</Button>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-dates">Datas Disponíveis</Label>
              <Popover open={isEditCalendarOpen} onOpenChange={setIsEditCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal overflow-hidden',
                      editBarberData.availableDates.length === 0 && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="flex-grow overflow-hidden whitespace-nowrap text-ellipsis">
                      {editBarberData.availableDates.length > 0
                        ? editBarberData.availableDates.length + ' datas selecionadas'
                        : 'Selecionar datas'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="multiple"
                    selected={editBarberData.availableDates.map(d => new Date(d + 'T12:00:00'))}
                    onSelect={(dates) => {
                      const formatted = (dates as Date[] || []).map(d => format(d, 'yyyy-MM-dd'));
                      setEditBarberData({ ...editBarberData, availableDates: formatted.sort() });
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              {editBarberData.availableDates.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editBarberData.availableDates.map(dateStr => (
                    <Badge
                      key={dateStr}
                      variant="secondary"
                      className="gap-1 pr-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => {
                        setEditBarberData({
                          ...editBarberData,
                          availableDates: editBarberData.availableDates.filter(d => d !== dateStr)
                        });
                      }}
                    >
                      {format(new Date(dateStr + 'T12:00:00'), 'dd/MM/yyyy')}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Barbers;
