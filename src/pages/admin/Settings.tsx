import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/storage';
import { ArrowLeft, Save, Store, Phone, MapPin, Image as ImageIcon, Trophy, MessageSquare, QrCode, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminMenu } from '@/components/admin/AdminMenu';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const Settings = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = storage.getCurrentUser();

    const [shopName, setShopName] = useState(storage.getShopName());
    const [shopPhone, setShopPhone] = useState(storage.getShopPhone());
    const [shopAddress, setShopAddress] = useState(storage.getShopAddress());
    const [shopLogo, setShopLogo] = useState(storage.getShopLogo() || '');
    const [shopInstagram, setShopInstagram] = useState(storage.getShopInstagram());
    const [shopFacebook, setShopFacebook] = useState(storage.getShopFacebook());
    const [shopEmail, setShopEmail] = useState(storage.getShopEmail());
    const [shopOpeningHours, setShopOpeningHours] = useState(storage.getShopOpeningHours());
    const [shopMapsLink, setShopMapsLink] = useState(storage.getShopMapsLink());
    const [loyaltyTarget, setLoyaltyTarget] = useState(storage.getLoyaltyTarget().toString());
    const [whatsappApiUrl, setWhatsappApiUrl] = useState(storage.getWhatsAppApiUrl());
    const [whatsappApiToken, setWhatsappApiToken] = useState(storage.getWhatsAppApiToken());
    const [whatsappInstanceId, setWhatsappInstanceId] = useState(storage.getWhatsAppInstanceId());
    const [reminderMinutes, setReminderMinutes] = useState(storage.getReminderMinutes());
    const [shopGallery, setShopGallery] = useState(storage.getShopGallery());
    const [autoReminders, setAutoReminders] = useState(storage.getAutoReminders());
    const [pixKey, setPixKey] = useState(storage.getPixKey());
    const [mpAccessToken, setMpAccessToken] = useState(storage.getMPAccessToken());
    const [mpPublicKey, setMpPublicKey] = useState(storage.getMPPublicKey());

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const [isSaving, setIsSaving] = useState(false);
    
    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        console.log('💾 [Settings] Botão Salvar clicado');
        setIsSaving(true);
        try {
            await storage.saveSettings({
                shop_name: shopName,
                shop_phone: shopPhone,
                shop_address: shopAddress,
                shop_logo: shopLogo,
                shop_instagram: shopInstagram,
                shop_facebook: shopFacebook,
                shop_email: shopEmail,
                shop_opening_hours: shopOpeningHours,
                shop_maps_link: shopMapsLink,
                loyalty_target: parseInt(loyaltyTarget) || 10,
                whatsapp_api_url: whatsappApiUrl,
                whatsapp_api_token: whatsappApiToken,
                whatsapp_instance_id: whatsappInstanceId,
                reminder_minutes: reminderMinutes,
                shop_gallery: shopGallery,
                auto_reminders: autoReminders,
                pix_key: pixKey,
                mp_access_token: mpAccessToken,
                mp_public_key: mpPublicKey
            });

            toast({
                title: "Configurações Salvas",
                description: "As informações da barbearia foram atualizadas com sucesso.",
            });
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            toast({
                title: "Erro ao Salvar",
                description: "Ocorreu um erro ao salvar no banco de dados. O tamanho das imagens ou sua conexão podem ser o problema.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="min-h-screen bg-background pb-32">
            <AdminMenu />

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/admin/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/20 hover:text-primary transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold tracking-tight text-white">Configurações</h1>
                        <span className="text-[10px] text-zinc-500">Versão: 1.1.2 (Bulk Save Ativo)</span>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Identidade da Loja */}
                    <Card className="border-white/5 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl">
                        <CardHeader className="bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <Store className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white font-bold">Identidade da Barbearia</CardTitle>
                                    <CardDescription className="text-zinc-400">Nome e logo da sua marca.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="shopName" className="text-zinc-300 font-medium ml-1">Nome da Barbearia</Label>
                                <Input
                                    id="shopName"
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                    placeholder="Ex: Tanaka Barbearia"
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white text-lg"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label className="text-zinc-300 font-medium ml-1">Logotipo da Barbearia</Label>
                                <div className="max-w-[200px]">
                                    <ImageUpload
                                        value={shopLogo}
                                        onChange={setShopLogo}
                                        label="Alterar Logo"
                                        maxWidth={400}
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-500 italic">Recomendado: Fundo transparente (PNG/WebP).</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contato e Redes Sociais */}
                    <Card className="border-white/5 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl">
                        <CardHeader className="bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <Phone className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white font-bold">Canais de Contato</CardTitle>
                                    <CardDescription className="text-zinc-400">Onde os clientes podem falar com você.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shopPhone" className="text-zinc-300 font-medium ml-1">WhatsApp Business</Label>
                                    <div className="relative">
                                        <Input
                                            id="shopPhone"
                                            value={shopPhone}
                                            onChange={(e) => setShopPhone(e.target.value.replace(/\D/g, ''))}
                                            placeholder="5562985328737"
                                            className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white pl-4"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shopEmail" className="text-zinc-300 font-medium ml-1">E-mail de Contato</Label>
                                    <Input
                                        id="shopEmail"
                                        type="email"
                                        value={shopEmail}
                                        onChange={(e) => setShopEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shopInstagram" className="text-zinc-300 font-medium ml-1">Link do Instagram</Label>
                                    <Input
                                        id="shopInstagram"
                                        value={shopInstagram}
                                        onChange={(e) => setShopInstagram(e.target.value)}
                                        placeholder="https://instagram.com/suapagina"
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shopFacebook" className="text-zinc-300 font-medium ml-1">Link do Facebook</Label>
                                    <Input
                                        id="shopFacebook"
                                        value={shopFacebook}
                                        onChange={(e) => setShopFacebook(e.target.value)}
                                        placeholder="https://facebook.com/suapagina"
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dados de Pagamento */}
                    <Card className="border-white/5 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl">
                        <CardHeader className="bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <QrCode className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white font-bold">Dados de Pagamento</CardTitle>
                                    <CardDescription className="text-zinc-400">Chave PIX e dados bancários para recebimento.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pixKey" className="text-zinc-300 font-medium ml-1">Sua Chave PIX</Label>
                                <Input
                                    id="pixKey"
                                    value={pixKey}
                                    onChange={(e) => setPixKey(e.target.value)}
                                    placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white"
                                />
                                <p className="text-xs text-zinc-500 italic mt-1 ml-1">Esta chave será usada apenas como cópia e cola se o Mercado Pago não estiver configurado. Com o Mercado Pago ativo, os QR Codes são gerados automaticamente.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                <div className="space-y-2">
                                    <Label htmlFor="mpPublicKey" className="text-zinc-300 font-medium ml-1 text-xs">Mercado Pago: Public Key</Label>
                                    <Input
                                        id="mpPublicKey"
                                        value={mpPublicKey}
                                        onChange={(e) => setMpPublicKey(e.target.value)}
                                        placeholder="APP_USR-..."
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mpAccessToken" className="text-zinc-300 font-medium ml-1 text-xs">Mercado Pago: Access Token</Label>
                                    <Input
                                        id="mpAccessToken"
                                        type="password"
                                        value={mpAccessToken}
                                        onChange={(e) => setMpAccessToken(e.target.value)}
                                        placeholder="APP_USR-..."
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white text-sm"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-tight">
                                <span className="text-yellow-500/80 font-bold">IMPORTANTE:</span> Use suas chaves do Mercado Pago para gerar o QR Code Pix real e validar pagamentos. O Access Token deve ser mantido em sigilo.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Localização e Horário */}
                    <Card className="border-white/5 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl">
                        <CardHeader className="bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <MapPin className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white font-bold">Localização e Horário</CardTitle>
                                    <CardDescription className="text-zinc-400">Dados físicos e de disponibilidade.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="shopAddress" className="text-zinc-300 font-medium ml-1">Endereço Completo</Label>
                                <Input
                                    id="shopAddress"
                                    value={shopAddress}
                                    onChange={(e) => setShopAddress(e.target.value)}
                                    placeholder="Av. 01, Centro — Bonfinópolis, GO"
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shopOpeningHours" className="text-zinc-300 font-medium ml-1">Horário de Funcionamento</Label>
                                <Input
                                    id="shopOpeningHours"
                                    value={shopOpeningHours}
                                    onChange={(e) => setShopOpeningHours(e.target.value)}
                                    placeholder="Seg à Sex: 08h às 19h | Sáb: 08h às 17h"
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shopMapsLink" className="text-zinc-300 font-medium ml-1 text-xs">Link do Google Maps (Botão 'Como Chegar')</Label>
                                <Input
                                    id="shopMapsLink"
                                    value={shopMapsLink}
                                    onChange={(e) => setShopMapsLink(e.target.value)}
                                    placeholder="https://goo.gl/maps/..."
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Regras de Negócio */}
                    <Card className="border-white/5 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl">
                        <CardHeader className="bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <Trophy className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white font-bold">Programa de Fidelidade</CardTitle>
                                    <CardDescription className="text-zinc-400">Recompensas para clientes fiéis.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="loyaltyTarget" className="text-zinc-300 font-medium ml-1">Cortes necessários para 1 Grátis</Label>
                                <Input
                                    id="loyaltyTarget"
                                    type="number"
                                    inputMode="numeric"
                                    value={loyaltyTarget}
                                    onChange={(e) => setLoyaltyTarget(e.target.value)}
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white font-bold text-center text-2xl"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Galeria de Fotos */}
                    <Card className="border-white/5 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl">
                        <CardHeader className="bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <ImageIcon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white font-bold">Galeria "Nossos Trabalhos"</CardTitle>
                                    <CardDescription className="text-zinc-400">Fotos que aparecem no carrossel da página inicial.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {shopGallery.map((img, idx) => (
                                    <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-xl">
                                        <img src={img} alt={`Trabalho ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="rounded-full w-10 h-10"
                                                onClick={() => setShopGallery(shopGallery.filter((_, i) => i !== idx))}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <div className="aspect-square">
                                    <ImageUpload
                                        value=""
                                        onChange={(newImg) => newImg && setShopGallery([...shopGallery, newImg])}
                                        label="Adicionar Foto"
                                        className="h-full"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 italic text-center">As imagens serão comprimidas automaticamente para manter a performance do site.</p>
                        </CardContent>
                    </Card>

                    {/* Automação de Mensagens */}
                    <Card className="border-white/5 bg-black/40 backdrop-blur-md shadow-2xl overflow-hidden rounded-3xl">
                        <CardHeader className="bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-white font-bold">Automação de WhatsApp</CardTitle>
                                    <CardDescription className="text-zinc-400">Configuração técnica da API de mensagens.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-2">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-white font-bold">Lembretes Automáticos</Label>
                                    <p className="text-xs text-zinc-400">Enviar WhatsApp automaticamente antes do horário.</p>
                                </div>
                                <Switch
                                    checked={autoReminders}
                                    onCheckedChange={setAutoReminders}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="reminderMinutes" className="text-zinc-300 font-medium ml-1">Lembrete (min antes)</Label>
                                    <Input
                                        id="reminderMinutes"
                                        type="number"
                                        value={reminderMinutes}
                                        onChange={(e) => setReminderMinutes(e.target.value)}
                                        placeholder="30"
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white font-bold text-center"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsappInstanceId" className="text-zinc-300 font-medium ml-1">ID da Instância</Label>
                                    <Input
                                        id="whatsappInstanceId"
                                        value={whatsappInstanceId}
                                        onChange={(e) => setWhatsappInstanceId(e.target.value)}
                                        placeholder="Ex: 3B8C..."
                                        className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsappApiUrl" className="text-zinc-300 font-medium ml-1">URL Base da API</Label>
                                <Input
                                    id="whatsappApiUrl"
                                    value={whatsappApiUrl}
                                    onChange={(e) => setWhatsappApiUrl(e.target.value)}
                                    placeholder="https://api.z-api.io/instances/..."
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsappApiToken" className="text-zinc-300 font-medium ml-1">API Token / Secret</Label>
                                <Input
                                    id="whatsappApiToken"
                                    type="password"
                                    value={whatsappApiToken}
                                    onChange={(e) => setWhatsappApiToken(e.target.value)}
                                    placeholder="••••••••••••••••"
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/50 text-white"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="w-full h-16 rounded-[2rem] text-xl font-black shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-[1.02] transition-all duration-300 mb-10"
                    >
                        {isSaving ? (
                            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        ) : (
                            <Save className="w-6 h-6 mr-3" />
                        )}
                        {isSaving ? "SALVANDO..." : "SALVAR TUDO"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default Settings;
