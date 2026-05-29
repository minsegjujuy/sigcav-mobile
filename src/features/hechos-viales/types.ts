import { ReactNode } from "react";
import { UbicacionRequest } from "../actas/types";

export interface PersonalInterviniente {
  id?:number;
  nombre: string;
  jerarquia: string;
  observacion?: string;
}

export interface UnidadInterviniente {
  id?:number;
  unidad: string;
  personal: PersonalInterviniente[];
}

export interface HechoVialForm {
  id?: number;
  destacamento: number; //obligatorio
  grupo: number;
  fecha: string; //obligatorio
  hora: string; //obligatorio
  comisaria: string;
  ubicacionReq: UbicacionRequest; //obligatorio
  victimaFatal: string;
  danosMateriales: string;
  zona: string; //obligatorio
  tipoVia: string; //obligatorio
  tipoViaOtro?: string;
  involucrados: Involucrado[]; //obligatorio
  configuracionVia: string; //obligatorio
  estadoCalzada: string; //obligatorio
  materialCalzada: string; //obligatorio
  estadoFisicoCalzada: string; //obligatorio
  estadoAmbiental: string; //obligatorio
  luzArtificial: string; //obligatorio
  semaforo: string; //obligatorio
  tipoSiniestro: string; //obligatorio
  tipoColision?: string;
  posiblesCausas: string[]; //obligatorio
  sintesis: string; //obligatorio
  protagonistas: Protagonista[]; //obligatorio
  unidades: UnidadInterviniente[];
}

export interface Involucrado {
  tipo: string;
  cantidad: number;
  especificarOtro?: string;
}

export interface Acompanante {
  id?:number;
  nombre: string;
  genero: string;
  nacionalidad: string;
  provincia: string;
  tipo: 'DNI' | 'LC' | 'LE' | 'CI';
  numeroDocumento: string;
  fechaNacimiento: string;
  edad: string;
  usoCinturonCasco: boolean;
  dispositivoRetencion: boolean;
  trasladado: string;
  estadoSalud: string;
}

export interface Protagonista {
  id?:number;
  tipoRodado: string;
  dominio: string;
  marca: string;
  modelo: string;
  color: string;
  asegurado: boolean;
  rto: boolean;
  cedula: boolean;
  airbagActivado: boolean;
  usoSeguridad: boolean;
  // Datos del Conductor
  conductorNombre: string;
  conductorGenero: string;
  conductorDni: string;
  conductorNacionalidad: string;
  conductorEdad: string;
  conductorFechaNacimiento: string;
  licenciaNro: string;
  municipio: string;
  licenciaTipo: string;
  licenciaClase: string;
  licenciaEstado: 'VIGENTE' | 'VENCIDA' | 'NO POSEE' | 'SD';
  // Personal de Seguridad (Opcional)
  esFuerzaSeguridad: boolean;
  situacion: string;
  jerarquia?: string;
  legajo?: string;
  // Salud y Alcohol
  trasladoConductor: string;
  graduacionAlcoholica: number | null; // si es null no se realizó ningun test
  estadoSalud: string;
  actaRef: string;
  actaRetencionRef: string;
  articuladoRef: number[];
  // Lista anidada
  acompanantes: Acompanante[];
}
export interface HechoVialListDto {
  id: number;
  fecha: string;
  victimaFatal: string;
  danosMateriales: 'SI' | 'NO';
  zona: string;
  tipoVia: string;
  grupo: number;
  tipoViaOtro?: string;
  involucrados: string[];
  configuracionVia: string;
  estadoCalzada: string;
  materialCalzada: string;
  estadoFisicoCalzada: string;
  estadoAmbiental: string;
  luzArtificial: string;
  semaforo: string;
  tipoSiniestro: string;
  tipoColision?: string;
  posiblesCausas: string[];
  sintesis: string;
  ubicacionReq: UbicacionDto;
  protagonistas: Protagonista[];
  puesto: string;
  unidades: UnidadInterviniente[];
  usuario: string;
}
export interface UbicacionDto {
  lat: number;
  lng: number;
  departamento: string;
  localidad: number;
  unidadRegional: number;
  descripcion: string
}

export interface HechoVialContextType {
  hechoVial: HechoVialForm | null;
  setHechoVial: (value: HechoVialForm | null) => void;
  updateHechoVial: (partial: Partial<HechoVialForm>) => void;
  clearHechoVial: () => void;
  isLoaded: boolean;
}

export interface HechoVialProviderProps {
  children: ReactNode;
}