import type { ActaRequest } from '../features/actas/types';
import type { ActaResumenDto } from '../features/actas/reportingTypes';

function splitApellidoNombrePorComa(value: string | null | undefined): { apellido: string; nombre: string } | null {
  const raw = (value ?? '').trim();
  const commaIndex = raw.indexOf(',');
  if (commaIndex === -1) return null;

  const apellido = raw.slice(0, commaIndex).trim();
  const nombre = raw.slice(commaIndex + 1).trim();
  if (!apellido && !nombre) return null;

  return { apellido, nombre };
}

function parseUnidadRegionalId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value ?? '');
  const match = text.match(/\d+/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNumberId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value ?? '').trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseVehiculoId(value: unknown): number | undefined {
  return parseNumberId(value);
}

export function actaResumenToActaRequest(acta: ActaResumenDto): ActaRequest {
  const infractor = { ...acta.infractor };
  const vehiculoRaw: any = acta.vehiculo as any;

  const parsedFromNombre = splitApellidoNombrePorComa(infractor.nombre);
  if (parsedFromNombre) {
    infractor.apellido = parsedFromNombre.apellido || infractor.apellido;
    infractor.nombre = parsedFromNombre.nombre || infractor.nombre;
  } else {
    const parsedFromApellido = splitApellidoNombrePorComa(infractor.apellido);
    if (parsedFromApellido) {
      infractor.apellido = parsedFromApellido.apellido || infractor.apellido;
      infractor.nombre = parsedFromApellido.nombre || infractor.nombre;
    }
  }

  const ub: any = acta.ubicacionResponse as any;
  const unidadRegional =
    parseUnidadRegionalId(ub?.urId) ??
    parseUnidadRegionalId(ub?.idUr) ??
    parseUnidadRegionalId(ub?.unidadRegionalId) ??
    parseUnidadRegionalId(ub?.unidadRegional) ??
    parseUnidadRegionalId(ub?.ur);

  const localidad =
    parseNumberId(ub?.localidad) ??
    parseNumberId(ub?.localidadId) ??
    parseNumberId(ub?.idLocalidad);

  const vehiculoId =
    parseVehiculoId(vehiculoRaw?.idVeh) ??
    parseVehiculoId(vehiculoRaw?.idVehiculo) ??
    parseVehiculoId(vehiculoRaw?.vehiculoId) ??
    parseVehiculoId(vehiculoRaw?.id);

  return {
    idActa: acta.idActa,
    idGrupo: acta.idGrupo,
    idTipo: acta.idTipo,
    idPuesto: acta.idPuesto,
    motivo: acta.motivo,
    nro: acta.nro,
    articulos: acta.articulos.map((a) => a.idArt),
    retencionLicencia: acta.retencionLicencia,
    infractor,
    vehiculo: {
      idVeh: vehiculoId,
      marca: vehiculoRaw?.marca,
      modelo: vehiculoRaw?.modelo,
      dominio: vehiculoRaw?.dominio ?? '',
      motor: vehiculoRaw?.motor,
      cuadro: vehiculoRaw?.cuadro,
      tipoRodado: vehiculoRaw?.tipoRodado,
      propietario: vehiculoRaw?.propietario ?? null,
      infractorPropietario: !!vehiculoRaw?.infractorPropietario,
    },
    adjunta: acta.adjunta,
    retencion: acta.retencion,
    graduacionAlcoholica: acta.graduacionAlcoholica,
    alcoholimetro: acta.alcoholimetroRequest,
    infractorFugado: acta.infractorFugado,
    juzgado: acta?.juzgado,
    testigos: acta?.testigos ?? [],
    seNiegaAFirmar: acta.seNiegaAFirmar,
    ubicacionRequest: {
      departamento: acta.ubicacionResponse.departamento,
      lat: acta.ubicacionResponse.lat,
      lng: acta.ubicacionResponse.lng,
      unidadRegional,
      descripcion: acta.ubicacionResponse.descripcion,
      localidad,
    },
    fecha: acta.fecha,
    observaciones: acta.observaciones
  };
}
