import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/storage';
import { Appointment, User, Barber, Service } from '@/types';
import { Ticket, Trophy, Calendar, Sparkles, RotateCcw, Search, Award, CheckCircle2, Scissors, UserCog, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';

interface RaffleConfig {
  prizeName: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  active: boolean;
}

interface WinnerRecord {
  id: string;
  prizeName: string;
  drawnAt: string;
  raffleNumber: string;
  clientName: string;
  clientPhone?: string;
  barberName: string;
  serviceName: string;
  appointmentDate: string;
}

export default function Raffles() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = storage.getCurrentUser();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Configuração do Sorteio Ativo
  const [raffleConfig, setRaffleConfig] = useState<RaffleConfig>({
    prizeName: 'Kit Churrasco Completo 🥩',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    active: true,
  });
  const [editPrizeName, setEditPrizeName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // Histórico de Ganhadores
  const [history, setHistory] = useState<WinnerRecord[]>([]);

  // Estados do Modal de Sorteio (Roleta)
  const [showSpinnerModal, setShowSpinnerModal] = useState(false);
  const [displayNumber, setDisplayNumber] = useState('????');
  const [winningAppointment, setWinningAppointment] = useState<Appointment | null>(null);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);

  useEffect(() => {
    const isStaff = user?.role === 'admin' || user?.role === 'barber';
    if (!user || !isStaff) {
      toast({ title: 'Acesso Negado', description: 'Você não tem permissão para acessar esta página.', variant: 'destructive' });
      navigate('/dashboard');
      return;
    }

    const loadedAppointments = storage.getAppointments();
    const loadedUsers = storage.getUsers();
    const loadedBarbers = storage.getBarbers();
    const loadedServices = storage.getServices();

    setAppointments(loadedAppointments);
    setUsers(loadedUsers);
    setBarbers(loadedBarbers);
    setServices(loadedServices);

    // Carregar configurações de sorteio salvas
    const savedConfig = storage.getSetting('active_raffle_config', null);
    if (savedConfig) {
      setRaffleConfig(savedConfig);
      setEditPrizeName(savedConfig.prizeName || '');
      setEditStartDate(savedConfig.startDate || '');
      setEditEndDate(savedConfig.endDate || '');
    } else {
      setEditPrizeName('Kit Churrasco Completo 🥩');
      setEditStartDate(format(new Date(), 'yyyy-MM-dd'));
      setEditEndDate(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
    }

    // Carregar histórico de sorteios salvos
    const savedHistory = storage.getSetting('raffle_history', []);
    setHistory(savedHistory);
  }, [navigate, toast, user]);

  const handleSaveConfig = async () => {
    const updated: RaffleConfig = {
      prizeName: editPrizeName || 'Sorteio Especial',
      startDate: editStartDate,
      endDate: editEndDate,
      active: true,
    };
    await storage.saveSetting('active_raffle_config', updated);
    setRaffleConfig(updated);
    toast({ title: 'Configurações Salvas!', description: 'As datas e o prêmio do sorteio foram atualizados com sucesso.' });
  };

  const getClientName = (appointment: Appointment) => {
    if (!appointment) return 'Cliente Desconhecido';
    if (appointment.guestName) return `${appointment.guestName} (Convidado)`;
    const client = users.find(u => u.id === appointment.userId);
    return client?.fullName || 'Cliente Desconhecido';
  };

  const getClientPhone = (appointment: Appointment) => {
    if (appointment.guestPhone) return appointment.guestPhone;
    const client = users.find(u => u.id === appointment.userId);
    return client?.phone || 'N/A';
  };

  const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'N/A';
  const getServiceName = (id: string | string[]) => {
    const ids = Array.isArray(id) ? id : [id];
    return ids.map(serviceId => services.find(s => s.id === serviceId)?.name).filter(Boolean).join(' + ') || 'N/A';
  };

  // Filtrar apenas agendamentos que possuem número da sorte ativo
  const activeTickets = appointments.filter(a => a.raffleNumber && a.raffleNumber.trim() !== '');

  const filteredTickets = activeTickets.filter(a => {
    const clientName = getClientName(a).toLowerCase();
    const num = (a.raffleNumber || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return clientName.includes(query) || num.includes(query);
  });

  // Iniciar Roleta de Sorteio
  const handleStartDraw = () => {
    if (activeTickets.length === 0) {
      toast({
        title: 'Nenhum bilhete ativo',
        description: 'Não há agendamentos com números da sorte cadastrados para sortear.',
        variant: 'destructive',
      });
      return;
    }

    setShowSpinnerModal(true);

    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * activeTickets.length);
      const randomNum = activeTickets[randomIdx].raffleNumber || '0000';
      setDisplayNumber(randomNum);
      counter++;

      if (counter > 30) {
        clearInterval(interval);
        // Escolhe o vencedor oficial
        const winner = activeTickets[Math.floor(Math.random() * activeTickets.length)];
        setWinningAppointment(winner);
        setDisplayNumber(winner.raffleNumber || '0000');
        setShowSpinnerModal(false);
        setShowWinnerDialog(true);
      }
    }, 100);
  };

  // Confirmar Ganhador e Resetar Números da Sorte
  const handleConfirmWinnerAndReset = async () => {
    if (!winningAppointment) return;

    const winnerRecord: WinnerRecord = {
      id: Date.now().toString(),
      prizeName: raffleConfig.prizeName,
      drawnAt: new Date().toISOString(),
      raffleNumber: winningAppointment.raffleNumber || 'N/A',
      clientName: getClientName(winningAppointment),
      clientPhone: getClientPhone(winningAppointment),
      barberName: getBarberName(winningAppointment.barberId),
      serviceName: getServiceName(winningAppointment.serviceIds || winningAppointment.serviceId),
      appointmentDate: winningAppointment.date,
    };

    const newHistory = [winnerRecord, ...history];
    await storage.saveSetting('raffle_history', newHistory);
    setHistory(newHistory);

    // RESET DOS NÚMEROS DA SORTE PARA PRÓXIMO SORTEIO
    const resetAppointments = appointments.map(a => ({
      ...a,
      raffleNumber: undefined,
    }));

    await storage.saveAppointments(resetAppointments);
    setAppointments(resetAppointments);

    setShowWinnerDialog(false);
    setWinningAppointment(null);

    toast({
      title: '🏆 Sorteio Concluído & Números Resetados!',
      description: `O ganhador #${winnerRecord.raffleNumber} (${winnerRecord.clientName}) foi registrado. A numeração está livre para o próximo sorteio!`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <AdminMenu />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
              <Ticket className="w-8 h-8 text-purple-600" /> Gestão de Sorteios
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure o prêmio, valide números únicos, realize sorteios com roleta e resete para a próxima campanha.
            </p>
          </div>
          <Button
            onClick={handleStartDraw}
            disabled={activeTickets.length === 0}
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12 shadow-lg shadow-purple-500/20 gap-2"
          >
            <Sparkles className="w-5 h-5 animate-pulse" /> Realizar Sorteio
          </Button>
        </div>

        {/* Top Cards (Stats & Config) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Configuração da Campanha */}
          <Card className="md:col-span-2 border-purple-500/20 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" /> Campanha de Sorteio Ativa
                </span>
                <Badge className="bg-purple-600 text-white font-bold">EM ANDAMENTO</Badge>
              </CardTitle>
              <CardDescription>Defina o prêmio e o período de validade das rifas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prizeName" className="font-bold text-xs uppercase text-muted-foreground">Prêmio / Título do Sorteio</Label>
                <Input
                  id="prizeName"
                  value={editPrizeName}
                  onChange={(e) => setEditPrizeName(e.target.value)}
                  placeholder="Ex: Kit Churrasco Completo"
                  className="h-11 mt-1 font-semibold border-purple-200 focus-visible:ring-purple-400"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="font-bold text-xs uppercase text-muted-foreground">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="h-11 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="font-bold text-xs uppercase text-muted-foreground">Data de Término</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="h-11 mt-1"
                  />
                </div>
              </div>
              <Button onClick={handleSaveConfig} variant="outline" className="w-full sm:w-auto h-10 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold">
                Salvar Configurações da Campanha
              </Button>
            </CardContent>
          </Card>

          {/* Resumo de Participantes */}
          <Card className="bg-gradient-to-br from-purple-900/10 via-background to-indigo-900/10 border-purple-500/20 shadow-md flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase font-bold text-muted-foreground flex items-center justify-between">
                Participantes Ativos <Ticket className="w-4 h-4 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-4xl font-extrabold text-purple-600 font-mono">
                {activeTickets.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTickets.length === 1 ? '1 bilhete emitido' : `${activeTickets.length} bilhetes distribuídos`} nesta rodada.
              </p>
            </CardContent>
            <div className="p-4 pt-0">
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-200/40 text-xs font-medium text-purple-700 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 shrink-0" />
                Ao sortear, os números são salvos e resetados automaticamente.
              </div>
            </div>
          </Card>
        </div>

        {/* Barra de Busca e Filtro */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou número (#1042)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 border-border"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Exibindo <span className="font-bold text-foreground">{filteredTickets.length}</span> de <span className="font-bold text-foreground">{activeTickets.length}</span> bilhetes da campanha.
          </p>
        </div>

        {/* Lista Responsiva de Bilhetes Ativos */}
        <div className="space-y-4 mb-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-600" /> Bilhetes da Rodada Atual
          </h2>

          {filteredTickets.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="font-bold text-base">Nenhum Número da Sorte Encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTickets.length === 0
                  ? 'Conclua agendamentos no painel do barbeiro ou admin preenchendo o "Nº da Sorte" para gerar os bilhetes.'
                  : 'Nenhum bilhete corresponde à sua busca.'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="p-4 border-2 border-purple-500/20 hover:border-purple-500/40 transition-all shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-300 font-mono text-base font-extrabold px-3 py-1">
                      #{ticket.raffleNumber}
                    </Badge>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                      Concluído
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-base truncate">{getClientName(ticket)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Scissors className="w-3.5 h-3.5 text-primary" /> {getServiceName(ticket.serviceIds || ticket.serviceId)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <UserCog className="w-3.5 h-3.5 text-primary" /> Barbeiro: {getBarberName(ticket.barberId)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> {new Date(ticket.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {ticket.time}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Histórico de Ganhadores Anteriores */}
        <div className="space-y-4 pt-6 border-t border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Histórico de Ganhadores Passados
          </h2>

          {history.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm">
              Nenhum sorteio foi encerrado ainda. Quando realizar o primeiro sorteio, o histórico aparecerá aqui.
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <Card key={record.id} className="p-4 bg-gradient-to-r from-amber-500/5 via-background to-purple-500/5 border-amber-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">{record.prizeName}</span>
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-700 font-mono font-extrabold">
                            #{record.raffleNumber}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ganhador: <span className="font-bold text-foreground">{record.clientName}</span> ({record.clientPhone})
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Corte em {new Date(record.appointmentDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      <p>Sorteado em {format(parseISO(record.drawnAt), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal da Roleta de Sorteio */}
      <Dialog open={showSpinnerModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-[90vw] sm:max-w-[400px] text-center p-8 bg-background border-2 border-purple-500/40">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600 animate-spin" /> Sorteando Ganhador...
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cruzando os bilhetes ativos para o prêmio: <strong className="text-purple-600">{raffleConfig.prizeName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-8">
            <div className="text-6xl font-black font-mono text-purple-600 bg-purple-500/10 py-6 rounded-2xl border-2 border-purple-500/30 animate-pulse tracking-wider">
              #{displayNumber}
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">Aguarde a roleta parar no bilhete vencedor...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal do Ganhador & Resete */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[480px] p-6 text-center border-2 border-amber-500/40">
          <DialogHeader>
            <div className="mx-auto p-4 bg-amber-500/10 text-amber-500 rounded-full w-20 h-20 flex items-center justify-center mb-2 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-black text-amber-600">
              PARABÉNS AO GANHADOR! 🎉
            </DialogTitle>
            <DialogDescription className="text-sm font-medium">
              Sorteio realizado para: <span className="font-bold text-foreground">{raffleConfig.prizeName}</span>
            </DialogDescription>
          </DialogHeader>

          {winningAppointment && (
            <div className="my-4 p-4 bg-muted/40 rounded-2xl border border-border space-y-3 text-left">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs uppercase font-bold text-muted-foreground">Número Sorteado</span>
                <Badge className="bg-purple-600 text-white font-mono text-lg font-black px-3 py-1">
                  #{winningAppointment.raffleNumber}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Cliente Contemplado</p>
                <p className="text-lg font-extrabold text-foreground">{getClientName(winningAppointment)}</p>
                <p className="text-xs text-muted-foreground">Telefone: {getClientPhone(winningAppointment)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                <div>
                  <span className="text-muted-foreground">Serviço:</span>
                  <p className="font-bold text-foreground truncate">{getServiceName(winningAppointment.serviceIds || winningAppointment.serviceId)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Barbeiro:</span>
                  <p className="font-bold text-foreground">{getBarberName(winningAppointment.barberId)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-purple-500/10 rounded-xl text-xs text-purple-700 text-left flex items-start gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Ao clicar em <strong>Confirmar e Resetar Números</strong>, o ganhador será gravado no Histórico e os números dos agendamentos serão resetados para iniciar a próxima campanha livremente.
            </span>
          </div>

          <DialogFooter className="flex flex-col gap-2">
            <Button
              onClick={handleConfirmWinnerAndReset}
              size="lg"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> Confirmar Ganhador & Resetar Números
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
