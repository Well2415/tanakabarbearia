import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Smartphone, Download, Share, PlusSquare, MoreVertical, Chrome } from 'lucide-react';

export const PWAInstructions = ({ platform }: { platform: 'ios' | 'android' | 'other' }) => {
  return (
    <div className="py-6 space-y-8">
      {platform === 'ios' ? (
        /* iOS Instructions */
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500 font-bold border border-blue-500/20">1</div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Toque no botão de <span className="text-white font-bold inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700"><Share className="w-4 h-4" /> Compartilhar</span> na barra inferior do Safari.
            </p>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500 font-bold border border-blue-500/20">2</div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Role as opções para baixo e selecione <span className="text-white font-bold inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700"><PlusSquare className="w-4 h-4" /> Adicionar à Tela de Início</span>.
            </p>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500 font-bold border border-blue-500/20">3</div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Toque em <span className="text-primary font-bold">Adicionar</span> no canto superior direito e pronto!
            </p>
          </div>
        </div>
      ) : (
        /* Android / Chrome Instructions */
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500 font-bold border border-orange-500/20">1</div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Toque nos <span className="text-white font-bold inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700"><MoreVertical className="w-4 h-4" /> três pontinhos</span> no canto superior direito do Chrome.
            </p>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500 font-bold border border-orange-500/20">2</div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Selecione a opção <span className="text-white font-bold inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700"><Download className="w-4 h-4" /> Instalar aplicativo</span> ou adicionar à tela inicial.
            </p>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500 font-bold border border-orange-500/20">3</div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Confirme em <span className="text-primary font-bold">Instalar</span> e o app aparecerá na sua tela inicial!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const InstallPWA = () => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIos) setPlatform('ios');
    else if (isAndroid) setPlatform('android');

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!isStandalone) {
      const lastPrompt = localStorage.getItem('pwa_prompt_dismissed');
      const now = new Date().getTime();
      
      if (!lastPrompt || (now - parseInt(lastPrompt)) > 3 * 24 * 60 * 60 * 1000) {
        setShowBanner(true);
      }
    }
  }, []);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_prompt_dismissed', new Date().getTime().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md animate-fade-in-up">
      <div className="bg-card/95 backdrop-blur-xl border border-primary/20 p-5 rounded-3xl shadow-2xl flex flex-col gap-4 text-left">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <img src="/img/icon-barber-v2.png" alt="App Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white leading-tight">Instalar Aplicativo Tanaka</h4>
            <p className="text-[11px] text-muted-foreground leading-tight mt-1">
              Para uma experiência melhor e agendamentos mais rápidos.
            </p>
          </div>
          <button onClick={dismissBanner} className="text-muted-foreground hover:text-white p-1">
            <PlusSquare className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full bg-primary text-primary-foreground font-bold rounded-xl h-12 shadow-lg shadow-primary/20">
              COMO INSTALAR?
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-border rounded-3xl w-[95%] sm:max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-center pt-4">
                Instalar <span className="text-primary">App Tanaka</span>
              </DialogTitle>
              <DialogDescription className="text-center text-zinc-400">
                Siga os passos abaixo para instalar em seu celular
              </DialogDescription>
            </DialogHeader>

            <PWAInstructions platform={platform} />

            <div className="pt-4 border-t border-border/50 text-center">
              <Button onClick={dismissBanner} variant="outline" className="rounded-full px-8 text-xs font-bold text-zinc-400">
                ENTENDI, OBRIGADO
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
