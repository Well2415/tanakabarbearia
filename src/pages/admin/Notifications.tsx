import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { notificationManager } from '@/lib/notifications';
import { useToast } from '@/hooks/use-toast';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { Bell, BellOff, ArrowLeft, History, Shield, Smartphone, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Notifications = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = storage.getCurrentUser();

    const [pushEnabled, setPushEnabled] = useState(false);
    const [isPushSupported, setIsPushSupported] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'barber')) {
            navigate('/dashboard');
            return;
        }

        // Check Push Status
        notificationManager.isSupported().then(async supported => {
            setIsPushSupported(supported);
            const ios = notificationManager.isIOS();
            const standalone = notificationManager.isStandalone();
            setIsIOS(ios);
            setIsStandalone(standalone);

            if (supported) {
                const status = await notificationManager.getPermissionStatus();
                const sub = await notificationManager.getSubscription();
                setPushEnabled(status === 'granted' && !!sub);
            }
        });
    }, [user, navigate]);

    const handleTogglePush = async () => {
        if (!user) return;
        setIsProcessing(true);

        try {
            if (!pushEnabled) {
                const permission = await notificationManager.requestPermission();
                if (!permission) {
                    toast({ 
                        title: 'Permissão Negada', 
                        description: 'Ative as notificações nas configurações do seu navegador.', 
                        variant: 'destructive' 
                    });
                    return;
                }

                const sub = await notificationManager.subscribe();
                if (sub) {
                    await notificationManager.syncSubscriptionWithUser(user.id, sub);
                    setPushEnabled(true);
                    toast({ 
                        title: 'Notificações Ativadas!', 
                        description: 'Você receberá avisos de novos agendamentos neste dispositivo.' 
                    });
                } else {
                    toast({ 
                        title: 'Erro na Inscrição', 
                        description: 'Não foi possível registrar o dispositivo para notificações.', 
                        variant: 'destructive' 
                    });
                }
            } else {
                await notificationManager.syncSubscriptionWithUser(user.id, null);
                setPushEnabled(false);
                toast({ 
                    title: 'Notificações Desativadas', 
                    description: 'Você não receberá mais avisos push neste dispositivo.' 
                });
            }
        } catch (error) {
            console.error('Erro ao alternar Push:', error);
            toast({ 
                title: 'Erro', 
                description: 'Não foi possível alterar as configurações de notificação.', 
                variant: 'destructive' 
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTestPush = async () => {
        if (!user) return;
        setIsProcessing(true);
        try {
            const result = await notificationManager.sendPushNotification(
                user.id, 
                'Teste de Sistema 🛠️', 
                `Olá ${user.fullName}, as notificações push estão funcionando corretamente!`,
                '/admin/notifications'
            );
            
            if (result) {
                toast({ 
                    title: 'Teste Enviado!', 
                    description: 'Verifique se a notificação apareceu no seu dispositivo.' 
                });
            } else {
                toast({ 
                    title: 'Falha no Teste', 
                    description: 'A notificação não pôde ser enviada. Verifique se o dispositivo está inscrito.', 
                    variant: 'destructive' 
                });
            }
        } catch (error) {
            console.error('Erro no teste de Push:', error);
            toast({ 
                title: 'Erro Crítico', 
                description: 'Houve uma falha técnica ao tentar disparar o teste.', 
                variant: 'destructive' 
            });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background pb-32">
            <AdminMenu />

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <Link to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"}>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/20 hover:text-primary transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold tracking-tight text-white">Notificações</h1>
                        <p className="text-sm text-zinc-500">Configurações de avisos para novos agendamentos.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Status Section */}
                    <Card className="border-white/5 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl">
                        <CardHeader className="bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <Smartphone className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white font-bold">Este Dispositivo</CardTitle>
                                    <CardDescription className="text-zinc-400">Status das notificações push no seu navegador.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {!isPushSupported ? (
                                <div className="flex flex-col items-center text-center py-4 space-y-4">
                                    <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                                        <BellOff className="w-12 h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-xl text-white">Não Suportado</h3>
                                        <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                                            Seu navegador ou dispositivo atual não suporta notificações Push ou você está navegando em modo anônimo.
                                        </p>
                                    </div>
                                    {isIOS && !isStandalone && (
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left">
                                            <h4 className="font-bold text-amber-500 mb-2 flex items-center gap-2">
                                                <Shield className="w-4 h-4" /> Instruções para iPhone:
                                            </h4>
                                            <ol className="text-xs text-zinc-400 space-y-2 list-decimal ml-4">
                                                <li>Toque no ícone de compartilhar <span className="font-bold text-white">[↑]</span> no Safari.</li>
                                                <li>Selecione <span className="font-bold text-white">"Adicionar à Tela de Início"</span>.</li>
                                                <li>Abra o aplicativo pela tela de início para ativar as notificações.</li>
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                pushEnabled ? "bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]" : "bg-zinc-800"
                                            )}>
                                                {pushEnabled ? <Bell className="w-7 h-7 text-primary-foreground animate-pulse" /> : <BellOff className="w-7 h-7 text-zinc-500" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white">
                                                    {pushEnabled ? 'Ativadas' : 'Desativadas'}
                                                </h3>
                                                <p className="text-xs text-zinc-400">
                                                    {pushEnabled ? 'Você está pronto para receber alertas.' : 'Clique no botão ao lado para ativar.'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={handleTogglePush}
                                            disabled={isProcessing}
                                            variant={pushEnabled ? "outline" : "default"}
                                            className={cn(
                                                "rounded-2xl font-black px-6 h-14 min-w-[140px] shadow-lg transition-all",
                                                pushEnabled ? "border-primary/50 text-primary hover:bg-primary/10" : "bg-primary text-primary-foreground hover:scale-105"
                                            )}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                pushEnabled ? "DESATIVAR" : "ATIVAR"
                                            )}
                                        </Button>
                                    </div>

                                    {pushEnabled && (
                                        <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                                            <Button 
                                                variant="ghost" 
                                                onClick={handleTestPush}
                                                disabled={isProcessing}
                                                className="w-full h-12 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                                Testar Envio de Notificação
                                            </Button>
                                            <p className="text-[10px] text-center text-zinc-500 italic">
                                                Dica: Você deve ativar as notificações em cada dispositivo (celular, tablet, PC) que desejar receber alertas.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Links Section */}
                    {user.role === 'admin' && (
                        <Card className="border-white/5 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl">
                            <CardHeader className="bg-white/5 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-xl">
                                        <History className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg text-white font-bold">Administração</CardTitle>
                                        <CardDescription className="text-zinc-400">Logs e histórico de envios do sistema.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Link to="/admin/notifications/logs">
                                    <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-between px-6 group">
                                        <div className="flex items-center gap-3">
                                            <Bell className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                            <span>Ver Histórico de Notificações</span>
                                        </div>
                                        <ArrowLeft className="w-5 h-5 rotate-180 text-zinc-500" />
                                    </Button>
                                </Link>
                                <p className="mt-4 text-[10px] text-zinc-500 leading-relaxed">
                                    Os logs permitem verificar se as notificações foram disparadas corretamente para os barbeiros e clientes, facilitando a resolução de problemas de comunicação.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
