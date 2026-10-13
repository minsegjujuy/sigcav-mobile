import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { getCatalogos } from "../../services/CatalogService";

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