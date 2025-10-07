import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Scissors } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple authentication check
    const users = storage.getUsers();
    const user = users.find(u => u.email === credentials.email);

    if (user && credentials.password === 'admin123') {
      storage.setCurrentUser(user);
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Scissors className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Beardy Flow</h1>
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
            <Label htmlFor="password">Senha</Label>
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
    </div>
  );
};

export default Login;
