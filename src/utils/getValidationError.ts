export type TypeWithKey<T> = {
  [key: string]: T;
};

export const getValidationError = (errorCode: any): string | undefined => {
  const codeMatcher: TypeWithKey<string> = {
    // 400: 'Los datos ingresados son incorrectos, revise que sean validos',
    401: 'No autorizado. Refrescando sesión...',
    403: 'Acceso denegado. No tienes permiso para realizar esta accion.',
    404: 'Recurso no encontrado.',
    500: 'Error del servidor. Intenta nuevamente mas tarde.',
    422: 'No se pudo procesar la solicitud en este momento.',
    413: 'el tamaño del archivo excede la capacidad maxima de la permitida (10MB)',
    502: 'No se pudo establecer la conexión con el servidor. Verifique su conexión a internet.'
  };
  return codeMatcher[String(errorCode)];
};

