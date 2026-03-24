import { MapPin, Phone, Mail, Instagram, Facebook, Clock } from 'lucide-react';
import { storage } from '@/lib/storage';

export const Footer = () => {
  const shopName = storage.getShopName();
  const shopPhone = storage.getShopPhone();
  const shopAddress = storage.getShopAddress();
  const shopInstagram = storage.getShopInstagram();
  const shopFacebook = storage.getShopFacebook();
  const shopEmail = storage.getShopEmail();
  const shopOpeningHours = storage.getShopOpeningHours();
  const shopMapsLink = storage.getShopMapsLink();

  // Format phone for display (assuming 55DDDNNNNNNNN)
  const displayPhone = shopPhone.length >= 12
    ? `(${shopPhone.substring(2, 4)}) ${shopPhone.substring(4, 9)}-${shopPhone.substring(9)}`
    : shopPhone;

  return (
    <footer className="bg-card border-t border-white/5 mt-20 relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

      <div className="container mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-4">
              {storage.getShopLogo() ? (
                <img src={storage.getShopLogo()!} alt={shopName} className="h-14 w-auto drop-shadow-lg" />
              ) : (
                <h3 className="text-2xl font-black text-primary tracking-tighter uppercase italic drop-shadow-sm">
                  {shopName}
                </h3>
              )}
            </div>
            <p className="text-zinc-400 font-light leading-relaxed max-w-xs">
              Barbearia moderna com foco na sua melhor versão. Experiência premium, ambiente climatizado e profissionais especializados.
            </p>
            <div className="flex justify-start gap-4">
              {shopInstagram && (
                <a href={shopInstagram} target="_blank" rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-white/5 hover:bg-primary/20 text-foreground hover:text-primary transition-all duration-300 border border-white/5 shadow-xl">
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {shopFacebook && (
                <a href={shopFacebook} target="_blank" rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-white/5 hover:bg-primary/20 text-foreground hover:text-primary transition-all duration-300 border border-white/5 shadow-xl">
                  <Facebook className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>

          {/* Business Info Column */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest border-l-2 border-primary pl-4 inline-block">
              Horário e Contato
            </h3>
            <ul className="space-y-4">
              <li className="flex flex-col items-start gap-2 text-zinc-300">
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-tighter">Funcionamento</span>
                </div>
                <span className="text-sm font-medium">{shopOpeningHours}</span>
              </li>
              <li className="flex flex-col items-start gap-2 text-zinc-300">
                <div className="flex items-center gap-2 text-primary">
                  <Phone className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-tighter">Agendamentos</span>
                </div>
                <a href={`https://wa.me/${shopPhone}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-white transition-colors">
                  {displayPhone}
                </a>
              </li>
              {shopEmail && (
                <li className="flex flex-col items-start gap-2 text-zinc-300">
                  <div className="flex items-center gap-2 text-primary">
                    <Mail className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-tighter">E-mail</span>
                  </div>
                  <a href={`mailto:${shopEmail}`} className="text-sm font-medium hover:text-white transition-colors">
                    {shopEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Location Column */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest border-l-2 border-primary pl-4 inline-block">
              Nossa Sede
            </h3>
            <div className="space-y-4 flex flex-col items-start">
              <div className="flex items-start justify-start gap-3 text-zinc-300">
                <MapPin className="w-6 h-6 mt-1 text-primary shrink-0" />
                {/* Pointer-events regularizados para evitar auto-link em celulares mas permitir seleção */}
                <span className="text-lg font-light leading-snug select-text pointer-events-none sm:pointer-events-auto bg-transparent">
                  {shopAddress}
                </span>
              </div>
              {shopMapsLink && (
                <a
                  href={shopMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full max-w-[240px] mt-4 py-3 px-6 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm tracking-wide text-center transition-all duration-300 flex items-center justify-center gap-2 border border-white/5 shadow-2xl"
                >
                  <MapPin className="w-4 h-4" />
                  VER NO GOOGLE MAPS
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-500 text-xs font-medium tracking-tight">
          <div className="text-left mt-4 md:mt-0 order-2 md:order-1">
            <p>&copy; {new Date().getFullYear()} {shopName}. Todos os direitos reservados.</p>
            <p className="mt-2 uppercase opacity-50 tracking-[0.3em]">Qualidade • Tradição • Estilo</p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500/70 font-light bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:border-white/10 transition-colors w-fit mx-0 order-1 md:order-2">
            <span>criado por</span>
            <a 
              href="https://www.instagram.com/welldouglas_/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 text-zinc-300 hover:text-primary transition-all group"
            >
              <Instagram className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
              <span className="font-medium group-hover:underline underline-offset-4 decoration-primary/30">Wellington Douglas</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
