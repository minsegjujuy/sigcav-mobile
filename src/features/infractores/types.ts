import type { Propietario } from '../actas/Propietario';

export interface Licencia {
  id?: number;
  numero: string;
  clase: string;
  autoridadExpedicion?: string;
  fechaExpedicion?: string; // YYYY-MM-DD
  fechaVencimiento: string; // YYYY-MM-DD
}

export interface Vehiculo {
  idVeh: number;
  marca?: string | null;
  modelo?: string | null;
  dominio?: string | null;
  motor?: string | null;
  cuadro?: string | null;
  propietario: Propietario | null;
}

export interface Infractor {
  idInfrac: number;
  nombre: string; // suele venir como "apellido, nombre"
  apellido?: string | null;
  dni: string;
  domicilio: string;
  nacionalidad?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  fechaNacimiento?: string | null; // YYYY-MM-DD (si viene)
  lugar?: string | null;
  propietario?: boolean;
  vehiculos: Vehiculo[];
  licencias: Licencia[];
}
