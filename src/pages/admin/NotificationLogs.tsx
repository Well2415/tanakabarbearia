import { useEffect, useState } from 'react';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { NotificationLog, User } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertCircle, CheckCircle2, Search, Filter, History } from 'lucide-react';
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
            const { data: logsData, error: logsError } = await supabase
                .from('notification_logs')
                .select('*')
                .order('createdAt', { ascending: false });

            if (logsError) throw logsError;
            setLogs(logsData || []);
            setUsers(storage.getUsers());
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
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

    return (
        <div className="min-h-screen bg-background">
            <AdminMenu />

            <div className="container mx-auto px-4 py-8 pb-32 max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                            <History className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                            Histórico de Avisos
                        </h2>
                        <p className="text-sm text-muted-foreground italic">Monitoramento de notificações PWA enviadas.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-[10px] md:text-xs font-bold uppercase tracking-wider py-1 px-3">
                           {logs.length} Registros
                        </Badge>
                        {loading && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}
                    </div>
                </div>

                {/* Filtros Híbridos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar cliente, título ou mensagem..." 
                            className="pl-10 h-12 bg-muted/20 border-border/50 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="h-12 bg-muted/20 border-border/50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <SelectValue placeholder="Todos os Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                            <SelectItem value="all">Ver Tudo</SelectItem>
                            <SelectItem value="success">Entregues (Sucesso)</SelectItem>
                            <SelectItem value="error">Falhas (Erro)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {loading && logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-card border border-dashed rounded-3xl">
                        <div className="animate-pulse flex flex-col items-center">
                            <Bell className="w-16 h-16 mb-4 opacity-10" />
                            <p className="text-lg font-medium">Sincronizando logs...</p>
                        </div>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <Card className="border-dashed bg-transparent shadow-none rounded-3xl">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Bell className="w-12 h-12 mb-4 opacity-10" />
                            <p className="text-base">Nenhum registro encontrado para a busca atual.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* VISÃO DESKTOP - APENAS EM COMPUTADORES (Tabela) */}
                        <div className="hidden md:block overflow-hidden border border-border/50 rounded-2xl bg-card shadow-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] uppercase font-black bg-muted/50 text-muted-foreground border-b border-border/50">
                                    <tr>
                                        <th className="px-6 py-4 tracking-tighter">Data/Hora</th>
                                        <th className="px-6 py-4 tracking-tighter">Destinatário</th>
                                        <th className="px-6 py-4 tracking-tighter">Notificação</th>
                                        <th className="px-6 py-4 tracking-tighter text-center">Resultado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className={cn(
                                            "hover:bg-muted/30 transition-colors",
                                            log.status === 'error' ? "bg-red-500/[0.02]" : ""
                                        )}>
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-medium text-xs">
                                                {format(new Date(log.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-foreground">
                                                {getTargetName(log.userId)}
                                            </td>
                                            <td className="px-6 py-4 max-w-md">
                                                <div className="font-bold text-primary mb-1">{log.title}</div>
                                                <div className="text-xs text-muted-foreground leading-relaxed italic line-clamp-2">{log.body}</div>
                                                {log.status === 'error' && log.errorMessage && (
                                                    <div className="mt-2 p-3 bg-red-500/5 border border-red-500/10 rounded-lg font-mono text-[10px] text-red-500 italic">
                                                        <span className="font-black uppercase mr-2">[Erro]:</span> {log.errorMessage}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {log.status === 'success' ? (
                                                    <div className="inline-flex flex-col items-center gap-1 text-green-500">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Sucesso</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex flex-col items-center gap-1 text-red-500">
                                                        <AlertCircle className="w-5 h-5" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Falha</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* VISÃO MOBILE - APENAS EM CELULARES (Cards) */}
                        <div className="md:hidden space-y-4">
                            {filteredLogs.map((log) => (
                                <Card key={log.id} className={cn(
                                    "border-border/50 overflow-hidden shadow-sm active:scale-[0.98] transition-transform rounded-2xl",
                                    log.status === 'error' ? "bg-red-500/5" : "bg-card"
                                )}>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                {log.status === 'success' ? (
                                                    <div className="bg-green-500/10 p-1.5 rounded-full">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-red-500/10 p-1.5 rounded-full">
                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                    </div>
                                                )}
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    log.status === 'success' ? "text-green-500" : "text-red-500"
                                                )}>
                                                    {log.status === 'success' ? 'Entregue' : 'Falha no Envio'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-medium text-muted-foreground bg-muted p-1 px-2 rounded-md">
                                                {format(new Date(log.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Para:</span>
                                                <span className="font-bold text-base leading-tight">
                                                    {getTargetName(log.userId)}
                                                </span>
                                            </div>

                                            <div className="flex flex-col bg-muted/30 p-3 rounded-xl border border-border/20">
                                                <span className="font-bold text-sm text-primary mb-1">{log.title}</span>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{log.body}</p>
                                            </div>

                                            {log.status === 'error' && log.errorMessage && (
                                                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                    <p className="text-[10px] font-black text-red-500 uppercase mb-1 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> Detalhe do Erro:
                                                    </p>
                                                    <p className="text-[11px] text-red-600/80 font-mono break-all leading-tight italic">
                                                        {log.errorMessage}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationLogs;
