import { useQuery } from '@tanstack/react-query';
import { getPuestos } from '../../services/PuestoService';
import { useAuth } from '../../auth/AuthContext';

export const usePuestos = () => {
    const {jwt} = useAuth();
  return useQuery({
    queryKey: ['puestos', jwt],
    queryFn: () => getPuestos(jwt),
    enabled: !!jwt,

    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
};
