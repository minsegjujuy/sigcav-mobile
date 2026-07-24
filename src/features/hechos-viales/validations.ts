import { z } from "zod";

const optionalText = (maxLength: number, message: string) =>
  z.string().trim().max(maxLength, message).optional().nullable().or(z.literal(""));

const requiredText = (maxLength: number, requiredMessage: string, maxMessage: string) =>
  z.string().trim().min(1, requiredMessage).max(maxLength, maxMessage);

const optionalNumericText = (message: string) =>
  z.string().trim().regex(/^\d{1,3}$/, message).optional().nullable().or(z.literal(""));

const optionalRegexText = (regex: RegExp, message: string) =>
  z.string().trim().optional().nullable().or(z.literal("")).superRefine((value, ctx) => {
    if (String(value ?? "").trim() && !regex.test(String(value))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  });

export const ubicacionReqSchema = z.object({
  lat: z.coerce.number().refine((value) => value >= -90 && value <= 90, {
    message: "La latitud debe estar entre -90 y 90",
  }),
  lng: z.coerce.number().refine((value) => value >= -180 && value <= 180, {
    message: "La longitud debe estar entre -180 y 180",
  }),
  departamento: z.string().trim().min(1, "El departamento es obligatorio").max(50, "El departamento no puede superar los 50 caracteres"),
  unidadRegional: z.coerce.number().refine((value) => Number.isFinite(value) && value > 0, {
    message: "La unidad regional es obligatoria",
  }),
  localidad: z.coerce.number().refine((value) => Number.isFinite(value) && value > 0, {
    message: "La localidad es obligatoria",
  }),
  descripcion: requiredText(100, "La descripción es obligatoria", "La descripción no puede superar los 100 caracteres"),
  unidadRegionalNombre: z.string().optional().nullable().or(z.literal("")),
  localidadNombre: z.string().optional().nullable().or(z.literal("")),
}).passthrough();

export const involucradoSchema = z
  .object({
    tipo: z.string().trim().min(1, "El tipo es obligatorio").max(20, "El tipo no puede superar los 20 caracteres"),
    cantidad: z.coerce.number().int().refine((value) => value > 0, {
      message: "La cantidad es obligatoria",
    }),
    especificarOtro: optionalText(20, "El tipo no puede superar los 20 caracteres"),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "OTRO" && !data.especificarOtro) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["especificarOtro"],
        message: "Debe especificar el tipo cuando selecciona OTRO",
      });
    }
  })
  .passthrough();

export const personalIntervinienteSchema = z.object({
  id: z.coerce.number().optional().nullable(),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(30, "El nombre no puede superar los 30 caracteres"),
  jerarquia: z.string().trim().min(1, "La jerarquía es obligatoria").max(30, "La jerarquía no puede superar los 30 caracteres"),
  observacion: optionalText(255, "La observación no puede superar los 255 caracteres"),
}).passthrough();

export const licenciaRequestSchema = z.object({
  id: z.coerce.number().optional().nullable(),
  numero: z.string().trim().max(30, "El número de licencia no puede superar los 30 caracteres").optional().nullable().or(z.literal("")),
  clase: z.string().trim().max(50, "La clase de licencia no puede superar los 50 caracteres").optional().nullable().or(z.literal("")),
  autoridadExpedicion: z.string().trim().max(50, "La autoridad de expedición no puede superar los 50 caracteres").optional().nullable().or(z.literal("")),
  fechaExpedicion: z.string().optional().nullable().or(z.literal("")),
  fechaVencimiento: z.string().optional().nullable().or(z.literal("")),
})
.superRefine((data, ctx) => {
  const values = [data.numero, data.clase, data.autoridadExpedicion, data.fechaExpedicion, data.fechaVencimiento];
  const hasAny = values.some((value) => String(value ?? "").trim().length > 0);
  if (!hasAny) return;

  if (!String(data.numero ?? "").trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["numero"], message: "El número de licencia es obligatorio" });
  }
  if (!String(data.clase ?? "").trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["clase"], message: "La clase de licencia es obligatoria" });
  }
  if (!String(data.autoridadExpedicion ?? "").trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["autoridadExpedicion"], message: "La autoridad de expedición es obligatoria" });
  }
  if (!String(data.fechaExpedicion ?? "").trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fechaExpedicion"], message: "La fecha de expedición es obligatoria" });
  }
  if (!String(data.fechaVencimiento ?? "").trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fechaVencimiento"], message: "La fecha de vencimiento es obligatoria" });
  }
})
.passthrough();

export const actaSalienteDetalleSchema = z.object({
  id: z.coerce.number().optional().nullable(),
  nroActa: z.string().trim().min(1, "El número de acta es obligatorio").max(30, "El número de acta no puede superar los 30 caracteres"),
  fechaActa: z.string().optional().nullable().or(z.literal("")),
  articulado: z.string().trim().min(1, "El articulado es obligatorio").max(255, "El articulado no puede superar los 255 caracteres"),
  tipo: z.string().optional().nullable().or(z.literal("")),
  actaId: z.coerce.number().optional().nullable(),
})
.passthrough();

