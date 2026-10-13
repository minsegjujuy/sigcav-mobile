import type { AlcoholimetroRequest, InfractorSolicitud, TestigoRequest, VehiculoSolicitud } from './types';

export interface ArticuloDto {
  idArt: number;
  nro: string;
  detalle: string;
}

export interface UbicacionResponse {
  lat: number;
  lng: number;
  departamento: string;
  unidadRegional: string;
  urId?: number;
  idUr?: number;
  localidad: number;
  descripcion: string;
}

export interface ActaResumenDto {
  idActa: number;
  nro: string;
  idGrupo: number;
  idPuesto?: number;
  fecha: string;
  motivo: string;
  idTipo: number;
  retencion: string;
  infractor: InfractorSolicitud;
  vehiculo: VehiculoSolicitud;
  articulos: ArticuloDto[];
  legajo: string;
  nombre: string;
  adjunta: string;
  graduacionAlcoholica: number;
  ubicacionResponse: UbicacionResponse;
  retencionVehiculo: boolean;
  juzgado?: number,
  infractorFugado: boolean,
  seNiegaAFirmar: boolean
  retencionLicencia: boolean,
  observaciones: string;
  testigos: TestigoRequest[],
  alcoholimetroRequest: AlcoholimetroRequest,
}

export interface DiasCantidad {
  dia?: string;
  cantidad?: number;
}

export interface ArticuloCantidad {
  articulo?: string;
  cantidad?: number;
}

export interface ActaGrupo {
  grupo?: string;
  cantidad?: number;
}

export interface GrupoInforme {
  grupo?: string;
  puesto?: string;
  cantidad?: number;
}

export interface TipoInformeList {
  tipo?: string;
  cantidad?: number;
}

export interface ReporteActas {
  key?: string;
  cantidad?: number;
}
