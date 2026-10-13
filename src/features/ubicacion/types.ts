import { Jerarquia } from "../../services/JerarquiaService";
import { Juzgado } from "../../services/JuzgadoService";
import { ArticuloDto } from "../actas/reportingTypes";
import { AlcoholimetroDto } from "../actas/types";
import { Grupo, Puesto, Tipo } from "../catalog/types";

export interface Localidad {
  id: number;
  nombre: string;
}

export interface Departamento {
  idDep: number;
  nombre: string;
  localidades: Localidad[];
}

export interface UnidadRegional {
  idUr: number;
  nombre: string;
  departamentos: Departamento[];
}

export interface UnidadRegionalFull {
  idUr: number;
  nombre: string;
  departamentos: DepartamentoFull[];
}

export interface DepartamentoFull {
  id: number;
  nombre: string;
  localidades: Localidad[];
}

export interface Catalogos {
  grupos: Grupo[];
  puestos: Puesto[];
  juzgados: Juzgado[];
  articulos: ArticuloDto[];
  unidadesRegionales: UnidadRegionalFull[];
  tipos: Tipo[];
  jerarquias: Jerarquia[],
  alcoholimetros: AlcoholimetroDto[],
}
