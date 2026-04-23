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
import { Palmtree } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isHolidayMode = storage.getHolidayMode();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const users = storage.getUsers();
    const userExists = users.find(u => u.username.toLowerCase() === formData.username.toLowerCase());

    if (userExists) {
      toast({
        title: 'Erro de Cadastro',
        description: 'Este nome de usuário já está em uso. Por favor, escolha outro.',
        variant: 'destructive',
      });
      return;
    }

    const newUser: any = {
      id: Date.now().toString(),
      fullName: formData.fullName.trim(),
      username: formData.username.trim().toLowerCase(),
      password: formData.password.trim(), // Em um app real, isso seria criptografado
      email: formData.email?.trim().toLowerCase() || undefined, // Make sure it's undefined if empty
      phone: formData.phone.trim(),
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
      role: 'client', // Default role for new registrations
    };

    await storage.updateUser(newUser);
    storage.loginUser(newUser.id);

    toast({
      title: 'Cadastro realizado com sucesso!',
      description: 'Você foi logado e já pode aproveitar os benefícios do nosso clube de fidelidade.',
    });

    navigate('/new-appointment');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-md">
          <h1 className="text-4xl font-bold text-center mb-4">
            Crie sua <span className="text-primary">Conta</span>
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Cadastre-se para aproveitar nosso plano de fidelidade.
          </p>

          <Card className="p-8 border-border">
            {isHolidayMode ? (
              <div className="text-center py-10 space-y-6">
                <div className="flex justify-center">
                  <div className="p-6 bg-primary/10 rounded-full">
                    <Palmtree className="w-16 h-16 text-primary animate-bounce" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold">Estamos em Férias!</h2>
                <p className="text-muted-foreground">
                  Nossa equipe está tirando um breve descanso para recarregar as energias.
                  Agendamentos presenciais e pelo site estão suspensos temporariamente.
                </p>
                <div className="pt-4">
                  <Link to="/">
                    <Button variant="outline" className="w-full">Voltar ao Início</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
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
                <div>
                  <Label htmlFor="phone">Telefone (apenas números)</Label>
                  <Input
                    id="phone"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, phone: value });
                    }}
                    placeholder="Ex: 11999999999"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail (Opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-2">Usado para recuperação de senha.</p>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Cadastrar e Agendar
                </Button>
              </form>
            )}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Faça login aqui.
              </Link>
            </p>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