export const unidadIntervinienteSchema = z.object({
  id: z.coerce.number().optional().nullable(),
  unidad: z.string().trim().min(1, "La unidad es obligatoria").max(50, "La unidad no puede superar los 50 caracteres"),
  personal: z.array(personalIntervinienteSchema).default([]),
}).passthrough();

export const peatonSchema = z.object({
  id: z.coerce.number().optional().nullable(),
  nombre: optionalText(30, "El nombre del peatón no puede superar los 30 caracteres"),
  genero: z
    .string()
    .trim()
    .min(1, "El género es obligatorio")
    .regex(/^[A-Za-z]$/, "El género debe contener una única letra"),
  nacionalidad: optionalText(30, "La nacionalidad no puede superar los 30 caracteres"),
  provincia: z.string().trim().max(30, "La provincia no puede superar los 30 caracteres").optional().nullable().or(z.literal("")),
  domicilio: optionalText(30, "El domicilio no puede superar los 30 caracteres"),
  localidad: optionalText(30, "La localidad no puede superar los 30 caracteres"),
  tipo: z.enum(["DNI", "LC", "LE", "CI"]),
  numeroDocumento: optionalRegexText(/^\d{1,8}$/, "El número de documento debe contener hasta 8 dígitos"),
  fechaNacimiento: z.string().optional().nullable().or(z.literal("")),
  edad: optionalNumericText("La edad debe ser numérica"),
  dispositivoRetencion: z.boolean(),
  trasladado: z.string().trim().max(255, "El traslado no puede superar los 255 caracteres").optional().nullable().or(z.literal("")),
  estadoSalud: z.string().trim().min(1, "El estado de salud es obligatorio").max(20, "El estado de salud no puede superar los 20 caracteres"),
}).passthrough();

export const acompananteSchema = z.object({
  id: z.coerce.number().optional().nullable(),
  nombre: optionalText(30, "El nombre del acompañante no puede superar los 30 caracteres"),
  genero: z
    .string()
    .trim()
    .min(1, "El género es obligatorio")
    .regex(/^[A-Za-z]$/, "El género debe contener una única letra"),
  nacionalidad: optionalText(30, "La nacionalidad no puede superar los 30 caracteres"),
  provincia: z.string().trim().max(30, "La provincia no puede superar los 30 caracteres").optional().nullable().or(z.literal("")),
  localidad: optionalText(30, "La localidad no puede superar los 30 caracteres"),
  domicilio: optionalText(30, "El domicilio no puede superar los 30 caracteres"),
  tipo: z.enum(["DNI", "LC", "LE", "CI"]),
  numeroDocumento: optionalRegexText(/^\d{1,8}$/, "El DNI debe contener hasta 8 dígitos"),
  fechaNacimiento: z.string().optional().nullable().or(z.literal("")),
  edad: optionalNumericText("La edad debe ser numérica"),
  usoCinturonCasco: z.boolean(),
  dispositivoRetencion: z.boolean(),
  trasladado: z.string().trim().max(255, "El traslado no puede superar los 255 caracteres").optional().nullable().or(z.literal("")),
  estadoSalud: z.string().trim().min(1, "El estado de salud es obligatorio").max(20, "El estado de salud no puede superar los 20 caracteres"),
}).passthrough();

export const protagonistaSchema = z.object({
  id: z.coerce.number().optional().nullable(),
  tipoRodado: z.string().trim().min(1, "El tipo de rodado es obligatorio").max(30, "El tipo de rodado no puede superar los 30 caracteres"),
  dominio: z.string().trim().max(15, "El dominio no puede superar los 15 caracteres").optional().nullable().or(z.literal("")),
  marca: z.string().trim().max(15, "La marca no puede superar los 15 caracteres").optional().nullable().or(z.literal("")),
  modelo: z.string().trim().max(35, "El modelo no puede superar los 35 caracteres").optional().nullable().or(z.literal("")),
  color: z.string().trim().min(1, "El color es obligatorio").max(15, "El color no puede superar los 15 caracteres"),
  asegurado: z.boolean(),
  rto: z.boolean(),
  cedula: z.boolean(),
  airbagActivado: z.boolean(),
  usoSeguridad: z.boolean(),
  conductorNombre: optionalText(30, "El nombre del conductor no puede superar los 30 caracteres"),
  conductorGenero: z
    .string()
    .trim()
    .min(1, "El género es obligatorio")
    .regex(/^[A-Za-z]$/, "El género debe contener una única letra"),
  conductorDni: optionalRegexText(/^\d{1,8}$/, "El DNI debe contener hasta 8 dígitos"),
  conductorNacionalidad: optionalText(30, "La nacionalidad del conductor no puede superar los 30 caracteres"),
  conductorEdad: optionalNumericText("La edad debe ser numérica"),
  conductorFechaNacimiento: z.string().optional().nullable().or(z.literal("")),
  municipio: optionalText(30, "El municipio del conductor no puede superar los 30 caracteres"),
  domicilio: optionalText(30, "El domicilio del conductor no puede superar los 30 caracteres"),
  localidad: optionalText(30, "La localidad del conductor no puede superar los 30 caracteres"),
  provincia: optionalText(30, "La provincia del conductor no puede superar los 30 caracteres"),
  licenciaEstado: z.string().trim().max(15, "Estado licencia del conductor no puede superar los 15 caracteres").optional().nullable().or(z.literal("")),
  esFuerzaSeguridad: z.boolean(),
  situacion: z.string().trim().max(30, "La situación no puede superar los 30 caracteres").optional().nullable().or(z.literal("")),
  jerarquia: z.string().trim().max(30, "La jerarquía no puede superar los 30 caracteres").optional().nullable().or(z.literal("")),
  legajo: z.string().trim().max(10, "El legajo no puede superar los 10 caracteres").optional().nullable().or(z.literal("")),
  trasladoConductor: z.string().optional().nullable().or(z.literal("")),
  graduacionAlcoholica: z.number().nullable(),
  estadoSalud: z.string().trim().min(1, "El estado de salud es obligatorio").max(20, "El estado de salud no puede superar los 20 caracteres"),
  licenciaRequest: licenciaRequestSchema.optional().nullable(),
  acompanantes: z.array(acompananteSchema).default([]),
  actasNoCargadas: z.array(actaSalienteDetalleSchema).default([]),
}).passthrough();

