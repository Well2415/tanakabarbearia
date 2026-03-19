import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Scissors, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple authentication check
    const users = storage.getUsers();
    const user = users.find(u => u.email === credentials.email);

    if (user && credentials.password === 'admin123') {
      storage.loginUser(user.id);
      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo ao painel administrativo',
      });
      navigate('/admin/dashboard');
    } else {
      toast({
        title: 'Erro',
        description: 'E-mail ou senha incorretos',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = () => {
    const users = storage.getUsers();
    // Admins and Barbers have access here
    const userFound = users.find(u => 
      u.email?.toLowerCase() === resetEmail.toLowerCase() && 
      (u.role === 'admin' || u.role === 'barber')
    );

    if (userFound) {
      // Gerar um token aleatório simples
      const token = Math.random().toString(36).substring(2, 15);
      
      // Salvar o token no usuário
      const updatedUsers = users.map(u => 
        u.id === userFound.id ? { ...u, resetToken: token } : u
      );
      storage.saveUsers(updatedUsers);

      setEmailSent(true);
      
      // Simular o envio do e-mail com um link clicável no Toast
      const resetLink = `${window.location.origin}/reset-password?token=${token}`;
      
      toast({
          title: 'E-mail enviado!',
          description: (
              <div className="flex flex-col gap-2">
                  <p>Um link de recuperação administrativa foi enviado para {resetEmail}.</p>
                  <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary font-bold justify-start"
                      onClick={() => navigate(`/reset-password?token=${token}`)}
                  >
                      [SIMULAR] Clique aqui para abrir o link do e-mail
                  </Button>
              </div>
          ),
      });
    } else {
      toast({
        title: 'E-mail não encontrado',
        description: 'Não encontramos nenhuma conta administrativa com este e-mail.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Scissors className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">TANAKA BARBEARIA</h1>
          <p className="text-muted-foreground">Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              placeholder="admin@barbershop.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="password">Senha</Label>
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-xs text-primary hover:underline font-medium"
              >
                Esqueceu a senha?
              </button>
            </div>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Entrar
          </Button>

          <p className="text-sm text-muted-foreground text-center mt-4">
            Demo: admin@barbershop.com / admin123
          </p>
        </form>
      </Card>

      <Dialog open={isForgotOpen} onOpenChange={(open) => {
        setIsForgotOpen(open);
        if (!open) {
          setEmailSent(false);
          setResetEmail('');
        }
      }}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Recuperar Senha Admin</DialogTitle>
            <DialogDescription>
              {emailSent 
                ? 'Verifique sua caixa de entrada para o link de recuperação.' 
                : 'Insira o seu e-mail administrativo para receber o link de redefinição.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {!emailSent ? (
              <div className="space-y-2">
                <Label htmlFor="reset-email">E-mail</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="admin@barbershop.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium text-lg">E-mail Enviado!</p>
                <p className="text-sm text-muted-foreground">
                  Enviamos as instruções administrativas para <strong>{resetEmail}</strong>.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {!emailSent ? (
              <>
                <Button variant="ghost" onClick={() => setIsForgotOpen(false)}>Cancelar</Button>
                <Button onClick={handleResetPassword}>Enviar Link</Button>
              </>
            ) : (
              <Button className="w-full" onClick={() => setIsForgotOpen(false)}>Fechar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
