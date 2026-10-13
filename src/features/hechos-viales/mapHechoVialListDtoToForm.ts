
import { HechoVialForm, HechoVialListDto } from "./types";
import type { Catalogos } from '../ubicacion/types';

export function mapHechoVialListDtoToForm(
  dto: HechoVialListDto,
  catalogos?: Catalogos | null
): HechoVialForm {
  const safeNumber = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const normalize = (value: unknown): string => String(value ?? '').trim().toLocaleLowerCase('es-AR');

  const resolveUnidadRegionalId = (): number | undefined => {
    const raw = dto.ubicacionReq.unidadRegional;
    const numeric = safeNumber(raw);
    if (numeric !== undefined) return numeric;

    const target = normalize(raw);
    if (!target || !catalogos?.unidadesRegionales?.length) return undefined;

    const matched = catalogos.unidadesRegionales.find((ur) => normalize(ur.nombre) === target);
    return matched?.idUr;
  };

  const resolveDepartamento = (): string => {
    const rawDepartamento = String(dto.ubicacionReq.departamento ?? '').trim();
    if (rawDepartamento) return rawDepartamento;

    const unidadRegionalId = resolveUnidadRegionalId();
    if (unidadRegionalId === undefined || !catalogos?.unidadesRegionales?.length) return rawDepartamento;

    const matched = catalogos.unidadesRegionales.find((ur) => ur.idUr === unidadRegionalId);
    return matched?.departamentos[0]?.nombre ?? rawDepartamento;
  };

  const resolveLocalidadId = (): number | undefined => {
    const raw = dto.ubicacionReq.localidad;
    const numeric = safeNumber(raw);
    if (numeric !== undefined) return numeric;

    const target = normalize(raw);
    if (!target || !catalogos?.unidadesRegionales?.length) return undefined;

    for (const ur of catalogos.unidadesRegionales) {
      for (const departamento of ur.departamentos) {
        const match = departamento.localidades.find((localidad) => normalize(localidad.nombre) === target);
        if (match) return match.id;
      }
    }

    return undefined;
  };

  // Si fecha viene como ISO: 2026-01-28T20:54:00
  const fechaISO = dto.fecha ?? '';
  const [fecha, horaCompleta] = fechaISO.split('T');

  return {
    id: dto.id,

    destacamento: Number(dto.destacamento),
    grupo: dto.grupo,
    fecha: fecha ?? '',
    hora: horaCompleta ? horaCompleta.substring(0, 5) : '',

    ubicacionReq: {
      lat: dto.ubicacionReq.lat,
      lng: dto.ubicacionReq.lng,
      departamento: resolveDepartamento(),
      localidad: resolveLocalidadId(),
      unidadRegional: resolveUnidadRegionalId(),
      descripcion: String(dto.ubicacionReq.descripcion ?? ''),
    },

    victimaFatal: dto.victimaFatal as 'SI' | 'NO',
    danosMateriales: dto.danosMateriales as 'SI' | 'NO',

    zona: dto.zona,
    tipoVia: dto.tipoVia,
    tipoViaOtro: dto.tipoViaOtro,
    comisaria: dto.comisaria,

    involucrados: dto.involucrados.map((inv) => {
      // Ej: "2 AUTOMOVIL"
      const [cantidad, ...tipo] = inv.split(' ');
      return {
        tipo: tipo.join(' '),
        cantidad: Number(cantidad) || 1,
      };
    }),

    configuracionVia: dto.configuracionVia,
    estadoCalzada: dto.estadoCalzada,
    materialCalzada: dto.materialCalzada,
    estadoFisicoCalzada: dto.estadoFisicoCalzada,
    estadoAmbiental: dto.estadoAmbiental,
    luzArtificial: dto.luzArtificial,
    semaforo: dto.semaforo,

    tipoSiniestro: dto.tipoSiniestro,
    tipoColision: dto.tipoColision,

    posiblesCausas: dto.posiblesCausas,
    sintesis: dto.sintesis,
    protagonistas: dto.protagonistas.map((protagonista) => ({
      ...protagonista,
      descripcion: protagonista.descripcion,
      acompanantes: protagonista.acompanantes?.map((acompanante) => ({
        ...acompanante,
        descripcion: acompanante.descripcion ?? '',
      })) ?? [],
      actasNoCargadas: protagonista.actasNoCargadas ?? [],
    })),
    unidades: dto.unidades,
    peatones: dto.peatones?.map((peaton) => ({
      ...peaton,
      descripcion: peaton.descripcion ?? '',
    })) ?? [],
    deLosHechos: dto.deLosHechos,
    nota: dto.nota
    /*protagonistas: dto.protagonistas.map((p) => ({
      ...p,
      asegurado: Boolean(p.asegurado),
      rto: Boolean(p.rto),
      cedula: Boolean(p.cedula),
      airbagActivado: Boolean(p.airbagActivado),
      usoSeguridad: Boolean(p.usoSeguridad),
      esFuerzaSeguridad: Boolean(p.esFuerzaSeguridad),
      graduacionAlcoholica:
        p.graduacionAlcoholica !== null
          ? Number(p.graduacionAlcoholica)
          : undefined,
      acompanantes: p.acompanantes ?? [],
    })),*/
  };
}


