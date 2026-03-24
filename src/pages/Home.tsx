import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Scissors, Clock, Award, Star, CheckCircle, Camera, MapPin, ShoppingBag, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
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
  const products = storage.getProducts().filter(p => p.active).slice(0, 5);
  const [featuresRef, featuresVisible] = useScrollAnimation();
  const [servicesRef, servicesVisible] = useScrollAnimation();
  const [productsRef, productsVisible] = useScrollAnimation();
  const [barbersRef, barbersVisible] = useScrollAnimation();
  const [testimonialsRef, testimonialsVisible] = useScrollAnimation();
  const [ctaRef, ctaVisible] = useScrollAnimation();

  const user: User | null = storage.getCurrentUser();
  const agendarLink = user ? "/new-appointment" : "/booking";
  const shopName = storage.getShopName();
  const shopMapsLink = storage.getShopMapsLink();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Barbearia moderna profissional"
            className="w-full h-full object-cover opacity-40 scale-105 animate-[pulse_10s_ease-in-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
        </div>
        <div className="container mx-auto text-center relative z-10 pt-12 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 animate-fade-in-up border border-primary/20">
            <Star className="w-4 h-4 fill-primary" />
            <span className="text-sm font-medium tracking-wide uppercase">Experiência Premium</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 animate-fade-in-up tracking-tight text-white drop-shadow-lg">
            {shopName}
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-200 font-light leading-relaxed">
            Experimente o melhor serviço de barbearia com profissionais qualificados
            e um ambiente moderno, feito para você relaxar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
            <Button asChild size="lg" className="w-full sm:w-auto text-lg px-10 py-7 rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-all duration-300 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to={agendarLink}>Agendar Agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-lg px-10 py-7 rounded-full border-primary/30 text-white hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 shadow-xl active:scale-95 hover:scale-105">
              <Link to="/services">Ver Serviços</Link>
            </Button>
            {shopMapsLink && (
              <a href={shopMapsLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-10 py-7 rounded-full border-primary/40 text-primary hover:bg-primary hover:text-black bg-primary/5 backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-95">
                  <MapPin className="w-5 h-5" />
                  Como Chegar
                </Button>
              </a>
            )}
          </div>

          <div className="mt-12 w-full max-w-5xl mx-auto animate-fade-in-up animation-delay-600 relative overflow-visible">
            <div className="mb-6 flex items-center justify-center gap-2 text-foreground/80 font-medium tracking-wide">
              <Camera className="w-4 h-4 text-primary" />
              <span className="uppercase text-xs font-bold">Nossos Trabalhos</span>
            </div>

            {/* Máscaras de Gradiente para efeito infinito */}
            <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>

            <Carousel
              opts={{
                loop: true,
                align: "start",
                dragFree: false,
                containScroll: "trimSnaps",
                duration: 60,
              }}
              plugins={[
                Autoplay({
                  delay: 3500,
                  stopOnInteraction: false,
                  stopOnMouseEnter: false,
                }),
              ]}
              className="w-full relative"
            >
              <CarouselContent className="-ml-4">
                {storage.getShopGallery().map((src, index) => (
                  <CarouselItem key={index} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/4">
                    <div className="p-1">
                      <Card className="overflow-hidden rounded-2xl border-white/5 shadow-2xl bg-black/60 hover:border-primary/50 hover:shadow-primary/20 transition-all duration-500 group cursor-grab active:cursor-grabbing">
                        <AspectRatio ratio={1} className="bg-muted relative overflow-hidden">
                          <img
                            src={src}
                            alt={`Trabalho Barbearia ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                        </AspectRatio>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="left-[-1.5rem] border-white/10 bg-black/50 hover:bg-primary hover:text-primary-foreground text-white w-10 h-10 pointer-events-auto transition-colors z-20" />
                <CarouselNext className="right-[-1.5rem] border-white/10 bg-black/50 hover:bg-primary hover:text-primary-foreground text-white w-10 h-10 pointer-events-auto transition-colors z-20" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className={cn("py-24 px-4 transition-opacity duration-700 ease-out z-20 relative", featuresVisible ? "animate-fade-in-up" : "opacity-0")}>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <Card className="p-8 text-center border-border/50 bg-card/60 backdrop-blur-md rounded-3xl shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 group-hover:rotate-6 transition-transform group-hover:bg-primary/20">
                <Scissors className="w-10 h-10 text-primary -rotate-3 group-hover:-rotate-6 transition-transform" />
              </div>
              <h3 className="text-xl font-bold mb-3">Mestres Tesouras</h3>
              <p className="text-muted-foreground leading-relaxed">
                Nossa equipe possui anos de experiência e treinamento constante nas melhores academias.
              </p>
            </Card>

            <Card className="p-8 text-center border-border/50 bg-card/60 backdrop-blur-md rounded-3xl shadow-2xl hover:-translate-y-2 transition-all duration-300 animation-delay-200 group">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-3 group-hover:-rotate-6 transition-transform group-hover:bg-primary/20">
                <Clock className="w-10 h-10 text-primary rotate-3 group-hover:rotate-6 transition-transform" />
              </div>
              <h3 className="text-xl font-bold mb-3">Seu Tempo Vale</h3>
              <p className="text-muted-foreground leading-relaxed">
                Agende online de forma rápida em menos de 1 minuto. Sem filas, sem espera indesejada.
              </p>
            </Card>

            <Card className="p-8 text-center border-border/50 bg-card/60 backdrop-blur-md rounded-3xl shadow-2xl hover:-translate-y-2 transition-all duration-300 animation-delay-400 group">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 group-hover:rotate-6 transition-transform group-hover:bg-primary/20">
                <Award className="w-10 h-10 text-primary -rotate-3 group-hover:-rotate-6 transition-transform" />
              </div>
              <h3 className="text-xl font-bold mb-3">Padrão Ouro</h3>
              <p className="text-muted-foreground leading-relaxed">
                Produtos premium, toalha quente facial e navalha impecável. Um ritual masculino completo.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Services */}
      <section ref={servicesRef} className={cn("py-24 px-4 transition-opacity duration-700 ease-out", servicesVisible ? "animate-fade-in-up" : "opacity-0")}>
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
              Nosso <span className="text-primary">Catálogo</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Escolha seu estilo. Nós garantimos o resultado perfeito com técnicas precisas e produtos de alta qualidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.slice(0, 3).map((service, index) => {
              const serviceImages = [serviceHaircut, serviceBeard, serviceStyling];
              return (
                <Card key={service.id} className="overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-all duration-300 rounded-3xl group shadow-lg">
                  <div className="relative overflow-hidden">
                    <AspectRatio ratio={4 / 3}>
                      <img
                        src={service.image || serviceImages[index % serviceImages.length]}
                        alt={service.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </AspectRatio>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                      <h3 className="text-2xl font-bold text-white drop-shadow-md">{service.name}</h3>
                      <span className="text-xl font-black text-primary bg-background/80 backdrop-blur-md px-3 py-1 rounded-lg">R$ {service.price}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-muted-foreground mb-6 line-clamp-2">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-sm text-foreground/80 font-medium bg-secondary px-4 py-2 rounded-full">
                        <Clock className="w-4 h-4 mr-2 text-primary" />
                        {service.duration} min
                      </div>
                      <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 rounded-full font-semibold">
                        <Link to={agendarLink}>Agendar ➔</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-white/20 hover:bg-white hover:text-black hover:border-white transition-all duration-300 shadow-xl active:scale-95 hover:scale-105">
              <Link to="/services">Ver Todo o Catálogo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Products Sneak Peek (New Section) */}
      {products.length > 0 && (
        <section ref={productsRef} className={cn("py-24 px-4 bg-secondary/10 transition-opacity duration-700 ease-out", productsVisible ? "animate-fade-in-up" : "opacity-0")}>
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div className="max-w-xl text-center md:text-left mx-auto md:mx-0">
                <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                  Nossos <span className="text-primary">Produtos</span>
                </h2>
                <p className="text-muted-foreground text-lg">
                  Leve o cuidado da barbearia para sua casa com nossa linha exclusiva.
                </p>
              </div>
              <Button asChild variant="ghost" className="hidden md:flex text-primary hover:bg-primary/10 rounded-full font-bold group">
                <Link to="/products" className="flex items-center gap-2">
                  Ver todos os produtos <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="relative">
              <Carousel
                opts={{
                  align: "center",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 4000,
                    stopOnInteraction: false,
                    stopOnMouseEnter: true,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent className="ml-0">
                  {products.map((product) => (
                    <CarouselItem key={product.id} className="pl-0 basis-[80%] px-2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <Link to="/products">
                        <Card className="overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-all duration-300 rounded-3xl group h-full shadow-lg">
                          <div className="relative aspect-square overflow-hidden bg-muted">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {product.stock <= 0 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Esgotado</span>
                              </div>
                            )}
                          </div>
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <h3 className="font-bold text-lg leading-tight line-clamp-1">{product.name}</h3>
                              <span className="font-black text-primary text-sm whitespace-nowrap">R$ {product.price}</span>
                            </div>
                            <p className="text-muted-foreground text-xs line-clamp-2 mb-4 h-8">{product.description}</p>
                            <Button variant="secondary" size="sm" className="w-full rounded-xl font-bold bg-secondary/50 group-hover:bg-primary group-hover:text-black transition-colors">
                              <ShoppingBag className="w-4 h-4 mr-2" /> Comprar
                            </Button>
                          </div>
                        </Card>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="hidden md:block">
                  <CarouselPrevious className="left-[-1.5rem] bg-black/50 border-white/10" />
                  <CarouselNext className="right-[-1.5rem] bg-black/50 border-white/10" />
                </div>
              </Carousel>
              
              {/* Mobile Button - Centered */}
              <div className="mt-10 md:hidden text-center px-4">
                <Button asChild variant="outline" className="w-full rounded-2xl border-primary/20 bg-primary/5 text-primary py-6 h-auto font-bold text-lg active:scale-95 transition-all">
                  <Link to="/products">Ver Todos os Produtos</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Barbers */}
      <section ref={barbersRef} className={cn("py-24 px-4 bg-secondary/30 transition-opacity duration-700 ease-out", barbersVisible ? "animate-fade-in-up" : "opacity-0")}>
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
              A <span className="text-primary">Equipe</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Conheça os mestres por trás das cadeiras. Artistas dedicados a extrair sua melhor versão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {barbers.map((barber, index) => {
              const barberImages = [serviceHaircut, serviceBeard];
              const displayImage = barber.photo || barberImages[index % barberImages.length];

              return (
                <Card key={barber.id} className="overflow-hidden border-border/30 bg-card text-center rounded-3xl group shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="pt-10 px-8">
                    <div className="relative w-40 h-40 mx-auto rounded-full p-1 bg-gradient-to-tr from-primary to-primary/20 mb-6 group-hover:rotate-6 transition-transform duration-500">
                      <div className="w-full h-full rounded-full overflow-hidden border-4 border-card">
                        <img
                          src={displayImage}
                          alt={barber.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{barber.name}</h3>
                    {barber.yearsOfExperience && (
                      <p className="text-primary font-medium text-sm mb-4">
                        {barber.yearsOfExperience} anos de experiência
                      </p>
                    )}
                    {barber.description && (
                      <p className="text-muted-foreground text-sm mb-6 px-4">
                        {barber.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 justify-center pb-8 border-b border-border/50">
                      {barber.specialties.map((specialty, idx) => (
                        <span key={idx} className="text-xs font-semibold bg-secondary text-foreground px-3 py-1.5 rounded-full">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-secondary/10 group-hover:bg-primary/5 transition-colors">
                    <Link to={agendarLink}>
                      <span className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest cursor-pointer w-full inline-block py-2">
                        Agendar Horário
                      </span>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsRef} className={cn("py-24 px-4 transition-opacity duration-700 ease-out", testimonialsVisible ? "animate-fade-in-up" : "opacity-0")}>
        <div className="container mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
              Voz dos <span className="text-primary">Clientes</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Pedro Oliveira', text: 'Melhor barbearia da região! Atendimento excelente, ambiente climatizado e resultado impecável na barba e cabelo.', role: 'Cliente Fiel' },
              { name: 'Lucas Ferreira', text: 'Profissionais muito qualificados. Sempre saio satisfeito. O sistema de agendamento online salvou minha vida corrida.', role: 'Empresário' },
              { name: 'Rafael Costa', text: 'Ambiente top, música boa e preço justo. A toalha quente no final faz toda a diferença. Super recomendo!', role: 'Estudante' },
            ].map((testimonial, idx) => (
              <Card key={idx} className="p-8 border-border/50 bg-card/60 backdrop-blur-sm rounded-3xl relative shadow-lg hover:border-primary/30 transition-colors duration-300">
                <div className="absolute -top-4 right-8 bg-primary rounded-full p-3 text-primary-foreground shadow-lg shadow-primary/20">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground/80 mb-8 italic text-lg leading-relaxed">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-lg">{testimonial.name}</p>
                  <p className="text-sm text-primary font-medium">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modern CTA */}
      <section ref={ctaRef} className={cn("py-16 px-4 transition-opacity duration-700 ease-out", ctaVisible ? "animate-fade-in-up" : "opacity-0")}>
        <div className="container mx-auto">
          <div
            className="rounded-[2.5rem] p-8 md:p-14 text-center relative overflow-hidden border border-border/50 shadow-2xl flex flex-col items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url(${serviceHaircut})` }}
          >
            {/* Dark Overlay Premium Otimizado SEM CSS Blur Filter pesado */}
            <div className="absolute inset-0 bg-black/85"></div>

            <div className="relative z-10 max-w-3xl mx-auto w-full">
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight text-white drop-shadow-md">Pronto para a sua melhor versão?</h2>
              <p className="text-lg md:text-xl text-zinc-300 mb-10 leading-relaxed font-light drop-shadow-sm">
                Agende seu horário agora, escolha seu barbeiro favorito e desfrute de um atendimento verdadeiramente luxuoso.
              </p>
              <Link to={agendarLink} className="w-full inline-block md:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-all duration-300 bg-primary text-primary-foreground font-black whitespace-normal h-auto text-center leading-tight">
                  Reservar Minha Cadeira
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
