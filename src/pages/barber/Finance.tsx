import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { User, Appointment, Expense } from '@/types';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, Plus, Calendar as CalendarIcon, Filter, Layers, Settings, Trash2, X, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, isSameMonth, isSameYear, startOfToday, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { parseLocalDate } from '@/lib/timeUtils';

const Finance = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // SÍNCRONO: Pega os dados direto do storage antes da primeira renderização para não piscar a tela
  const currentUser = storage.getCurrentUser();
  const [user, setUser] = useState<User | null>(currentUser);
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    if (!currentUser) return [];
    const allAppointments = storage.getAppointments();
    const targetBarberId = currentUser.role === 'admin' ? null : (currentUser.barberId || currentUser.id);
    return targetBarberId ? allAppointments.filter(a => a.barberId === targetBarberId) : allAppointments;
  });
  
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (!currentUser) return [];
    const allExpenses = storage.getExpenses();
    const targetBarberId = currentUser.role === 'admin' ? null : (currentUser.barberId || currentUser.id);
    return targetBarberId ? allExpenses.filter(e => e.barberId === targetBarberId) : allExpenses;
  });
  
  const [categories, setCategories] = useState<string[]>(() => storage.getExpenseCategories());
  
  // Custom Filter States
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [filterYear, setFilterYear] = useState<string>(format(new Date(), 'yyyy'));
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isExpenseDateOpen, setIsExpenseDateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'revenue' | 'expense', description: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // New Expense State
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    date: format(startOfToday(), 'yyyy-MM-dd'),
    category: categories[0] || '',
  });

  // Manage Categories State
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const initFinance = async () => {
      await storage.initialize();
      const currentUser = storage.getCurrentUser();
      
      if (!currentUser || (currentUser.role !== 'barber' && currentUser.role !== 'admin')) {
        navigate('/dashboard');
        return;
      }
      
      setUser(currentUser);
      setUsers(storage.getUsers());
      setCategories(storage.getExpenseCategories());
      
      // Define o intervalo de busca baseado nos filtros
      let startStr: string | undefined;
      let endStr: string | undefined;

      if (filterPeriod === 'month') {
        const monthDate = parseISO(`${filterMonth}-01`);
        startStr = `${filterMonth}-01`;
        endStr = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      } else if (filterPeriod === 'year') {
        startStr = `${filterYear}-01-01`;
        endStr = `${filterYear}-12-31`;
      }

      // Busca dados reais do Supabase
      const { data: allAppointments } = await storage.fetchAppointments(startStr, endStr, 1000);
      const allExpenses = await storage.fetchExpenses(startStr, endStr);
      
      const targetBarberId = currentUser.role === 'admin' ? null : (currentUser.barberId || currentUser.id);
      
      setAppointments(targetBarberId ? allAppointments.filter(a => a.barberId === targetBarberId) : allAppointments);
      setExpenses(targetBarberId ? allExpenses.filter(e => e.barberId === targetBarberId) : allExpenses);
    };
    
    initFinance();
  }, [navigate, filterPeriod, filterMonth, filterYear]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPeriod, filterMonth, filterYear, filterCategory]);

  // Derived available options for filters
  const availableMonths = useMemo(() => Array.from(new Set([...appointments.map(a => a.date.substring(0, 7)), ...expenses.map(e => e.date.substring(0, 7)), format(new Date(), 'yyyy-MM')])).sort().reverse(), [appointments, expenses]);
  const availableYears = useMemo(() => Array.from(new Set([...appointments.map(a => a.date.substring(0, 4)), ...expenses.map(e => e.date.substring(0, 4)), format(new Date(), 'yyyy')])).sort().reverse(), [appointments, expenses]);

  // --- FILTERING LOGIC ---
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (a.status !== 'completed') return false;
      const d = parseLocalDate(a.date);
      if (filterPeriod === 'month') return isSameMonth(d, parseLocalDate(`${filterMonth}-01`));
      if (filterPeriod === 'year') return isSameYear(d, parseLocalDate(`${filterYear}-01-01`));
      return true; // 'all'
    });
  }, [appointments, filterPeriod, filterMonth, filterYear]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = parseLocalDate(e.date);
      let timeMatch = true;
      if (filterPeriod === 'month') timeMatch = isSameMonth(d, parseLocalDate(`${filterMonth}-01`));
      if (filterPeriod === 'year') timeMatch = isSameYear(d, parseLocalDate(`${filterYear}-01-01`));
      
      let catMatch = true;
      if (filterCategory !== 'all' && filterCategory !== 'revenue') {
        catMatch = e.category === filterCategory;
      }
      return timeMatch && catMatch;
    });
  }, [expenses, filterPeriod, filterMonth, filterYear, filterCategory]);

  const activeAppointments = (filterCategory === 'all' || filterCategory === 'revenue') ? filteredAppointments : [];
  const activeExpenses = filterCategory === 'revenue' ? [] : filteredExpenses;

  // Calculos de Caixa baseados no filtro (The Report)
  const totalRevenue = activeAppointments.reduce((acc, curr) => acc + (curr.finalPrice !== undefined ? curr.finalPrice : (curr.servicePrice || 0) + (curr.extraCharges || 0) - (curr.discount || 0)), 0);
  const totalExpense = activeExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalRevenue - totalExpense;

  // Transactions Mix
  const transactions = useMemo(() => {
    const revenueTx = activeAppointments.map(a => {
      const clientName = a.guestName 
        ? `${a.guestName} (Convidado)` 
        : users.find(u => u.id === a.userId)?.fullName || 'Cliente Externo';

      return {
        id: a.id,
        date: a.date,
        description: `Recebimento - ${clientName}`,
        amount: a.finalPrice || a.servicePrice || 0,
        type: 'revenue' as const,
        category: 'Serviço Concluído'
      };
    });

    const expenseTx = activeExpenses.map(e => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: e.amount,
      type: 'expense' as const,
      category: e.category
    }));

    return [...revenueTx, ...expenseTx].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  }, [activeAppointments, activeExpenses, users]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const displayedTransactions = useMemo(() => {
    return transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [transactions, currentPage]);

  // --- WEEKLY REVENUE CHART ---
  const weeklyRevenueData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(format(date, 'yyyy-MM-dd'));
    }
    
    return days.map(dateStr => {
      // Find all completed appointments for this specific day
      // Using allAppointments instead of active to ignore category filters for this global widget
      const dayAppointments = appointments.filter(a => a.date === dateStr && a.status === 'completed');
      const revenue = dayAppointments.reduce((sum, a) => sum + (a.finalPrice || a.servicePrice || 0), 0);

      return {
        date: dateStr,
        label: format(parseLocalDate(dateStr), 'EEE', { locale: ptBR }),
        revenue
      };
    });
  }, [appointments]);

  const maxRevenue = Math.max(...weeklyRevenueData.map(d => d.revenue), 100);

  // --- ACTIONS ---
  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.date || !newExpense.category) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    const expenseAmount = parseFloat(newExpense.amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      toast({ title: 'Atenção', description: 'O valor da despesa deve ser maior que zero.', variant: 'destructive' });
      return;
    }

    const expenseToAdd: Expense = {
      id: `exp_${Date.now()}`,
      barberId: user?.barberId || user?.id || 'admin',
      description: newExpense.description,
      amount: expenseAmount,
      date: newExpense.date,
      category: newExpense.category,
      createdAt: new Date().toISOString()
    };

    const updatedExpenses = [...storage.getExpenses(), expenseToAdd];
    await storage.saveExpenses(updatedExpenses);

    const targetBarberId = user?.role === 'admin' ? null : (user?.barberId || user?.id);
    setExpenses(targetBarberId ? updatedExpenses.filter(e => e.barberId === targetBarberId) : updatedExpenses);

    setIsExpenseModalOpen(false);
    setNewExpense({ description: '', amount: '', date: format(startOfToday(), 'yyyy-MM-dd'), category: categories[0] || '' });
    toast({ title: 'Sucesso', description: 'Despesa registrada com sucesso.' });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) {
      toast({ title: 'Atenção', description: 'Esta classificação já existe.', variant: 'destructive' });
      return;
    }
    const updatedCategories = [...categories, newCategoryName.trim()];
    await storage.saveExpenseCategories(updatedCategories);
    setCategories(updatedCategories);
    setNewCategoryName('');
    toast({ title: 'Classificação Adicionada', description: `A classificação "${newCategoryName.trim()}" foi criada.` });
  };

  const handleDeleteCategory = async (catToRemove: string) => {
    const updatedCategories = categories.filter(c => c !== catToRemove);
    await storage.saveExpenseCategories(updatedCategories);
    setCategories(updatedCategories);
    toast({ title: 'Classificação Removida', description: `A classificação "${catToRemove}" foi excluída.` });
  };

  const handleDeleteClick = (tx: any) => {
    setItemToDelete({ id: tx.id, type: tx.type, description: tx.description });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'expense') {
        await storage.deleteExpense(itemToDelete.id);
        const updatedExpenses = storage.getExpenses();
        const targetBarberId = user?.role === 'admin' ? null : (user?.barberId || user?.id);
        setExpenses(targetBarberId ? updatedExpenses.filter(e => e.barberId === targetBarberId) : updatedExpenses);
        toast({ title: 'Sucesso', description: 'Despesa excluída com sucesso.' });
      } else {
        await storage.deleteAppointment(itemToDelete.id);
        const updatedAppointments = storage.getAppointments();
        const targetBarberId = user?.role === 'admin' ? null : (user?.barberId || user?.id);
        setAppointments(targetBarberId ? updatedAppointments.filter(a => a.barberId === targetBarberId) : updatedAppointments);
        toast({ title: 'Sucesso', description: 'Receita (agendamento) excluída com sucesso.' });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao excluir o registro. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const getFilterLabel = () => {
    let timeBlock = '';
    if (filterPeriod === 'month') timeBlock = format(parseLocalDate(`${filterMonth}-01`), 'MMM/yyyy', { locale: ptBR });
    if (filterPeriod === 'year') timeBlock = `Ano ${filterYear}`;
    if (filterPeriod === 'all') timeBlock = 'Todo o Período';

    let catBlock = filterCategory === 'all' ? 'Todas Movimentações' : filterCategory === 'revenue' ? 'Apenas Receitas' : `Gastos com ${filterCategory}`;

    return `${catBlock} • ${timeBlock}`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {user.role === 'admin' ? (
        <AdminMenu />
      ) : (
        <nav className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" />Voltar ao Dashboard</Link>
            </Button>
          </div>
        </nav>
      )}
      <main className={`flex-grow ${user.role === 'admin' ? 'pb-24 md:pb-20 pt-8' : 'pt-8 pb-8'} px-4`}>
        <div className="container mx-auto max-w-5xl">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Wallet className="w-8 h-8 text-primary" />
                Financeiro
              </h1>
              <p className="text-muted-foreground mt-1">
                Relatórios e Movimentações {user.role === 'admin' ? 'da barbearia' : 'do seu perfil'}.
              </p>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
               <Button variant="outline" onClick={() => setIsFilterModalOpen(true)} className="flex-1 md:flex-none h-12 shadow-sm border-border bg-card">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button onClick={() => setIsExpenseModalOpen(true)} className="flex-1 md:flex-none h-12 shadow-sm font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Despesa
              </Button>
            </div>
          </div>

          <div className="bg-primary/5 text-primary text-sm font-medium px-4 py-2 rounded-lg mb-6 flex items-center border border-primary/20">
            <Filter className="w-4 h-4 mr-2 opacity-70" />
            Mostrando Filtro: <span className="ml-1 uppercase">{getFilterLabel()}</span>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {(filterCategory === 'all' || filterCategory === 'revenue') && (
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Receita Gerada</p>
                      <h3 className="text-2xl font-bold text-green-500">
                        R$ {totalRevenue.toFixed(2).replace('.', ',')}
                      </h3>
                    </div>
                    <div className="p-2 bg-green-500/10 rounded-xl">
                      <ArrowUpRight className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{activeAppointments.length} agendamentos concluídos</p>
                </CardContent>
              </Card>
            )}

            {(filterCategory === 'all' || filterCategory !== 'revenue') && (
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Custos / Despesas</p>
                      <h3 className="text-2xl font-bold text-red-500">
                        R$ {totalExpense.toFixed(2).replace('.', ',')}
                      </h3>
                    </div>
                    <div className="p-2 bg-red-500/10 rounded-xl">
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{activeExpenses.length} despesas contabilizadas</p>
                </CardContent>
              </Card>
            )}

            {filterCategory === 'all' && (
              <Card className="border-border bg-card/60 relative overflow-hidden md:col-span-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -mr-6 -mt-6" />
                <CardContent className="p-5 relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Líquido</p>
                      <h3 className={`text-2xl font-bold ${netBalance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                        R$ {netBalance.toFixed(2).replace('.', ',')}
                      </h3>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Lucro estimado no período filtrado</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gráfico Analítico de Faturamento Semanal */}
          {(filterCategory === 'all' || filterCategory === 'revenue') && filterPeriod === 'month' && isSameMonth(new Date(), parseISO(`${filterMonth}-01`)) && (
            <Card className="border-border shadow-sm mb-8 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">Faturamento Semanal</h3>
                </div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Últimos 7 dias</p>
              </div>

              <div className="p-4 md:p-6 space-y-4">
                {weeklyRevenueData.map((day, idx) => {
                  const heightPercentage = (day.revenue / maxRevenue) * 100;
                  return (
                    <div key={idx} className="flex flex-col gap-1 group">
                      <div className="flex justify-between items-center text-xs font-bold mb-1">
                        <span className="uppercase text-muted-foreground group-hover:text-primary transition-colors">
                          {day.label.replace('.', '')} - {format(parseISO(day.date), 'dd/MM')}
                        </span>
                        <span className="text-primary">R$ {day.revenue.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="h-4 w-full bg-primary/10 rounded-full overflow-hidden border border-primary/5">
                        <div
                          className="h-full bg-primary transition-all duration-500 rounded-full relative"
                          style={{ width: `${Math.max(heightPercentage, 2)}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Histórico Financeiro */}
          <Card className="border-border shadow-sm">
            <CardHeader className="p-4 md:p-6 border-b border-border bg-muted/20">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Movimentações</span>
                <span className="text-xs font-normal text-muted-foreground flex items-center bg-background border border-border px-3 py-1 rounded-full">
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  {transactions.length} registros
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Layers className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-muted-foreground font-medium">Nada encontrado nos filtros atuais.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="divide-y divide-border">
                    {displayedTransactions.map((tx) => (
                      <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'revenue' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {tx.type === 'revenue' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <p className="font-bold text-sm truncate max-w-[150px] md:max-w-full">{tx.description}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm truncate max-w-[100px]">
                                {tx.category}
                              </span>
                              <span className="text-[11px] text-muted-foreground ml-1">
                                {format(parseLocalDate(tx.date), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right shrink-0">
                            <p className={`font-bold text-sm md:text-base ${tx.type === 'revenue' ? 'text-green-500' : 'text-red-500'}`}>
                              {tx.type === 'revenue' ? '+' : '-'} R$ {tx.amount.toFixed(2).replace('.', ',')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteClick(tx)}
                            className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                            title="Excluir Lançamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalPages > 0 && (
                    <div className="p-4 border-t border-border bg-muted/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-sm text-muted-foreground text-center sm:text-left">
                        Mostrando <span className="font-medium">{transactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, transactions.length)}</span> de <span className="font-medium">{transactions.length}</span> registros
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium px-2">
                          Página {currentPage} de {Math.max(1, totalPages)}
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage >= totalPages || totalPages === 0}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>

      {/* FOOTNOTE MENU REPLACEMENT (MOBILE FIX) */}
      {user.role !== 'admin' && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}

      {/* --- MODALS E DRAWERS PARA MOBILE-FIRST --- */}

      {/* Filtros Modal/Drawer */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="sm:max-w-[425px] flex flex-col items-center">
          <DialogHeader className="text-left w-full border-b pb-4">
            <DialogTitle className="flex items-center"><Filter className="w-5 h-5 mr-2 text-primary" /> Filtro de Relatórios</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-5 py-4 w-full">
            {/* Period Filter */}
            <div className="grid gap-2">
              <Label className="font-bold text-primary">1. Escolha o Período</Label>
              <Select value={filterPeriod} onValueChange={(val: any) => setFilterPeriod(val)}>
                <SelectTrigger className="h-12 bg-muted/50">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mês Específico</SelectItem>
                  <SelectItem value="year">Ano Inteiro (Ex: Gastos de 2026)</SelectItem>
                  <SelectItem value="all">Todo o Período (Toda Vida)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contextual Date Pickers */}
            {filterPeriod === 'month' && (
              <div className="grid gap-2 pl-4 border-l-2 border-primary/20">
                <Label>Qual Mês?</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="h-12">
                     <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(m => (
                      <SelectItem key={m} value={m}><span className="capitalize">{format(parseISO(`${m}-01`), 'MMMM/yyyy', { locale: ptBR })}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

             {filterPeriod === 'year' && (
              <div className="grid gap-2 pl-4 border-l-2 border-primary/20">
                <Label>Qual Ano?</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="h-12">
                     <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Category Filter */}
            <div className="grid gap-2 mt-2">
               <Label className="font-bold text-primary">2. Escolha o Tipo de Movimentação</Label>
               <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-12 bg-muted/50">
                     <SelectValue placeholder="Movimentação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Ver Tudo (Receitas e Gastos)</SelectItem>
                    <SelectItem value="revenue">Apenas Receitas (Ganhos)</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>Gasto com: {c}</SelectItem>
                    ))}
                  </SelectContent>
               </Select>
            </div>
          </div>

          <DialogFooter className="w-full mt-2">
             <Button onClick={() => setIsFilterModalOpen(false)} className="w-full h-12 text-lg font-bold">Gerar Relatório</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Modal Adicionar Despesa */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Nova Despesa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label>Descrição da Despesa</Label>
              <Input
                placeholder="Ex: Conta de Luz, Pomada Modeladora"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="grid gap-2">
                <Label>Data de Pagamento</Label>
                <Popover open={isExpenseDateOpen} onOpenChange={setIsExpenseDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full h-12 justify-start text-left font-normal bg-card', !newExpense.date && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{newExpense.date ? format(parseLocalDate(newExpense.date), 'dd/MM/yyyy') : 'Selecione a data'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newExpense.date ? parseLocalDate(newExpense.date) : undefined}
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          setNewExpense({ ...newExpense, date: format(selectedDate, 'yyyy-MM-dd') });
                        }
                        setIsExpenseDateOpen(false);
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center mb-1">
                <Label>Classificação</Label>
                <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="text-xs text-primary font-bold flex items-center bg-primary/10 px-2 py-1 rounded-md">
                   <Settings className="w-3 h-3 mr-1" /> Editar Opções
                </button>
              </div>
              <Select 
                value={newExpense.category} 
                onValueChange={(val: any) => setNewExpense({ ...newExpense, category: val })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                     <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button onClick={handleAddExpense} className="w-full h-12">Registrar Pagamento</Button>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="w-full h-12">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal Gerenciar Categorias */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
           <DialogHeader>
             <DialogTitle>Gerenciar Classificações</DialogTitle>
           </DialogHeader>
           
           <div className="flex gap-2 w-full mt-4">
              <Input 
                placeholder="Ex: Aluguel" 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-11 flex-1"
                onKeyDown={(e) => { if(e.key === 'Enter') handleAddCategory() }}
              />
              <Button onClick={handleAddCategory} className="h-11">Adicionar</Button>
           </div>
           
           <div className="mt-6 flex flex-col gap-2 max-h-[40vh] overflow-y-auto w-full px-1 py-1">
              <Label className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Classificações Existentes</Label>
              {categories.map(cat => (
                <div key={cat} className="flex justify-between items-center p-3 border border-border rounded-xl bg-card">
                   <span className="font-medium text-sm">{cat}</span>
                   <button 
                     onClick={() => handleDeleteCategory(cat)} 
                     className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-center text-muted-foreground text-sm my-4">Nenhuma categoria registrada.</p>
              )}
           </div>
           <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)} className="w-full h-12 font-bold">Concluído</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmação de Exclusão */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="w-5 h-5" /> Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Deseja realmente excluir este lançamento?
            </p>
            <div className="mt-4 p-3 bg-muted rounded-lg border border-border">
              <p className="text-sm font-bold">{itemToDelete?.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {itemToDelete?.type === 'revenue' ? 'Esta ação removerá permanentemente o agendamento do sistema.' : 'Esta ação removerá permanentemente o registro da despesa.'}
              </p>
            </div>
            <p className="text-xs text-red-500 mt-4 font-medium flex items-center gap-1">
              <X className="w-3 h-3" /> Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="destructive" onClick={confirmDelete} className="w-full h-12">Excluir Permanentemente</Button>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="w-full h-12">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Finance;
