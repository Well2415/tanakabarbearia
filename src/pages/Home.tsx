import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Scissors, Clock, Award, Star } from 'lucide-react';
import { storage } from '@/lib/storage';

const Home = () => {
  const services = storage.getServices();
  const barbers = storage.getBarbers();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Estilo e Tradição
            <span className="block text-primary mt-2">em um só lugar</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experimente o melhor serviço de barbearia com profissionais qualificados
            e um ambiente moderno e acolhedor.
          </p>
          <Link to="/booking">
            <Button size="lg" className="text-lg px-8 py-6">
              Agendar Agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scissors className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Profissionais Experientes</h3>
              <p className="text-muted-foreground">
                Nossa equipe possui anos de experiência e treinamento constante
              </p>
            </Card>

            <Card className="p-6 text-center border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Agendamento Fácil</h3>
              <p className="text-muted-foreground">
                Agende online de forma rápida e escolha seu horário preferido
              </p>
            </Card>

            <Card className="p-6 text-center border-border">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Qualidade Premium</h3>
              <p className="text-muted-foreground">
                Produtos de alta qualidade e atendimento personalizado
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Nossos <span className="text-primary">Serviços</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="p-6 border-border hover:border-primary transition-colors">
                <h3 className="text-2xl font-bold mb-2">{service.name}</h3>
                <p className="text-muted-foreground mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">R$ {service.price}</span>
                  <span className="text-sm text-muted-foreground">{service.duration} min</span>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/services">
              <Button variant="outline">Ver Todos os Serviços</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Barbers */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Nossa <span className="text-primary">Equipe</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map((barber) => (
              <Card key={barber.id} className="p-6 border-border text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Scissors className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{barber.name}</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {barber.specialties.map((specialty, idx) => (
                    <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {specialty}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            O que dizem nossos <span className="text-primary">clientes</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Pedro Oliveira', text: 'Melhor barbearia da região! Atendimento excelente e resultado impecável.' },
              { name: 'Lucas Ferreira', text: 'Profissionais muito qualificados. Sempre saio satisfeito.' },
              { name: 'Rafael Costa', text: 'Ambiente top e preço justo. Super recomendo!' },
            ].map((testimonial, idx) => (
              <Card key={idx} className="p-6 border-border">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                <p className="font-bold">{testimonial.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary/10">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Pronto para mudar seu visual?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Agende seu horário agora e garanta o melhor atendimento
          </p>
          <Link to="/booking">
            <Button size="lg" className="text-lg px-8 py-6">
              Fazer Agendamento
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
