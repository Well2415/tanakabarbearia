import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { useNavigate, Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/storage';
import { Scissors, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
const LogoLoginImg = "/img/LOGO LOGIN.png";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Força uma atualização dos dados do banco antes de tentar o login
      storage.isInitialized = false; 
      await storage.initialize();
      
      const users = storage.getUsers();
      const typedUsername = formData.username.trim();
      const typedPassword = formData.password.trim();

      const user = users.find(u => {
        const matchUsername = (u.username || "").trim().toLowerCase() === typedUsername.toLowerCase();
        const matchPassword = (u.password || "").trim() === typedPassword;
        
        if (matchUsername) {
          console.log('🔍 [Login Debug] Usuário encontrado:', u.username);
          console.log('🔍 [Login Debug] ID do Usuário:', u.id);
          console.log('🔍 [Login Debug] Senha no Banco existe?', !!u.password);
          console.log('🔍 [Login Debug] Senha coincide?', matchPassword);
        }
        
        return matchUsername && matchPassword;
      });

      if (user) {
        storage.loginUser(user.id);
        toast({
          title: 'Login bem-sucedido!',
          description: `Bem-vindo de volta, ${user.fullName || user.username}!`,
        });

        if (user.role === 'admin' || user.role === 'barber') {
          navigate('/admin');
        } else {
          navigate('/new-appointment');
        }
      } else {
        toast({
          title: 'Erro de Login',
          description: 'Nome de usuário ou senha incorretos.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: 'Erro de Login',
        description: 'Não foi possível completar o login. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const users = storage.getUsers();
    const userFound = users.find(u => u.email?.toLowerCase() === resetEmail.toLowerCase());

    if (userFound) {
      const token = Math.random().toString(36).substring(2, 15);
      const updatedUsers = users.map(u => 
        u.id === userFound.id ? { ...u, resetToken: token } : u
      );
      await storage.saveUsers(updatedUsers);

      // --- CONFIGURAÇÃO EMAILJS ---
      // Caso o usuário queira configurar o EmailJS real, basta preencher essas chaves
      const serviceId = 'service_e4x7fpt'; 
      const templateId = 'template_1iiwjpo'; 
      const publicKey = 'M-pKH1rG1vhPTLUvw'; 
      
      const resetLink = `${window.location.origin}/reset-password?token=${token}`;

      try {
        await emailjs.send(
          serviceId, 
          templateId, 
          {
            to_name: userFound.fullName,
            to_email: resetEmail,
            reset_link: resetLink,
            shop_name: storage.getShopName()
          }, 
          publicKey
        );
        
        setEmailSent(true);
        toast({
          title: 'E-mail enviado!',
          description: (
            <div className="flex flex-col gap-2">
              <p>Instruções enviadas para {resetEmail}. Verifique sua caixa de entrada.</p>
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary font-bold justify-start"
                onClick={() => navigate(`/reset-password?token=${token}`)}
              >
                [DEBUG] Abrir link agora
              </Button>
            </div>
          ),
        });
      } catch (error) {
        console.error('Erro ao enviar e-mail via EmailJS:', error);
        toast({
          title: 'Erro no disparo',
          description: 'Houve um erro ao tentar enviar o e-mail. Usando modo de teste.',
          variant: 'destructive',
        });
        setEmailSent(true); // Mantém o fluxo visual
      }
    } else {
      toast({
        title: 'E-mail não encontrado',
        description: 'Não encontramos nenhuma conta com este e-mail cadastrado.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-md">
          <div className="flex justify-center mb-6">
            <img src={LogoLoginImg} alt="Logotipo da Barbearia" className="h-32 w-auto object-contain" />
          </div>
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
                  autoCapitalize="none"
                  autoCorrect="off"
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
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

      <Dialog open={isForgotOpen} onOpenChange={(open) => {
        setIsForgotOpen(open);
        if (!open) {
          setEmailSent(false);
          setResetEmail('');
        }
      }}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>
              {emailSent 
                ? 'Verifique sua caixa de entrada para o link de recuperação.' 
                : 'Insira o seu e-mail cadastrado para receber o link de redefinição.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {!emailSent ? (
              <div className="space-y-2">
                <Label htmlFor="reset-email">E-mail</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium text-lg">E-mail Enviado!</p>
                <p className="text-sm text-muted-foreground">
                  Enviamos as instruções para <strong>{resetEmail}</strong>. Se não encontrar, verifique sua pasta de spam.
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

      <Footer />
    </div>
  );
};

export default Login;
