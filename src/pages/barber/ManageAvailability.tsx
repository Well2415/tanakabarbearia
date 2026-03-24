import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Barber } from '@/types';
import { format } from 'date-fns';
import { sortTimes } from '@/lib/timeUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

const ManageAvailability = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();

  const [barberProfile, setBarberProfile] = useState<Barber | null>(null);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const [showAddDateDialog, setShowAddDateDialog] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [showEditDateDialog, setShowEditDateDialog] = useState(false);
  const [editingDate, setEditingDate] = useState('');
  const [editingDateIndex, setEditingDateIndex] = useState<number | null>(null);

  const [showAddHourDialog, setShowAddHourDialog] = useState(false);
  const [newHour, setNewHour] = useState('');
  const [showEditHourDialog, setShowEditHourDialog] = useState(false);
  const [editingHour, setEditingHour] = useState('');
  const [editingHourIndex, setEditingHourIndex] = useState<number | null>(null);

  const handleAddDate = () => {
    const datesToAdd = newDate.split(',').map(d => d.trim()).filter(d => d !== '');
    const uniqueNewDates = datesToAdd.filter(d => !availableDates.includes(d));
    if (uniqueNewDates.length > 0) {
      setAvailableDates([...availableDates, ...uniqueNewDates].sort());
      setNewDate('');
      setShowAddDateDialog(false);
      toast({ title: `${uniqueNewDates.length} data(s) adicionada(s)!` });
    } else if (datesToAdd.length > 0) {
      toast({ title: 'Todas as datas já existem ou são inválidas', variant: 'destructive' });
    } else {
      toast({ title: 'Nenhuma data para adicionar', variant: 'destructive' });
    }
  };

  const handleDeleteDate = (dateToDelete: string) => {
    setAvailableDates(availableDates.filter(date => date !== dateToDelete));
    toast({ title: 'Data removida!' });
  };

  const handleAddHour = () => {
    const hoursToAdd = newHour.split(',').map(h => h.trim()).filter(h => h !== '');
    const uniqueNewHours = hoursToAdd.filter(h => !availableHours.includes(h));
    if (uniqueNewHours.length > 0) {
      setAvailableHours(sortTimes([...availableHours, ...uniqueNewHours]));
      setNewHour('');
      setShowAddHourDialog(false);
      toast({ title: `${uniqueNewHours.length} horário(s) adicionado(s)!` });
    } else if (hoursToAdd.length > 0) {
      toast({ title: 'Todos os horários já existem ou são inválidos', variant: 'destructive' });
    } else {
      toast({ title: 'Nenhum horário para adicionar', variant: 'destructive' });
    }
  };

  const handleDeleteHour = (hourToDelete: string) => {
    setAvailableHours(availableHours.filter(hour => hour !== hourToDelete));
    toast({ title: 'Horário removido!' });
  };

  const handleEditDate = () => {
    if (editingDateIndex !== null && editingDate) {
      const updatedDates = [...availableDates];
      updatedDates[editingDateIndex] = editingDate;
      setAvailableDates(updatedDates.sort());
      setEditingDate('');
      setEditingDateIndex(null);
      setShowEditDateDialog(false);
      toast({ title: 'Data atualizada!' });
    }
  };

  const handleEditHour = () => {
    if (editingHourIndex !== null && editingHour) {
      const updatedHours = [...availableHours];
      updatedHours[editingHourIndex] = editingHour;
      setAvailableHours(sortTimes(updatedHours));
      setEditingHour('');
      setEditingHourIndex(null);
      setShowEditHourDialog(false);
      toast({ title: 'Horário atualizado!' });
    }
  };

  useEffect(() => {
    const currentUser = storage.getCurrentUser();

    if (!currentUser || currentUser.role !== 'barber') {
      toast({ title: "Acesso Negado", variant: "destructive" });
      navigate('/dashboard');
      return;
    }

    const barbers = storage.getBarbers();
    const profile = barbers.find(b => b.id === currentUser.barberId);

    if (profile) {
      setBarberProfile(profile);
      setAvailableHours(profile.availableHours);
      setAvailableDates(profile.availableDates);
    } else {
      toast({ title: "Perfil não encontrado", description: "Não foi possível encontrar um perfil de barbeiro associado a este usuário.", variant: "destructive" });
      navigate('/dashboard');
    }
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberProfile) return;

    const allBarbers = storage.getBarbers();
    const updatedBarbers = allBarbers.map(b =>
      b.id === barberProfile.id
        ? {
          ...b,
          availableHours: availableHours,
          availableDates: availableDates,
        }
        : b
    );

    await storage.saveBarbers(updatedBarbers);
    toast({ title: 'Horários e Datas Atualizados!', description: 'Sua lista de horários e datas de trabalho foi salva.' });
    navigate('/dashboard');
  };

  if (!user || !barberProfile) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Voltar ao Dashboard</Link>
          </Button>

        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h2 className="text-3xl font-bold mb-8">Gerenciar Minha Disponibilidade</h2>
        <Card>
          <CardHeader><CardTitle>Minhas Datas e Horários de Trabalho</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Datas Disponíveis</h3>
                {availableDates.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma data disponível.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableDates.map((date, index) => (
                      <Badge key={index} variant="secondary" className="text-base px-3 py-1 flex items-center gap-2">
                        {date}
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => {
                          setEditingDate(date);
                          setEditingDateIndex(index);
                          setShowEditDateDialog(true);
                        }}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-4 w-4 text-destructive hover:text-destructive" onClick={() => handleDeleteDate(date)}><Trash2 className="h-3 w-3" /></Button>
                      </Badge>
                    ))}
                  </div>
                )}
                <Button className="mt-4" onClick={() => setShowAddDateDialog(true)}>Adicionar Data</Button>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Horários Disponíveis</h3>
                {availableHours.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum horário disponível.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableHours.map((hour, index) => (
                      <Badge key={index} variant="secondary" className="text-base px-3 py-1 flex items-center gap-2">
                        {hour}
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => {
                          setEditingHour(hour);
                          setEditingHourIndex(index);
                          setShowEditHourDialog(true);
                        }}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-4 w-4 text-destructive hover:text-destructive" onClick={() => handleDeleteHour(hour)}><Trash2 className="h-3 w-3" /></Button>
                      </Badge>
                    ))}
                  </div>
                )}
                <Button className="mt-4" onClick={() => setShowAddHourDialog(true)}>Adicionar Horário</Button>
              </div>

              <div className="pt-6 border-t border-border">
                <Button onClick={handleSubmit} className="w-full h-14 text-lg font-bold">
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Date Dialog */}
      <Dialog open={showAddDateDialog} onOpenChange={setShowAddDateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Nova Data</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label htmlFor="newDate">Datas (AAAA-MM-DD, separadas por vírgula)</Label>
            <Input
              id="newDate"
              type="text"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              placeholder="2025-10-26, 2025-10-27, 2025-10-28"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleAddDate}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Date Dialog */}
      <Dialog open={showEditDateDialog} onOpenChange={setShowEditDateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Data</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label htmlFor="editingDate">Data (AAAA-MM-DD)</Label>
            <Input
              id="editingDate"
              type="date"
              value={editingDate}
              onChange={(e) => setEditingDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleEditDate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Hour Dialog */}
      <Dialog open={showEditHourDialog} onOpenChange={setShowEditHourDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Horário</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label htmlFor="editingHour">Horário (HH:MM)</Label>
            <Input
              id="editingHour"
              type="time"
              value={editingHour}
              onChange={(e) => setEditingHour(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleEditHour}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Hour Dialog */}
      <Dialog open={showAddHourDialog} onOpenChange={setShowAddHourDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Novo Horário</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label htmlFor="newHour">Horários (HH:MM, separados por vírgula)</Label>
            <Input
              id="newHour"
              type="text"
              value={newHour}
              onChange={(e) => setNewHour(e.target.value)}
              placeholder="09:00, 10:00, 11:00"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button onClick={handleAddHour}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageAvailability;
