import { Navigate, useLocation } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: ('admin' | 'barber' | 'client')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const user = storage.getCurrentUser();
    const location = useLocation();
    const { toast } = useToast();
    const toastShown = useRef(false);

    useEffect(() => {
        if (!user && !toastShown.current) {
            toast({
                title: "Acesso Restrito",
                description: "Faça login para acessar esta página.",
                variant: "destructive"
            });
            toastShown.current = true;
        } else if (user && allowedRoles && !allowedRoles.includes(user.role) && !toastShown.current) {
            toast({
                title: "Acesso Negado",
                description: "Você não tem permissão para acessar esta área.",
                variant: "destructive"
            });
            toastShown.current = true;
        }
    }, [user, allowedRoles, toast]);

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
