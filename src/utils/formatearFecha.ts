/**
 * Convierte una fecha de formato YYYY-MM-DD a DD-MM-YYYY
 * @param fechaString Ejemplo: "2026-06-24"
 * @returns Ejemplo: "24-06-2026"
 */
export const formatearFechaA_DDMMYYYY = (fechaString: string): string => {
  // Si viene vacío o null, manejamos el error para que no rompa la app
  if (!fechaString) return '';

  const partes = fechaString.split('-'); // Separa por el guión ['2026', '06', '24']
  
  if (partes.length !== 3) return fechaString; // Por las dudas, si no tiene el formato esperado, devuelve el original

  const [anio, mes, dia] = partes;
  
  return `${dia}-${mes}-${anio}`;
};

/**
 * Calcula la edad exacta en años a partir de una fecha de nacimiento (YYYY-MM-DD)
 * @param fechaNacimiento Ejemplo: "1999-06-24"
 * @returns Número de años (ejemplo: 27) o 0 si la fecha no es válida
 */
export const calcularEdad = (fechaNacimiento: string): number => {
  if (!fechaNacimiento) return 0;

  // 1. Convertimos la fecha de nacimiento a objeto Date (evitando desfasaje horario)
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
  const hoy = new Date();

  // Validación por si el string no era una fecha válida
  if (isNaN(nacimiento.getTime())) return 0;

  // 2. Cálculo inicial restando los años
  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  // 3. Ajuste por si no cumplió años todavía en el año actual
  const mesActual = hoy.getMonth();
  const diaActual = hoy.getDate();
  const mesNacimiento = nacimiento.getMonth();
  const diaNacimiento = nacimiento.getDate();

  // Si el mes actual es menor al de nacimiento, o si es el mismo mes pero hoy es un día anterior:
  if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
    edad--;
  }

  return edad;
};

/**
 * Valida si una fecha con hora (ISO) no superó un límite de días transcurridos respecto al momento actual.
 * @param fechaIsoString Ejemplo: "2026-06-26T10:43:00"
 * @param diasPermitidos Período máximo en días (ej: 1 día = 24 horas de tolerancia)
 * @returns true si está dentro del tiempo permitido, false si ya expiró
 */
export const validarPeriodoDiasISO = (fechaIsoString: string, diasPermitidos: number): boolean => {
  if (!fechaIsoString) return false;

  // 1. Parseamos la fecha directamente (JavaScript entiende el formato ISO de forma nativa)
  const fechaEvaluar = new Date(fechaIsoString);
  const ahora = new Date(); // Momento exacto actual

  // Validación por si el string viene roto o mal formateado
  if (isNaN(fechaEvaluar.getTime())) return false;

  // 2. Si es una fecha del futuro (por error del dispositivo), decidimos si es válida o no
  if (fechaEvaluar > ahora) return false; 

  // 3. Calculamos la diferencia exacta en milisegundos
  const diferenciaMilisegundos = ahora.getTime() - fechaEvaluar.getTime();

  // 4. Convertimos el parámetro de días a milisegundos totales de tolerancia
  // 1 día = 24 horas * 60 minutos * 60 segundos * 1000 ms = 86.400.000 ms
  const milisegundosMaximosTolerados = diasPermitidos * 24 * 60 * 60 * 1000;

  // 5. Retorna true si la diferencia real es menor o igual a la permitida
  return diferenciaMilisegundos <= milisegundosMaximosTolerados;
};