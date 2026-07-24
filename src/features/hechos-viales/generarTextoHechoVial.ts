import { formatearFechaA_DDMMYYYY } from "../../utils/formatearFecha";
import { HechoVialListDto, Peaton, Protagonista } from "./types";

const siNo = (valor?: boolean): string =>
  valor === true ? 'SI' : valor === false ? 'NO' : 'SD';

const textoOGuion = (valor?: string | null) => {
  const texto = String(valor ?? '').trim();
  return texto.length > 0 ? texto : '-';
};

const buildPeatonText = (peaton: Peaton, index: number) => `
${index + 1}º PEATÓN
Nombre: ${peaton.nombre}
Documento: ${peaton.tipo} ${peaton.numeroDocumento}
Género: ${peaton.genero}
Nacionalidad: ${peaton.nacionalidad}
Provincia: ${peaton.provincia}
Localidad: ${peaton.localidad}
Domicilio: ${peaton.domicilio}
Descripción: ${textoOGuion(peaton.descripcion)}
Edad: ${parseInt(peaton.edad) === 0 ? 'N/A' : peaton.edad}
Dispositivo de retención: ${siNo(peaton.dispositivoRetencion)}
Descripcion: ${peaton.descripcion || '-'}
Traslado: ${peaton.trasladado}
Estado de salud: ${peaton.estadoSalud}
`;


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
TIPO COLISIÓN: ${hecho.tipoColision || '-'}
DE LOS HECHOS: ${hecho.deLosHechos || '-'}
NOTA: ${hecho.nota || '-'}

POSIBLES CAUSAS:
${hecho.posiblesCausas.join(' - ')}

${buildPersonalIntervinienteText(hecho)}

SÍNTESIS:
${hecho.sintesis}

-----------------------------------
PROTAGONISTAS
-----------------------------------
`;

  if (hecho.peatones?.length) {
    texto += `
-----------------------------------
PEATONES
-----------------------------------
${hecho.peatones.map((peaton, index) => buildPeatonText(peaton, index)).join('\n')}
`;
  }

  hecho.protagonistas.forEach((p, index) => {
    texto += `
${index + 1}º PROTAGONISTA – ${p.tipoRodado}
DOMINIO: ${p.dominio}
MARCA / MODELO: ${p.marca} ${p.modelo}
COLOR: ${p.color}
DESCRIPCIÓN: ${textoOGuion(p.descripcion)}
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
Edad: ${parseInt(p.conductorEdad) === 0 ? 'N/A' : p.conductorEdad}
Licencia: ${p.licenciaRequest ? 
`NRO ${p.licenciaRequest.numero}
 CLASE ${p.licenciaRequest.clase}
 EXP ${formatearFechaA_DDMMYYYY(p.licenciaRequest.fechaExpedicion!)}
 VTO ${formatearFechaA_DDMMYYYY(p.licenciaRequest.fechaVencimiento!)} 
 AUTORIDAD EXP ${p.licenciaRequest.autoridadExpedicion} ` 
: 'NO POSEE' }
Fecha de nacimiento: ${formatearFechaA_DDMMYYYY(p.conductorFechaNacimiento)}
Descripción: ${p.descripcion || '-'}
Traslado: ${p.trasladoConductor}
Alcohol: ${p.graduacionAlcoholica ? `${p.graduacionAlcoholica} G/L` : 'No se realizó ningún test'}
${p.actasNoCargadas?.length
  ? p.actasNoCargadas
      .map((acta) => `SE LABRÓ ACTA DE COMPROBACIÓN NRO ${acta.nroActa} POR ARTICULADO ${acta.articulado}`)
      .join('\n')
  : ''}

`;

    if (p.acompanantes?.length) {
      texto += `\nACOMPAÑANTES:\n`;
      p.acompanantes.forEach((a, i) => {
        texto += `
${i + 1}º Acompañante
Nombre: ${a.nombre}
Documento: ${a.tipo} ${a.numeroDocumento}
Descripción: ${textoOGuion(a.descripcion)}
Fecha de nacimiento : ${formatearFechaA_DDMMYYYY(a.fechaNacimiento)}
Edad: ${parseInt(a.edad) === 0 ? 'N/A' : a.edad}
Cinturón/Casco: ${siNo(a.usoCinturonCasco)}
Descripción: ${a.descripcion || '-'}
Traslado: ${a.trasladado}

`;
      });
    }

    texto += `\n-----------------------------------\n`;
  });

  texto += `

INFORMA: ${hecho.usuario}
`;

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
