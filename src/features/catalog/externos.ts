export interface CatalogoNuevoDto {
  provincias: ProvinciaDto[];
  departamentos: DepartamentoDto[];
  localidades: LocalidadDto[];
  tiposVehiculo: TipoVehiculoDto[];
  marcas: MarcaDto[];
  tiposDocumento: TipoDocumentoDto[];
  paises: PaisDto[];
  destacamentos: DestacamentoDto[];
}

export interface ProvinciaDto {
  idProvincia: number;
  id_provincia?: number;
  nombre: string;
  idPais: number;
  id_pais?: number;
}

export interface DepartamentoDto {
  idDepartamento: number;
  id_departamento?: number;
  nombre: string;
  idProvincia: number;
  id_provincia?: number;
}

export interface LocalidadDto {
  idLocalidad: number;
  id_localidad?: number;
  nombre: string;
  idDepartamento: number;
  id_departamento?: number;
}

export interface TipoVehiculoDto {
  idTipoVehiculo: number;
  id_tipo_vehiculo?: number;
  id_tipovehiculo?: number;
  nombre: string;
}

export interface MarcaDto {
  idMarca: number;
  id_marca?: number;
  nombre: string;
  idTipoVehiculo: number;
  id_tipo_vehiculo?: number;
  id_tipovehiculo?: number;
}

export interface ModeloDto {
  idModelo: number;
  id_modelo?: number;
  nombre: string;
  idMarca: number;
  id_marca?: number;
}

export interface TipoDocumentoDto {
  idTipoDocumento: number;
  nombre: string;
}

export interface PaisDto {
  idPais?: number;
  id_pais?: number;
  nombre: string;
}

export interface DestacamentoDto {
  idDestacamento: number;
  nombre: string;
}
