import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { obtenerJuzgadosParaActas } from "../../services/JuzgadoService";

export const useJuzgados = () => {
    const {jwt} = useAuth();
  return useQuery({
    queryKey: ['juzgados', jwt],
    queryFn: () => obtenerJuzgadosParaActas(jwt),
    enabled: !!jwt,

    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
};