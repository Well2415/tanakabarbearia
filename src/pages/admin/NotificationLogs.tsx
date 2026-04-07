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

            <div className="container mx-auto px-4 py-8 pb-32 max-w-2xl">
                <div className="flex flex-col gap-2 mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <History className="w-6 h-6 text-primary" />
                        Histórico de Avisos
                    </h2>
                    <p className="text-sm text-muted-foreground">Monitoramento de notificações enviadas (PWA).</p>
                    <div className="flex justify-between items-center mt-2">
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                           {logs.length} Notificações
                        </Badge>
                        {loading && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}
                    </div>
                </div>

                {/* Filtros Mobile-Optimized */}
                <div className="space-y-3 mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar cliente ou mensagem..." 
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

                {/* Lista de Cards */}
                <div className="space-y-4">
                    {loading && logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <div className="animate-pulse flex flex-col items-center">
                                <Bell className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-sm">Carregando histórico...</p>
                            </div>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <Card className="border-dashed bg-transparent shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Bell className="w-10 h-10 mb-2 opacity-10" />
                                <p className="text-sm">Nenhum log encontrado.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredLogs.map((log) => (
                            <Card key={log.id} className={cn(
                                "border-border/50 overflow-hidden shadow-sm active:scale-[0.98] transition-transform",
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
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Destinatário</span>
                                            <span className="font-bold text-base leading-tight">
                                                {getTargetName(log.userId)}
                                            </span>
                                        </div>

                                        <div className="flex flex-col bg-muted/30 p-3 rounded-lg border border-border/20">
                                            <span className="font-bold text-sm text-primary mb-1">{log.title}</span>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{log.body}</p>
                                        </div>

                                        {log.status === 'error' && log.errorMessage && (
                                            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
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
                        ))
                    )
                    }
                </div>
            </div>
        </div>
    );
};

export default NotificationLogs;
