import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Scissors, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<'valid' | 'invalid' | 'success'>('invalid');
    const [targetUser, setTargetUser] = useState<any>(null);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            setIsLoading(false);
            return;
        }

        const users = storage.getUsers();
        // Em um sistema real, o token teria expiração. Aqui simulamos buscando o usuário com este token.
        const userFound = users.find(u => (u as any).resetToken === token);

        if (userFound) {
            setTargetUser(userFound);
            setStatus('valid');
        } else {
            setStatus('invalid');
        }
        setIsLoading(false);
    }, [token]);

    const handleReset = (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast({
                title: 'Erro na senha',
                description: 'As senhas não coincidem.',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword.length < 4) {
             toast({
                title: 'Senha muito curta',
                description: 'A senha deve ter pelo menos 4 caracteres.',
                variant: 'destructive',
            });
            return;
        }

        const users = storage.getUsers();
        const updatedUsers = users.map(u => {
            if (u.id === targetUser.id) {
                const { resetToken, ...rest } = u as any;
                return { ...rest, password: newPassword };
            }
            return u;
        });

        storage.saveUsers(updatedUsers);
        setStatus('success');
        toast({
            title: 'Senha redefinida!',
            description: 'Sua senha foi alterada com sucesso.',
        });
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navigation />
            <main className="flex-grow pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-md">
                    <Card className="border-border shadow-lg">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                    {status === 'success' ? (
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    ) : status === 'invalid' ? (
                                        <AlertCircle className="w-8 h-8 text-destructive" />
                                    ) : (
                                        <Lock className="w-8 h-8 text-primary" />
                                    )}
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-bold">
                                {status === 'success' ? 'Senha Alterada!' : 
                                 status === 'invalid' ? 'Link Inválido' : 'Nova Senha'}
                            </CardTitle>
                            <CardDescription>
                                {status === 'success' ? 'Você já pode acessar sua conta com a nova senha.' :
                                 status === 'invalid' ? 'Este link de recuperação expirou ou é inválido.' :
                                 'Crie uma nova senha segura para sua conta.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {status === 'valid' && (
                                <form onSubmit={handleReset} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">Nova Senha</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full h-12">
                                        Redefinir Senha
                                    </Button>
                                </form>
                            )}

                            {(status === 'success' || status === 'invalid') && (
                                <Button 
                                    onClick={() => navigate('/login')} 
                                    variant={status === 'success' ? 'default' : 'outline'} 
                                    className="w-full h-12"
                                >
                                    Voltar para o Login
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ResetPassword;
