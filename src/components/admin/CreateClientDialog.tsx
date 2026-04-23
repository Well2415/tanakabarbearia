import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';

export const CreateClientDialog = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    phone: '',
    email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const users = storage.getUsers();
    
    // Check if username already exists
    if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
      toast({
        title: 'Erro no Cadastro',
        description: 'Este nome de usuário já existe.',
        variant: 'destructive',
      });
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      fullName: formData.fullName,
      username: formData.username,
      password: formData.password,
      phone: formData.phone,
      email: formData.email || undefined,
      role: 'client' as const,
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
      cutsCount: 0,
      stylePreferences: [],
    };

    storage.saveUsers([...users, newUser]);
    
    toast({
      title: 'Cliente Cadastrado',
      description: `${formData.fullName} foi cadastrado com sucesso!`,
    });

    setFormData({
      fullName: '',
      username: '',
      password: '',
      phone: '',
      email: '',
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-3 h-12 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all">
          <UserPlus className="w-5 h-5 text-primary" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para cadastrar um novo cliente na base.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reg-fullName">Nome Completo</Label>
            <Input
              id="reg-fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ex: João Silva"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reg-phone">Telefone</Label>
              <Input
                id="reg-phone"
                type="text"
                inputMode="numeric"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="Ex: 62988887777"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-username">Usuário (Login)</Label>
              <Input
                id="reg-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                placeholder="joaosilva"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Senha Provisória</Label>
            <Input
              id="reg-password"
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Defina uma senha"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">E-mail (Opcional)</Label>
            <Input
              id="reg-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="joao@email.com"
            />
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Cadastrar Cliente</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
