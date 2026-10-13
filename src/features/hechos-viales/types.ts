import { ReactNode } from "react";
import { LicenciaRequest, UbicacionRequest } from "../actas/types";

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
  peatones: Peaton[]
  nota: string,
  deLosHechos: string,
}

export interface Peaton {
  id?: number;
  nombre: string;
  genero: string;
  nacionalidad: string;
  provincia: string;
  domicilio: string;
  localidad: string;
  tipo: 'DNI' | 'LC' | 'LE' | 'CI';
  numeroDocumento: string;
  fechaNacimiento: string;
  edad: string;
  dispositivoRetencion: boolean;
  trasladado: string;
  estadoSalud: string;
  descripcion: string
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
  domicilio: string;
  localidad: string;
  tipo: 'DNI' | 'LC' | 'LE' | 'CI';
  numeroDocumento: string;
  fechaNacimiento: string;
  edad: string;
  usoCinturonCasco: boolean;
  dispositivoRetencion: boolean;
  trasladado: string;
  estadoSalud: string;
  descripcion: string
}

export interface Protagonista {
  id?:number;
  tipoRodado: string;
  dominio: string;
  marca: string;
  modelo: string;
  color: string;
  asegurado: boolean | null;
  rto: boolean | null;
  cedula: boolean | null;
  airbagActivado: boolean | null;
  usoSeguridad: boolean | null;
  // Datos del Conductor
  conductorNombre: string;
  conductorGenero: string;
  conductorDni: string;
  conductorNacionalidad: string;
  conductorEdad: string;
  conductorFechaNacimiento: string;
  //licenciaNro: string;
  municipio: string;
  //licenciaTipo: string;
  //licenciaClase: string;
  licenciaEstado: 'VIGENTE' | 'VENCIDA' | 'NO_POSEE' | 'NO POSEE' | 'SD';
  // Personal de Seguridad (Opcional)
  esFuerzaSeguridad: boolean;
  situacion: string;
  jerarquia?: string;
  legajo?: string;
  // Salud y Alcohol
  trasladoConductor: string;
  graduacionAlcoholica: number | null; // si es null no se realizÃ³ ningun test
  estadoSalud: string;
  //actaRef: string;
  //actaRetencionRef: string;
  //articuladoRef: number[];
  // Lista anidada
  acompanantes: Acompanante[];
  licenciaRequest?: LicenciaRequest | null;
  actasNoCargadas: ActaSalienteDetalleRequest[];
  domicilio: string;
  provincia: string;
  localidad: string;
  descripcion: string
  seHizoElTest: boolean;
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
  comisaria: string;
  destacamento: number;
  peatones: Peaton[];
  deLosHechos: string;
  nota: string
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

export interface ActaSalienteDetalleRequest {
    id?: number;
    nroActa: string;
    fechaActa: Date | string; // LocalDateTime en Java
    articulado: string;
    tipo: string;
    actaId?: number; // Opcional, por si vinculas a una existente
}
