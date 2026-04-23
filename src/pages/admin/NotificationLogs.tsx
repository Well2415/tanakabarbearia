import { useEffect, useState } from 'react';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { NotificationLog, User } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Bell, Search, Filter, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NotificationLogs = () => {
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
    
    // Estados de Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchData();
    }, [currentPage, statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            await storage.initializeConfig();
            
            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            let query = supabase
                .from('notification_logs')
                .select('*', { count: 'exact' });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data: logsData, error: logsError, count } = await query
                .order('createdAt', { ascending: false })
                .range(from, to);

            if (logsError && logsError.message.includes('createdAt')) {
                const { data, error, count: countAlt } = await query
                    .order('created_at', { ascending: false })
                    .range(from, to);
                
                if (error) throw error;
                setLogs(data?.map(log => ({ ...log, createdAt: log.created_at })) || []);
                if (countAlt !== null) setTotalCount(countAlt);
            } else {
                if (logsError) throw logsError;
                setLogs(logsData || []);
                if (count !== null) setTotalCount(count);
            }

            // Carrega usuários básicos para exibir nomes nos logs
            const { data: usersData } = await storage.fetchUsers(100);
            setUsers(usersData);

        } catch (error) {
            console.error('❌ [Logs] Falha ao carregar logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (val: 'all' | 'success' | 'error') => {
        setStatusFilter(val);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const getTargetName = (userId: string | null) => {
        if (!userId) return 'Sistema / Geral';
        const user = users.find(u => u.id === userId);
        return user ? user.fullName : 'Usuário Desconhecido';
    };

    const filteredLogs = logs.filter(log => {
        const targetName = getTargetName(log.userId).toLowerCase();
        return targetName.includes(searchTerm.toLowerCase()) || 
               log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               log.body.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const SkeletonLog = () => (
        <Card className="border-border/50 rounded-2xl animate-pulse bg-muted/20">
            <CardContent className="p-4 h-[120px] flex flex-col justify-between">
                <div className="flex justify-between items-center">
                    <div className="h-4 w-20 bg-muted rounded-md" />
                    <div className="h-4 w-24 bg-muted rounded-md" />
                </div>
                <div className="h-6 w-3/4 bg-muted rounded-md" />
                <div className="h-4 w-full bg-muted rounded-md" />
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AdminMenu />

            <div className="container mx-auto px-4 py-8 pb-32 max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                            <History className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                            Histórico de Avisos
                        </h2>
                        <p className="text-sm text-muted-foreground italic">Monitoramento de notificações PWA.</p>
                    </div>
                    <div className="flex items-center gap-3 h-8">
                        <div className={cn("transition-opacity duration-300", loading ? "opacity-100" : "opacity-0")}>
                             <div className="animate-spin h-3 w-3 border-[1.5px] border-primary border-t-transparent rounded-full" />
                        </div>
                        <Badge variant="secondary" className="text-[10px] md:text-xs font-bold uppercase tracking-wider py-1 px-3 min-w-[100px] justify-center">
                           {totalCount} Registros
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar cliente, título ou mensagem..." 
                            className="pl-10 h-12 bg-muted/20 border-border/50 rounded-xl focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={handleFilterChange}>
                        <SelectTrigger className="h-12 bg-muted/20 border-border/50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="success">Sucesso</SelectItem>
                            <SelectItem value="error">Falha</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* VISÃO DESKTOP (Tabela) */}
                <div className="hidden md:block overflow-hidden border border-border/50 rounded-2xl bg-card shadow-lg mb-6">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase font-black bg-muted/50 text-muted-foreground border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Destinatário</th>
                                <th className="px-6 py-4">Notificação</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-6"><div className="h-4 bg-muted rounded w-20" /></td>
                                        <td className="px-6 py-6"><div className="h-4 bg-muted rounded w-32" /></td>
                                        <td className="px-6 py-6"><div className="h-6 bg-muted rounded w-full" /></td>
                                        <td className="px-6 py-6"><div className="h-8 bg-muted rounded-full w-8 mx-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground italic">
                                        Nenhum registro encontrado nesta página.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs">
                                            {log.createdAt || log.created_at ? format(new Date(log.createdAt || log.created_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : '---'}
                                        </td>
                                        <td className="px-6 py-4 font-bold">
                                            {getTargetName(log.userId)}
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="font-bold text-primary mb-1">{log.title}</div>
                                            <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{log.body}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full mx-auto flex items-center justify-center",
                                                log.status === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                            )}>
                                                <Bell className="w-4 h-4" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* VISÃO MOBILE */}
                <div className="md:hidden space-y-4 mb-6">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => <SkeletonLog key={i} />)
                    ) : filteredLogs.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground">Sem registros.</div>
                    ) : (
                        filteredLogs.map((log) => (
                            <Card key={log.id} className="border-border/40 rounded-2xl overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] text-muted-foreground">
                                            {log.createdAt || log.created_at ? format(new Date(log.createdAt || log.created_at), "dd/MM HH:mm", { locale: ptBR }) : '---'}
                                        </span>
                                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-[8px] h-4">
                                            {log.status === 'success' ? 'OK' : 'FALHA'}
                                        </Badge>
                                    </div>
                                    <div className="font-bold text-sm mb-1">{getTargetName(log.userId)}</div>
                                    <div className="text-xs font-bold text-primary mb-1">{log.title}</div>
                                    <p className="text-[10px] text-muted-foreground line-clamp-2">{log.body}</p>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* CONTROLE DE PAGINAÇÃO */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="w-10 h-10 rounded-xl"
                            disabled={currentPage === 1 || loading}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Lógica básica de páginas próximas à atual
                                let pageNum = currentPage;
                                if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;

                                if (pageNum > 0 && pageNum <= totalPages) {
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            className={cn(
                                                "w-10 h-10 rounded-xl font-bold",
                                                currentPage === pageNum ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                            )}
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={loading}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                }
                                return null;
                            })}
                        </div>

                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="w-10 h-10 rounded-xl"
                            disabled={currentPage === totalPages || loading}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationLogs;
