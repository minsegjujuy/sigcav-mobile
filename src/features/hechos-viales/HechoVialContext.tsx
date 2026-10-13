import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HechoVialContextType, HechoVialForm, HechoVialProviderProps } from './types';


export const emptyHechoVial: HechoVialForm = {
  id: undefined,
  fecha: '',
  zona: '',
  deLosHechos: '',
  nota: '',

  victimaFatal: '',
  danosMateriales: '',

  tipoVia: '',
  tipoViaOtro: '',

  involucrados: [],

  configuracionVia: '',
  estadoCalzada: '',
  estadoFisicoCalzada: '',
  materialCalzada: '',
  semaforo: '',
  luzArtificial: '',
  estadoAmbiental: '',

  tipoSiniestro: '',
  tipoColision: '',
  posiblesCausas: [],
  destacamento: 0,
  grupo: 0,
  hora: '',
  comisaria: '',
  sintesis: '',

  ubicacionReq: {
    lat: 0,
    lng: 0,
    localidad: undefined,
    departamento: '',
    unidadRegional: undefined,
    descripcion: ''
  },

  protagonistas: [],
  unidades: [],
  peatones: [],
};

const STORAGE_KEY = '@hecho_vial_draft';

const HechoVialContext = createContext<HechoVialContextType | undefined>(undefined);

export const HechoVialProvider = ({ children }: HechoVialProviderProps) => {
  const [hechoVial, setHechoVialState] = useState<HechoVialForm | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadStoredHechoVial = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (raw) {
          const parsed: HechoVialForm = JSON.parse(raw);
          setHechoVialState(parsed);
        }
      } catch (error) {
        console.error('Error cargando hecho vial desde AsyncStorage', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadStoredHechoVial();
  }, []);

  const persist = useCallback(async (value: HechoVialForm | null) => {
    try {
      if (value === null) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        return;
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      console.error('Error guardando hecho vial en AsyncStorage', error);
    }
  }, []);

  const setHechoVial = useCallback(
    (value: HechoVialForm | null) => {
      setHechoVialState(value);
      persist(value);
    },
    [persist]
  );

  const updateHechoVial = useCallback(
    (partial: Partial<HechoVialForm>) => {
      setHechoVialState((prev) => {
        const next: HechoVialForm = {
          ...(prev ?? emptyHechoVial),
          ...partial,
          ubicacionReq: {
            ...((prev ?? emptyHechoVial).ubicacionReq ?? {}),
            ...(partial.ubicacionReq ?? {}),
          },
          protagonistas: partial.protagonistas ?? (prev ?? emptyHechoVial).protagonistas,
          unidades: partial.unidades ?? (prev ?? emptyHechoVial).unidades,
          involucrados: partial.involucrados ?? (prev ?? emptyHechoVial).involucrados,
          posiblesCausas: partial.posiblesCausas ?? (prev ?? emptyHechoVial).posiblesCausas,
        };

        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearHechoVial = useCallback(() => {
    setHechoVialState(null);
    persist(null);
  }, [persist]);

  const value = useMemo<HechoVialContextType>(
    () => ({
      hechoVial,
      setHechoVial,
      updateHechoVial,
      clearHechoVial,
      isLoaded,
    }),
    [hechoVial, setHechoVial, updateHechoVial, clearHechoVial, isLoaded]
  );

  return <HechoVialContext.Provider value={value}>{children}</HechoVialContext.Provider>;
};

export const useHechoVial = (): HechoVialContextType => {
  const context = useContext(HechoVialContext);

  if (!context) {
    throw new Error('useHechoVial debe usarse dentro de HechoVialProvider');
  }

  return context;
};
