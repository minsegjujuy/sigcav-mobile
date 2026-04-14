export type TypeWithKey<T> = {
  [key: string]: T;
};

export const getValidationError = (errorCode: any): string | undefined => {
  const codeMatcher: TypeWithKey<string> = {
    // 400: 'Los datos ingresados son incorrectos, revise que sean validos',
    401: 'No autorizado. Por favor, inicia sesion nuevamente.',
    403: 'Acceso denegado. No tienes permiso para realizar esta accion.',
    404: 'Recurso no encontrado. Por favor, verifica la URL o intenta mas tarde.',
    500: 'Error del servidor. Intenta nuevamente mas tarde.',
    422: 'No se pudo procesar la solicitud en este momento.',
    413: 'el tamaño del archivo excede la capacidad maxima de la permitida (10MB)'
  };
  return codeMatcher[String(errorCode)];
};

