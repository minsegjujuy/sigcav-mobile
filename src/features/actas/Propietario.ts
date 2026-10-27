export interface Propietario {
  idProp?: number;
  nombre: string;
  apellido?: string;
  dni: string;
  direccion: string;
  localidad: string;
  provincia: string;
  nacionalidadId: number;
  fechaNacimiento?: string | null;
  sexo?:string
}
