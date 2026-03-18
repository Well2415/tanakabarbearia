import { User, Barber } from '@/types'; // Added Barber import
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Added import
import { Star, Scissors } from 'lucide-react'; // Added Star and Scissors import

interface MiniProfileProps {
  user: User;
  setIsEditProfileOpen: (isOpen: boolean) => void;
  bestBarber: Barber | null; // Added bestBarber prop
}

export const MiniProfile = ({ user, setIsEditProfileOpen, bestBarber }: MiniProfileProps) => { // Destructured bestBarber
  return (
    <Card className="p-4 flex flex-col gap-4 border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-bold">
              {user.fullName.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold">{user.fullName}</h3>
            {user.role && <p className="text-sm text-muted-foreground capitalize">{user.role}</p>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditProfileOpen(true)}>
          Editar Perfil
        </Button>
      </div>

      {user.stylePreferences && user.stylePreferences.length > 0 && (
        <div className="mt-2 w-full">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1">
            <Scissors className="h-4 w-4" /> Preferências de Estilo:
          </p>
          <div className="flex flex-wrap gap-2">
            {user.stylePreferences.map((style, idx) => (
              <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{style}</span>
            ))}
          </div>
        </div>
      )}

      {bestBarber && ( // Conditional render for favorite barber
        <div className="mt-2 w-full">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" /> Meu Barbeiro Favorito:
          </p>
          <div className="flex items-center gap-2">
            {bestBarber.photo && <img src={bestBarber.photo} alt={bestBarber.name} className="w-8 h-8 rounded-full object-cover" />}
            <span className="text-sm font-medium">{bestBarber.name}</span>
          </div>
        </div>
      )}
    </Card>
  );
};