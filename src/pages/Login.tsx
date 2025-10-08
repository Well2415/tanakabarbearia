import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const users = storage.getUsers();
    const user = users.find(u => u.username === formData.username && u.password === formData.password);

    if (user) {
      storage.loginUser(user.id);
      toast({
        title: 'Login bem-sucedido!',
        description: `Bem-vindo de volta, ${user.fullName}!`,
      });
      navigate('/');
    } else {
      toast({
        title: 'Erro de Login',
        description: 'Usuário ou senha inválidos.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-md">
          <h1 className="text-4xl font-bold text-center mb-4">
            Acesse sua <span className="text-primary">Conta</span>
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Faça login para agendar e ver suas recompensas.
          </p>

          <Card className="p-8 border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Entrar
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Cadastre-se aqui.
              </Link>
            </p>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
