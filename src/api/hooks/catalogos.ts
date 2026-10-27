import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { getCatalogos, getCatalogosExternos, getCatalogosExternosModelos } from "../../services/CatalogService";

export const useCatalogos = () => {
    const {jwt} = useAuth();
  return useQuery({
    queryKey: ['catalogos', jwt],
    queryFn: () => getCatalogos(jwt),
    enabled: !!jwt,

    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
};


export const useCatalogosNuevos = () => {
    const {jwt} = useAuth();
  return useQuery({
    queryKey: ['catalogos_externos', jwt],
    queryFn: () => getCatalogosExternos(jwt),
    enabled: !!jwt,

    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
};


export const useCatalogosModelos = () => {
    const {jwt} = useAuth();
  return useQuery({
    queryKey: ['modelos', jwt],
    queryFn: () => getCatalogosExternosModelos(jwt),
    enabled: !!jwt,

    staleTime: 1000 * 60 * 60 * 24, // 24 horas
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
};