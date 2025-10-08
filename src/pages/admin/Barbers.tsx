import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils'; // Import cn
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import { ArrowLeft, Plus, Trash2, Scissors, Edit, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfDay } from 'date-fns'; // Import format, parseISO, startOfDay
import { ptBR } from 'date-fns/locale'; // Import ptBR
import { Barber } from '@/types';

const COMMON_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
];

const Barbers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();
  const [barbers, setBarbers] = useState(storage.getBarbers());
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newBarberData, setNewBarberData] = useState({ name: '', photo: '', yearsOfExperience: '', description: '', specialties: '', availableHours: [] as string[], availableDates: [] as string[], customHours: '' });

  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [editBarberData, setEditBarberData] = useState({ id: '', name: '', photo: '', yearsOfExperience: '', description: '', specialties: '', availableHours: [] as string[], availableDates: [] as string[], customHours: '' });

  const [isAddCalendarOpen, setIsAddCalendarOpen] = useState(false); // For add barber calendar popover
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false); // For edit barber calendar popover

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
      navigate('/dashboard');
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    if (editingBarber) {
      setEditBarberData({
        id: editingBarber.id,
        name: editingBarber.name,
        specialties: editingBarber.specialties.join(', '),
        availableHours: editingBarber.availableHours.filter(h => COMMON_HOURS.includes(h)) || [], // Filter out custom hours
        availableDates: editingBarber.availableDates || [],
        customHours: editingBarber.availableHours.filter(h => !COMMON_HOURS.includes(h)).join(', '), // Extract custom hours
        photo: editingBarber.photo || '',
        yearsOfExperience: editingBarber.yearsOfExperience?.toString() || '',
        description: editingBarber.description || '',
      });
    }
  }, [editingBarber]);

  if (!user || user.role !== 'admin') return null;

  const handleAddNewBarber = (e: React.FormEvent) => {
    e.preventDefault();
    const newBarber: Barber = {
      id: Date.now().toString(),
      name: newBarberData.name,
      photo: newBarberData.photo || undefined,
      yearsOfExperience: parseInt(newBarberData.yearsOfExperience) || undefined,
      description: newBarberData.description || undefined,
      specialties: newBarberData.specialties.split(',').map(s => s.trim()),
      availableHours: [...newBarberData.availableHours, ...newBarberData.customHours.split(',').map(h => h.trim()).filter(h => h !== '')].sort(),
      availableDates: newBarberData.availableDates, // availableDates is already an array
    };
    const updated = [...barbers, newBarber];
    storage.saveBarbers(updated);
    setBarbers(updated);
    setIsAddOpen(false);
    setNewBarberData({ name: '', photo: '', yearsOfExperience: '', description: '', specialties: '', availableHours: [], availableDates: [], customHours: '' });
    toast({ title: 'Barbeiro adicionado', description: 'O barbeiro foi cadastrado com sucesso' });
  };

  const handleUpdateBarber = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedBarbers = barbers.map(b => 
      b.id === editingBarber?.id 
        ? { ...b, 
            name: editBarberData.name,
            photo: editBarberData.photo || undefined,
            yearsOfExperience: parseInt(editBarberData.yearsOfExperience) || undefined,
            description: editBarberData.description || undefined,
            specialties: editBarberData.specialties.split(',').map(s => s.trim()),
            availableHours: [...editBarberData.availableHours, ...editBarberData.customHours.split(',').map(h => h.trim()).filter(h => h !== '')].sort(),
            availableDates: editBarberData.availableDates, // availableDates is already an array
          }
        : b
    );
    storage.saveBarbers(updatedBarbers);
    setBarbers(updatedBarbers);
    setEditingBarber(null);
    toast({ title: 'Barbeiro atualizado', description: 'Os dados do barbeiro foram atualizados.' });
  };

  const handleDelete = (id: string) => {
    const updated = barbers.filter(b => b.id !== id);
    storage.saveBarbers(updated);
    setBarbers(updated);
    toast({ title: 'Barbeiro removido', description: 'O barbeiro foi removido com sucesso' });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Voltar ao Dashboard</Button></Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Gerenciar Barbeiros</h2>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Barbeiro</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar Novo Barbeiro</DialogTitle></DialogHeader>
              <form onSubmit={handleAddNewBarber} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="name">Nome</Label><Input id="name" value={newBarberData.name} onChange={(e) => setNewBarberData({ ...newBarberData, name: e.target.value })} required /></div>
                  <div><Label htmlFor="yearsOfExperience">Anos de Profissão</Label><Input id="yearsOfExperience" type="number" value={newBarberData.yearsOfExperience} onChange={(e) => setNewBarberData({ ...newBarberData, yearsOfExperience: e.target.value })} /></div>
                </div>
                <div><Label htmlFor="photo">URL da Foto</Label><Input id="photo" value={newBarberData.photo} onChange={(e) => setNewBarberData({ ...newBarberData, photo: e.target.value })} placeholder="https://example.com/barber.jpg" /></div>
                <div><Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label><Input id="specialties" value={newBarberData.specialties} onChange={(e) => setNewBarberData({ ...newBarberData, specialties: e.target.value })} placeholder="Corte, Barba" required /></div>
                <div><Label htmlFor="description">Descrição</Label><Textarea id="description" value={newBarberData.description} onChange={(e) => setNewBarberData({ ...newBarberData, description: e.target.value })} /></div>
                
                <div className="space-y-2">
                  <Label>Horários Disponíveis</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {COMMON_HOURS.map(hour => (
                      <Button
                        key={hour}
                        variant={newBarberData.availableHours.includes(hour) ? 'default' : 'outline'}
                        onClick={() => {
                          const currentHours = newBarberData.availableHours;
                          if (currentHours.includes(hour)) {
                            setNewBarberData({
                              ...newBarberData,
                              availableHours: currentHours.filter(h => h !== hour),
                            });
                          } else {
                            setNewBarberData({
                              ...newBarberData,
                              availableHours: [...currentHours, hour].sort(),
                            });
                          }
                        }}
                      >
                        {hour}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="customHours">Outros Horários (separados por vírgula)</Label>
                  <Input
                    id="customHours"
                    value={newBarberData.customHours}
                    onChange={(e) => setNewBarberData({ ...newBarberData, customHours: e.target.value })}
                    placeholder="08:30, 12:15"
                  />
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
                            ? newBarberData.availableDates.slice(0, 2).map(dateStr => format(new Date(dateStr), 'dd/MM/yyyy')).join(', ')
                            : 'Selecione as datas'}
                          {newBarberData.availableDates.length > 2 && 
                            ` (+${newBarberData.availableDates.length - 2} mais)`
                          }
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="multiple" // Use multiple mode directly
                        selected={newBarberData.availableDates.map(dateStr => startOfDay(parseISO(dateStr)))}
                        onSelect={(selectedDates) => {
                          console.log('Selected Dates (raw):', selectedDates);
                          const formattedDates = selectedDates ? selectedDates.map(date => format(date, 'yyyy-MM-dd')) : [];
                          console.log('Formatted Dates:', formattedDates);
                          setNewBarberData({ ...newBarberData, availableDates: formattedDates });
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingBarber(barber)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(barber.id)}><Trash2 className="w-4 h-4" /></Button>
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
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Barbeiro</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateBarber} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="edit-name">Nome</Label><Input id="edit-name" value={editBarberData.name} onChange={(e) => setEditBarberData({ ...editBarberData, name: e.target.value })} required /></div>
              <div><Label htmlFor="edit-yearsOfExperience">Anos de Profissão</Label><Input id="edit-yearsOfExperience" type="number" value={editBarberData.yearsOfExperience} onChange={(e) => setEditBarberData({ ...editBarberData, yearsOfExperience: e.target.value })} /></div>
            </div>
            <div><Label htmlFor="edit-photo">URL da Foto</Label><Input id="edit-photo" value={editBarberData.photo} onChange={(e) => setEditBarberData({ ...editBarberData, photo: e.target.value })} placeholder="https://example.com/barber.jpg" /></div>
            <div><Label htmlFor="edit-specialties">Especialidades (separadas por vírgula)</Label><Input id="edit-specialties" value={editBarberData.specialties} onChange={(e) => setEditBarberData({ ...editBarberData, specialties: e.target.value })} placeholder="Corte, Barba" required /></div>
            <div><Label htmlFor="edit-description">Descrição</Label><Textarea id="edit-description" value={editBarberData.description} onChange={(e) => setEditBarberData({ ...editBarberData, description: e.target.value })} /></div>
            
            <div className="space-y-2">
              <Label>Horários Disponíveis</Label>
              <div className="grid grid-cols-3 gap-2">
                {COMMON_HOURS.map(hour => (
                  <Button
                    key={hour}
                    variant={editBarberData.availableHours.includes(hour) ? 'default' : 'outline'}
                    onClick={() => {
                      const currentHours = editBarberData.availableHours;
                      if (currentHours.includes(hour)) {
                        setEditBarberData({
                          ...editBarberData,
                          availableHours: currentHours.filter(h => h !== hour),
                        });
                      } else {
                        setEditBarberData({
                          ...editBarberData,
                          availableHours: [...currentHours, hour].sort(),
                        });
                      }
                    }}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-customHours">Outros Horários (separados por vírgula)</Label>
              <Input
                id="edit-customHours"
                value={editBarberData.customHours}
                onChange={(e) => setEditBarberData({ ...editBarberData, customHours: e.target.value })}
                placeholder="08:30, 12:15"
              />
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
                        ? editBarberData.availableDates.slice(0, 2).map(dateStr => format(new Date(dateStr), 'dd/MM/yyyy')).join(', ')
                        : 'Selecione as datas'}
                      {editBarberData.availableDates.length > 2 && 
                        ` (+${editBarberData.availableDates.length - 2} mais)`
                      }
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="multiple" // Use multiple mode directly
                    selected={editBarberData.availableDates.map(dateStr => startOfDay(parseISO(dateStr)))}
                    onSelect={(selectedDates) => {
                      console.log('Selected Dates (raw):', selectedDates);
                      const formattedDates = selectedDates ? selectedDates.map(date => format(date, 'yyyy-MM-dd')) : [];
                      console.log('Formatted Dates:', formattedDates);
                      setEditBarberData({ ...editBarberData, availableDates: formattedDates });
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
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
