import type { Propietario } from './Propietario';

export interface ActaRequest {
  idActa?: number;
  idGrupo: number;
  idTipo: number;
  idUser?: number;
  idPuesto?: number;
  fecha: string;
  motivo: string;
  nro: string;
  articulos: number[];
  infractor: InfractorSolicitud;
  vehiculo: VehiculoSolicitud;
  adjunta: string;
  retencion: string;
  retencionVehiculo: boolean;
  graduacionAlcoholica: number;
  infractorFugado: boolean;
  juzgado?: number;
  ubicacionRequest: UbicacionRequest;
  //firma?: FirmaDTO;
  testigos: TestigoRequest[];
}

export interface UbicacionRequest {
  lat: number;
  lng: number;
  departamento: string;
  unidadRegional?: number;
  localidad?: number;
  descripcion: string;
}

export interface VehiculoSolicitud {
  idVeh?: number | undefined | null;
  marca?: string | undefined | null;
  modelo?: string | undefined | null;
  dominio: string;
  motor?: string | undefined | null;
  cuadro?: string | undefined | null;
  tipoRodado?: string;
  propietario?: Propietario | null;
}

export interface InfractorSolicitud {
  idInfrac: number | null;
  nombre: string;
  apellido: string;
  dni: string;
  nacionalidad: string;
  domicilio: string;
  fechaNacimiento?: string;
  localidad?: string;
  provincia: string;
  licencia: LicenciaRequest | null;
  propietario: boolean;
}

export interface LicenciaRequest{
  // licencia
  id?: number;
  clase?: string;
  numero?: string;
  autoridadExpedicion?: string;
  fechaExpedicion?: string;
  fechaVencimiento?: string;
}

export interface TestigoRequest {
  nombre: string;
  apellido: string;
  dni: string;
  domicilio?: string;
}

export interface FirmaDTO {
  /** ID del acta a la que pertenece */
  actaId: number;

  /** Coordenadas geográficas del momento de la firma */
  latitud: string;
  longitud: string;

  /** Identificador único del celular/tablet (UUID o similar) */
  deviceId: string;

  /** Indica si el infractor rechazó realizar la rúbrica */
  seNegoAFirmar: boolean;

  /**
   * Imagen de la firma del infractor en formato Base64.
   * Puede ser null si seNegoAFirmar es true.
   */
  firmaInfractorBase64: string | null;

  /**
   * Si el infractor se negó a firmar, deben cargarse exactamente 2 testigos.
   * En caso contrario, puede enviarse como lista vacía.
   */
  testigos: TestigoRequest[];

  /**
   * Imagen de la firma del oficial en formato Base64.
   * Es obligatoria para la validez legal del acta.
   */
  firmaOficialBase64: string;
}
