export interface Ley {
  idLey: number;
  nro: string;
}

export interface Articulo {
  idArt: number;
  nro: string;
  detalle: string;
}

export interface Grupo {
  idGrupo: number;
  nombre: string;
}

export interface Puesto {
  idPuesto: number;
  nombre: string;
}

export interface Tipo {
  idTipo: number;
  detalle: string;
  descripcion: string;
}