export const hechoVialFormSchema = z.object({
  id: z.coerce.number().optional().nullable(),
  destacamento: z.coerce.number().refine((value) => Number.isFinite(value) && value > 0, {
    message: "El destacamento es obligatorio",
  }),
  grupo: z.coerce.number().refine((value) => Number.isFinite(value) && value > 0, {
    message: "El grupo es obligatorio",
  }),
  fecha: z.string().trim().min(1, "La fecha es obligatoria"),
  hora: z.string().trim().min(1, "La hora es obligatoria"),
  comisaria: z.string().trim().min(1, "La comisaría es obligatoria").max(35, "La comisaría no puede superar los 35 caracteres"),
  ubicacionReq: ubicacionReqSchema,
  victimaFatal: z.string().refine((value) => value === "SI" || value === "NO", {
    message: "Víctima fatal solo puede ser SI o NO",
  }),
  danosMateriales: z.string().refine((value) => value === "SI" || value === "NO", {
    message: "Daños materiales solo puede ser SI o NO",
  }),
  zona: z.string().trim().min(1, "La zona es obligatoria").max(10, "La zona no puede superar los 10 caracteres"),
  tipoVia: z.string().trim().min(1, "El tipo de vía es obligatorio").max(30, "El tipo de vía no puede superar los 30 caracteres"),
  tipoViaOtro: optionalText(30, "El tipo de vía no puede superar los 30 caracteres"),
  involucrados: z.array(involucradoSchema).min(1, "Debe cargar al menos un involucrado"),
  configuracionVia: z.string().trim().min(1, "La configuración de vía es obligatoria").max(40, "La configuración de vía no puede superar los 40 caracteres"),
  estadoCalzada: z.string().trim().min(1, "El estado de la calzada es obligatorio").max(30, "El estado de la calzada no puede superar los 30 caracteres"),
  materialCalzada: z.string().trim().min(1, "El material de la calzada es obligatorio").max(20, "El material de la calzada no puede superar los 20 caracteres"),
  estadoFisicoCalzada: z.string().trim().min(1, "El estado físico de la calzada es obligatorio").max(30, "El estado físico no puede superar los 30 caracteres"),
  estadoAmbiental: z.string().trim().min(1, "El estado ambiental es obligatorio").max(30, "El estado ambiental no puede superar los 30 caracteres"),
  luzArtificial: z.string().trim().min(1, "Debe indicar si hay luz artificial").max(20, "La luz artificial no puede superar los 20 caracteres"),
  semaforo: z.string().trim().min(1, "Debe indicar si hay semáforo").max(20, "El semáforo no puede superar los 20 caracteres"),
  tipoSiniestro: z.string().trim().min(1, "El tipo de siniestro es obligatorio").max(50, "El tipo de siniestro no puede superar los 50 caracteres"),
  tipoColision: optionalText(50, "El tipo de colisión no puede superar los 50 caracteres"),
  posiblesCausas: z.array(z.string()).min(1, "Debe cargar al menos una posible causa"),
  sintesis: z.string().trim().min(10, "La síntesis es obligatoria"),
  protagonistas: z.array(protagonistaSchema).min(1, "Debe cargar al menos un protagonista"),
  unidades: z.array(unidadIntervinienteSchema).min(1, "Debe cargar al menos una unidad interviniente").default([]),
  peatones: z.array(peatonSchema).default([]),
}).passthrough();

export type HechoVialFormValidated = z.infer<typeof hechoVialFormSchema>;