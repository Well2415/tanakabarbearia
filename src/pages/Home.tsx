import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Scissors, Clock, Award, Star } from 'lucide-react';
import { storage } from '@/lib/storage';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import heroImage from '@/assets/hero-barbershop.jpg';
import serviceHaircut from '@/assets/service-haircut.jpg';
import serviceBeard from '@/assets/service-beard.jpg';
import serviceStyling from '@/assets/service-styling.jpg';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { User } from '@/types';

const Home = () => {
  const services = storage.getServices();
  const barbers = storage.getBarbers();
  const [featuresRef, featuresVisible] = useScrollAnimation();
  const [servicesRef, servicesVisible] = useScrollAnimation();
  const [barbersRef, barbersVisible] = useScrollAnimation();
  const [testimonialsRef, testimonialsVisible] = useScrollAnimation();
  const [ctaRef, ctaVisible] = useScrollAnimation();

  const user: User | null = storage.getCurrentUser();
  const agendarLink = user ? "/new-appointment" : "/booking";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Barbearia moderna profissional" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background"></div>
        </div>
        <div className="container mx-auto text-center relative z-10 pt-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
            Estilo e Tradição
            <span className="block text-primary mt-2">em um só lugar</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            Experimente o melhor serviço de barbearia com profissionais qualificados
            e um ambiente moderno e acolhedor.
          </p>
          <Link to={agendarLink}>
            <Button size="lg" className="text-lg px-8 py-6 animate-fade-in-up animation-delay-400">
              Agendar Agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className={cn("py-20 px-4 bg-card transition-opacity duration-700 ease-out", featuresVisible ? "animate-fade-in-up" : "opacity-0")}>
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

            <Card className="p-6 text-center border-border animation-delay-200">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Agendamento Fácil</h3>
              <p className="text-muted-foreground">
                Agende online de forma rápida e escolha seu horário preferido
              </p>
            </Card>

            <Card className="p-6 text-center border-border animation-delay-400">
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
      <section ref={servicesRef} className={cn("py-20 px-4 transition-opacity duration-700 ease-out", servicesVisible ? "animate-fade-in-up" : "opacity-0")}>
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Nossos <span className="text-primary">Serviços</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const serviceImages = [serviceHaircut, serviceBeard, serviceStyling];
              return (
                <Card key={service.id} className="overflow-hidden border-border hover:border-primary transition-colors">
                  <AspectRatio ratio={4/3}>
                    <img 
                      src={serviceImages[index % serviceImages.length]} 
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-2">{service.name}</h3>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">R$ {service.price}</span>
                      <span className="text-sm text-muted-foreground">{service.duration} min</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Link to="/services">
              <Button variant="outline">Ver Todos os Serviços</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Barbers */}
      <section ref={barbersRef} className={cn("py-20 px-4 bg-card transition-opacity duration-700 ease-out", barbersVisible ? "animate-fade-in-up" : "opacity-0")}>
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Nossa <span className="text-primary">Equipe</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map((barber, index) => {
              const barberImages = [serviceHaircut, serviceBeard]; // Reintroduce static images
              const displayImage = barber.photo || barberImages[index % barberImages.length]; // Use barber.photo or static fallback

              return (
                <Card key={barber.id} className="overflow-hidden border-border text-center">
                  <AspectRatio ratio={1}>
                    <img 
                      src={displayImage} 
                      alt={barber.name}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{barber.name}</h3>
                    {barber.yearsOfExperience && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {barber.yearsOfExperience} anos de experiência
                      </p>
                    )}
                    {barber.description && (
                      <p className="text-muted-foreground text-sm mb-4">
                        {barber.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {barber.specialties.map((specialty, idx) => (
                        <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsRef} className={cn("py-20 px-4 transition-opacity duration-700 ease-out", testimonialsVisible ? "animate-fade-in-up" : "opacity-0")}>
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
      <section ref={ctaRef} className={cn("py-20 px-4 bg-primary/10 transition-opacity duration-700 ease-out", ctaVisible ? "animate-fade-in-up" : "opacity-0")}>
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Pronto para mudar seu visual?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Agende seu horário agora e garanta o melhor atendimento
          </p>
          <Link to={agendarLink}>
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
