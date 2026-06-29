import { ActaResumenDto } from "../features/actas/reportingTypes";

// 2. Función para generar el código ZPL estandarizado
function generarZplActaLocal(datos: ActaResumenDto): string {
  // Ajustes de estandarización para papel continuo (Impresora de 203 dpi / 8 dpmm)
  // Ancho: 76mm = 608 dots | Largo: 250mm = 2000 dots
  const ANCHO_DOTS = 608;
  const LARGO_DOTS = 2000;

  return `^XA
^MNC          Lineal continuo (sin saltos por GAP)
^PW${ANCHO_DOTS}       Ancho fijo de etiqueta
^LL${LARGO_DOTS}       Largo fijo estandarizado (Evita que se corte el final)
^LS0          Sin desplazamientos físicos

FT50,80^A0N,28,28^FBPOLICIA DE LA PROVINCIA DE JUJUY^FS
^FO50,110^A0N,20,20^FBDireccion de Transito y Seguridad Vial^FS
^FO10,140^GB588,3,3^FS

FO50,170^A0N,24,24^FBACTA DE COMPROBACION^FS
^FO50,200^A0N,20,20^FBSerie: ${datos.idTipo}  Nro: ${datos.nro}^FS
^FO10,230^GB588,3,3^FS

FO20,260^GB568,150,2^FS Rectángulo para LUGAR / FECHA / HORA
^FO30,280^A0N,20,20^FBLUGAR: ${datos.ubicacionResponse.descripcion}^FS
^FO30,310^A0N,20,20^FBFECHA: ${datos.fecha}   HORA: ${datos.fecha}^FS
^FO30,340^A0N,20,20^FBDOMINIO: ${datos.vehiculo.dominio}^FS
^FO30,370^A0N,20,20^FBMARCA: ${datos.vehiculo.marca} / MOD: ${datos.vehiculo.modelo}^FS

FO20,440^GB568,120,2^FS Rectángulo DATOS DEL TITULAR REGISTRAL
^FO30,460^A0N,20,20^FBNOMBRE: ${datos.infractor.nombre}^FS
^FO30,490^A0N,20,20^FBDNI: ${datos.infractor.apellido}^FS

FO20,1700^GB568,150,2^FS Cuadro de OBSERVACIONES (Último bloque)
^FO30,1720^A0N,20,20^FBOBSERVACIONES:^FS
^FO30,1750^A0N,18,18^FB540,3,10,L^FD${datos.motivo}^FS

^XZ`;
}