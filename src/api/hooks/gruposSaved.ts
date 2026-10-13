import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { getGrupos } from "../../services/GrupoService";

export const useGrupos = () => {
    const {jwt} = useAuth();
  return useQuery({
    queryKey: ['grupos', jwt],
    queryFn: () => getGrupos(jwt),
    enabled: !!jwt,

    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
};