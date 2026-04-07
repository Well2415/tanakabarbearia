import { useEffect, useState } from 'react';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { NotificationLog, User } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertCircle, CheckCircle2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage } from '@/lib/storage';

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
            // Busca logs ordenados por data decrescente
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

            <div className="container mx-auto px-4 py-8 pb-32">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                            <Bell className="w-8 h-8 text-primary" />
                            Logs de Notificações
                        </h2>
                        <p className="text-muted-foreground mt-1">Monitore a entrega de mensagens PWA para clientes e equipe.</p>
                    </div>
                    <Badge variant="outline" className="text-sm py-1 px-3">
                        Total: {logs.length} registros
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por cliente, título ou mensagem..." 
                            className="pl-10 h-11"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="h-11">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <SelectValue placeholder="Filtrar por Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="success">Sucesso</SelectItem>
                            <SelectItem value="error">Erros</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card className="border-border overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border">
                        <CardTitle className="text-lg font-medium">Histórico de Envios</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                                Carregando logs...
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Nenhum log encontrado para os filtros selecionados.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Data/Hora</th>
                                            <th className="px-6 py-4 font-bold">Destinatário</th>
                                            <th className="px-6 py-4 font-bold">Notificação</th>
                                            <th className="px-6 py-4 font-bold text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                                    {format(new Date(log.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-foreground">
                                                    {getTargetName(log.userId)}
                                                </td>
                                                <td className="px-6 py-4 max-w-md">
                                                    <div className="font-bold text-sm mb-0.5">{log.title}</div>
                                                    <div className="text-xs text-muted-foreground line-clamp-2">{log.body}</div>
                                                    {log.status === 'error' && log.errorMessage && (
                                                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-500 font-mono break-all">
                                                            <span className="font-bold mr-1 uppercase">[Erro]:</span> {log.errorMessage}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {log.status === 'success' ? (
                                                        <div className="flex flex-col items-center gap-1 text-green-500">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            <span className="text-[10px] font-bold uppercase">Sucesso</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1 text-red-500">
                                                            <AlertCircle className="w-5 h-5" />
                                                            <span className="text-[10px] font-bold uppercase">Falha</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default NotificationLogs;
