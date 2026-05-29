import { HechoVialListDto, Protagonista } from "./types";

const siNo = (valor?: boolean): string =>
  valor === true ? 'SI' : valor === false ? 'NO' : 'SD';


export const generarTextoHechoVial = (hecho: HechoVialListDto): string => {
  let texto = `
DESTACAMENTO: ${hecho.puesto}

INFORME DE HECHO VIAL

FECHA Y HORA: ${hecho.fecha}
RUTA / UBICACIÓN: ${hecho.ubicacionReq?.descripcion ?? ''}
COORDENADAS: ${hecho.ubicacionReq.lat} , ${hecho.ubicacionReq.lng}
UNIDAD REGIONAL: ${hecho.ubicacionReq.unidadRegional}
DEPARTAMENTO: ${hecho.ubicacionReq.departamento}
CIUDAD: ${hecho.ubicacionReq.localidad}
ZONA: ${hecho.zona}
TIPO DE VÍA: ${hecho.tipoVia} ${hecho.tipoViaOtro ?? ''}

VÍCTIMA FATAL: ${hecho.victimaFatal}
DAÑOS MATERIALES: ${hecho.danosMateriales}

INVOLUCRADOS:
${hecho.involucrados.join(' - ')}

CONFIGURACIÓN DE VÍA: ${hecho.configuracionVia}
ESTADO CALZADA: ${hecho.estadoCalzada}
MATERIAL CALZADA: ${hecho.materialCalzada}
ESTADO AMBIENTAL: ${hecho.estadoAmbiental}
LUZ ARTIFICIAL: ${hecho.luzArtificial}
SEMÁFORO: ${hecho.semaforo}

TIPO SINIESTRO: ${hecho.tipoSiniestro}
TIPO COLISIÓN: ${hecho.tipoColision}

POSIBLES CAUSAS:
${hecho.posiblesCausas.join(' - ')}

${buildPersonalIntervinienteText(hecho)}

SÍNTESIS:
${hecho.sintesis}

-----------------------------------
PROTAGONISTAS
-----------------------------------
`;

  hecho.protagonistas.forEach((p, index) => {
    texto += `
${index + 1}º PROTAGONISTA – ${p.tipoRodado}
DOMINIO: ${p.dominio}
MARCA / MODELO: ${p.marca} ${p.modelo}
COLOR: ${p.color}
ASEGURADO: ${siNo(p.asegurado)}
RTO: ${siNo(p.rto)}
CÉDULA: ${siNo(p.cedula)}
AIRBAG: ${siNo(p.airbagActivado)}
USO SEGURIDAD: ${siNo(p.usoSeguridad)}

CONDUCTOR:
Nombre: ${p.conductorNombre}
Género: ${p.conductorGenero}
DNI: ${p.conductorDni}
Nacionalidad: ${p.conductorNacionalidad}
Edad: ${p.conductorEdad}
Licencia: ${p.licenciaNro} (${p.licenciaClase}) - ${p.licenciaEstado}

Traslado: ${p.trasladoConductor}
Alcohol: ${p.graduacionAlcoholica}
${p.actaRef && p.articuladoRef 
  ? `SE LABRÓ ACTA DE COMPROBACIÓN NRO ${p.actaRef} POR ARTICULADO ${p.articuladoRef}` 
  : ''}

`;

    if (p.acompanantes?.length) {
      texto += `\nACOMPAÑANTES:\n`;
      p.acompanantes.forEach((a, i) => {
        texto += `
${i + 1}º Acompañante
Nombre: ${a.nombre}
Documento: ${a.tipo} ${a.numeroDocumento}
Edad: ${a.edad}
Cinturón/Casco: ${siNo(a.usoCinturonCasco)}
Traslado: ${a.trasladado}
`;
      });
    }

    texto += `\n-----------------------------------\n`;
  });

  return texto;
};

const buildPersonalIntervinienteText = (hecho?: HechoVialListDto) => {
  if (!hecho?.unidades?.length) return "PERSONAL INTERVINIENTE: Sin datos";

  const textoUnidades = hecho.unidades
    .map((unidad) => {
      const personalTexto = unidad.personal
        ?.map(
          (p) =>
            `   • ${p.jerarquia} ${p.nombre}${
              p.observacion ? ` (${p.observacion})` : ""
            }`
        )
        .join("\n");

      return `${unidad.unidad}\n${personalTexto ?? ""}`;
    })
    .join("\n\n");

  return `PERSONAL INTERVINIENTE:\n${textoUnidades}`;
};
//protagonistaDetalle

interface ProtagonistaProps {
  protagonista: Protagonista;
  nro: number;
}
