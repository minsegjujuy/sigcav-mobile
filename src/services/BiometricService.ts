import type { BiometricLoginDto } from '../features/biometrics/types';

let rnBiometricsInstance: unknown | null = null;

async function getRnBiometrics() {
  if (rnBiometricsInstance) return rnBiometricsInstance as any;
  try {
    const mod = await import('react-native-biometrics');
    rnBiometricsInstance = new mod.default({ allowDeviceCredentials: true });
    return rnBiometricsInstance as any;
  } catch {
    throw new Error('Falta instalar react-native-biometrics para usar autenticacion biometrica');
  }
}

export class BiometricsUnavailableError extends Error {
  constructor(message = 'Biometria no disponible en este dispositivo') {
    super(message);
    this.name = 'BiometricsUnavailableError';
  }
}

export class BiometricsCancelledError extends Error {
  constructor(message = 'El usuario cancelo la autenticacion biometrica') {
    super(message);
    this.name = 'BiometricsCancelledError';
  }
}

function isCancelError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /cancel/i.test(msg) || /UserCancel/i.test(msg);
}

/**
 * Flujo:
 * 1) El dispositivo genera un par de llaves asimetricas (RSA) y registra la llave publica en el backend.
 * 2) Para loguear, se firma un mensaje unico (timestamp) con la llave privada protegida por biometria.
 * 3) El backend verifica la firma con la llave publica previamente registrada y emite el JWT.
 */
export async function setupBiometrics(): Promise<string> {
  const rnBiometrics = await getRnBiometrics();
  const sensor = await rnBiometrics.isSensorAvailable();
  if (!sensor.available) {
    throw new BiometricsUnavailableError(
      'No hay sensor biometrico disponible (huella/rostro) o no esta configurado'
    );
  }

  try {
    // `createKeys` genera un par RSA (2048) y devuelve la publicKey en Base64.
    // Con llaves RSA, la libreria firma con el estandar SHA256withRSA.
    const { publicKey } = await rnBiometrics.createKeys({
      keyPairType: 'RSA',
      promptMessage: 'Habilitar biometria para proteger tu cuenta',
    });

    return publicKey;
  } catch (e) {
    if (isCancelError(e)) {
      throw new BiometricsCancelledError();
    }
    throw e;
  }
}

export async function generateSignature(username: string): Promise<BiometricLoginDto> {
  const rnBiometrics = await getRnBiometrics();
  const sensor = await rnBiometrics.isSensorAvailable();
  if (!sensor.available) {
    throw new BiometricsUnavailableError(
      'No hay sensor biometrico disponible (huella/rostro) o no esta configurado'
    );
  }

  const originalMessage = Date.now().toString();

  try {
    const res = await rnBiometrics.createSignature({
      promptMessage: 'Confirmar identidad para iniciar sesion',
      cancelButtonText: 'Cancelar',
      payload: originalMessage,
    });

    // react-native-biometrics devuelve success=false cuando el usuario cancela el prompt.
    if (!res?.success) {
      throw new BiometricsCancelledError();
    }

    const signature: unknown = res?.signature;
    if (typeof signature !== 'string' || signature.length === 0) {
      throw new Error('No se pudo generar la firma biometrica');
    }

    return {
      username,
      signature,
      originalMessage,
    };
  } catch (e) {
    if (isCancelError(e)) {
      throw new BiometricsCancelledError();
    }
    throw e;
  }
}

export async function deleteKeys(): Promise<boolean> {
  const rnBiometrics = await getRnBiometrics();
  const res = await rnBiometrics.deleteKeys();
  return res.keysDeleted;
}
