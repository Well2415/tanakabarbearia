import { Link, Navigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
const LogoLoginImg = "/img/logo-tanaka.png";
import { storage } from '@/lib/storage';

const Booking = () => {
  const user = storage.getCurrentUser();

  if (user) {
    return <Navigate to="/new-appointment" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <img src={LogoLoginImg} alt="Logotipo da Barbearia" className="h-32 w-auto object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-center mb-4">
            Agende seu <span className="text-primary">Horário</span>
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Como você gostaria de continuar?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">

            <Card className="p-8 flex flex-col items-center justify-center border-primary/50 hover:border-primary transition-all">
              <h2 className="text-2xl font-bold mb-4">Sou um novo cliente</h2>
              <p className="text-muted-foreground mb-6 h-24">
                Crie uma conta para aproveitar nosso plano de fidelidade, ganhar recompensas e gerenciar seus agendamentos futuros com facilidade.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link to="/register" className="w-full">Cadastrar e Agendar</Link>
              </Button>
            </Card>

            <Card className="p-8 flex flex-col items-center justify-center border-border hover:border-foreground/20 transition-all">
              <h2 className="text-2xl font-bold mb-4">Já tenho uma conta</h2>
              <p className="text-muted-foreground mb-6 h-24">
                Faça login para agendar mais rápido usando seus dados salvos ou continue como convidado.
              </p>
              <div className="flex flex-col gap-4 w-full">
                <Button asChild size="lg" className="w-full">
                  <Link to="/login" className="w-full">Entrar</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full">
                  <Link to="/guest-booking" className="w-full">Agendar como Convidado</Link>
                </Button>
              </div>
            </Card>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Booking;
