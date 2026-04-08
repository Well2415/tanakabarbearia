import { useEffect, useState } from 'react';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { NotificationLog, User } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Bell, Search, Filter, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';

const NotificationLogs = () => {
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            console.log('[Logs] Buscando registros na tabela notification_logs...');
            await storage.initialize();
            
            // Tenta buscar com createdAt (padrão camelCase)
            let { data: logsData, error: logsError } = await supabase
                .from('notification_logs')
                .select('*')
                .order('createdAt', { ascending: false });

            // Se der erro de coluna não encontrada, tenta created_at (padrão snake_case)
            if (logsError && logsError.message.includes('createdAt')) {
                console.warn('[Logs] Coluna createdAt não encontrada, tentando created_at...');
                const { data, error } = await supabase
                    .from('notification_logs')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                logsData = data;
                logsError = error;
            }

            if (logsError) {
                console.error('❌ [Logs] Erro ao buscar logs:', logsError);
                throw logsError;
            }
            
            console.log(`✅ [Logs] ${logsData?.length || 0} registros carregados.`);
            
            // Adaptar dados caso venham com snake_case do banco
            const normalizedLogs = (logsData || []).map(log => ({
                ...log,
                createdAt: log.createdAt || log.created_at || new Date().toISOString()
            }));

            setLogs(normalizedLogs);
            setUsers(storage.getUsers());
        } catch (error) {
            console.error('❌ [Logs] Falha crítica ao carregar página de logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTargetName = (userId: string | null) => {
        if (!userId) return 'Sistema / Geral';
        const user = users.find(u => u.id === userId);
        return user ? user.fullName : 'Usuário Desconhecido';
    };

    const filteredLogs = logs.filter(log => {
        const targetName = getTargetName(log.userId).toLowerCase();
        const matchesSearch = targetName.includes(searchTerm.toLowerCase()) || 
                             log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             log.body.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Skeleton loader component to prevent layout jumps
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
                {/* Header Estável */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                            <History className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                            Histórico de Avisos
                        </h2>
                        <p className="text-sm text-muted-foreground italic">Monitoramento de notificações PWA.</p>
                    </div>
                    <div className="flex items-center gap-3 h-8">
                        {/* Indicador de carga discreto para não mover o Badge */}
                        <div className={cn("transition-opacity duration-300", loading ? "opacity-100" : "opacity-0")}>
                             <div className="animate-spin h-3 w-3 border-[1.5px] border-primary border-t-transparent rounded-full" />
                        </div>
                        <Badge variant="secondary" className="text-[10px] md:text-xs font-bold uppercase tracking-wider py-1 px-3 min-w-[100px] justify-center">
                           {loading ? '---' : `${filteredLogs.length} Registros`}
                        </Badge>
                    </div>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="relative md:col-span-2 text-foreground">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar cliente, título ou mensagem..." 
                            className="pl-10 h-12 bg-muted/20 border-border/50 rounded-xl focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
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
                <div className="hidden md:block overflow-hidden border border-border/50 rounded-2xl bg-card shadow-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase font-black bg-muted/50 text-muted-foreground border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4 tracking-tighter">Data/Hora</th>
                                <th className="px-6 py-4 tracking-tighter">Destinatário</th>
                                <th className="px-6 py-4 tracking-tighter">Notificação</th>
                                <th className="px-6 py-4 tracking-tighter text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading && logs.length === 0 ? (
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
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className={cn(
                                        "hover:bg-muted/30 transition-colors",
                                        log.status === 'error' ? "bg-red-500/[0.01]" : ""
                                    )}>
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-xs">
                                            {format(new Date(log.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                        </td>
                                        <td className="px-6 py-4 font-bold">
                                            {getTargetName(log.userId)}
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <div className="font-bold text-primary mb-1">{log.title}</div>
                                            <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{log.body}</div>
                                            {log.status === 'error' && log.errorMessage && (
                                                <div className="mt-2 p-2 bg-red-500/5 border border-red-500/10 rounded-lg font-mono text-[10px] text-red-500 italic">
                                                    {log.errorMessage}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center">
                                                <div className={cn(
                                                    "p-2 rounded-full",
                                                    log.status === 'success' ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                                                )}>
                                                    <Bell className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* VISÃO MOBILE (Cards) */}
                <div className="md:hidden space-y-4">
                    {loading && logs.length === 0 ? (
                        Array(3).fill(0).map((_, i) => <SkeletonLog key={i} />)
                    ) : filteredLogs.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground">
                            <Bell className="w-12 h-12 mb-4 mx-auto opacity-10" />
                            <p>Nenhum log encontrado.</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <Card key={log.id} className={cn(
                                "border-border/40 overflow-hidden shadow-sm active:scale-[0.98] transition-transform rounded-2xl",
                                log.status === 'error' ? "bg-muted/10 border-red-500/10" : "bg-card"
                            )}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "p-1.5 rounded-full",
                                                log.status === 'success' ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                                            )}>
                                                <Bell className="w-4 h-4" />
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                log.status === 'success' ? "text-green-500" : "text-muted-foreground"
                                            )}>
                                                {log.status === 'success' ? 'Sucesso' : 'Erro (Push)'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 p-1 px-2 rounded-md">
                                            {format(new Date(log.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tight block">Destinatário:</span>
                                            <span className="font-bold text-base leading-tight">
                                                {getTargetName(log.userId)}
                                            </span>
                                        </div>

                                        <div className="bg-muted/30 p-3 rounded-xl border border-border/10">
                                            <span className="font-bold text-sm text-primary block mb-1">{log.title}</span>
                                            <p className="text-xs text-muted-foreground leading-relaxed italic">{log.body}</p>
                                        </div>

                                        {log.status === 'error' && log.errorMessage && (
                                            <div className="mt-1 p-2 bg-red-500/5 text-[10px] text-red-500 font-mono italic rounded-lg">
                                                {log.errorMessage}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationLogs;
