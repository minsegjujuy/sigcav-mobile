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
  observaciones: string;
  graduacionAlcoholica: number;
  infractorFugado: boolean;
  retencionLicencia: boolean;
  juzgado?: number;
  ubicacionRequest: UbicacionRequest;
  //firma?: FirmaDTO;
  testigos: TestigoRequest[];
  seNiegaAFirmar: boolean,
  alcoholimetro: AlcoholimetroRequest,
  idExterno?: number,
  identificacion: string,
}

export interface UbicacionRequest {
  lat: number;
  lng: number;
  departamento: string;
  unidadRegional?: number;
  localidad?: number;
  descripcion: string;
  idProvinciaCatalogo: number;
  idDepartamentoCatalogo: number;
  idLocalidadCatalogo: number;
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
  infractorPropietario: boolean
  idTipoVehiculo?: number;
  idMarca? : number;
  idModelo? : number;
}

export interface InfractorSolicitud {
  idInfrac: number | null;
  nombre: string;
  apellido: string;
  dni: string;
  nacionalidad: string;
  domicilio: string;
  fechaNacimiento?: string;
  localidad?: string | null;
  provincia: string | null;
  licencia: LicenciaRequest | null;
  localidadId?: number | null;
  provinciaId?: number | null;
  departamentoId?: number | null;
  idLocalidad?: number | null;
  idProvincia?: number | null;
  idDepartamento?: number | null;
  idPais?: number | null;
  sexo?: string | null;
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

export interface AlcoholimetroRequest{
  idImpresora: number,
  idAlcoholimetro: number,
}

export interface AlcoholimetroDto {
  idAlcoholimetro: number;
  numeroSerieAlcoholimetro: string;
  idImpresora: number | null;
  numeroSerieImpresora: string | null;
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
