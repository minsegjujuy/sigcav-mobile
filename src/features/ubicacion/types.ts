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

