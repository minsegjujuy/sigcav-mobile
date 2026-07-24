export interface RegisterPublicKeyDto {
  username: string;
  /**
   * Llave publica en Base64 (formato que devuelve react-native-biometrics).
   */
  publicKey: string;
}

export interface BiometricLoginDto {
  username: string;
  /**
   * Firma digital (Base64) calculada sobre `originalMessage`.
   */
  signature: string;
  /**
   * Mensaje original que el backend debe verificar (se firma tal cual).
   */
  originalMessage: string;
}
