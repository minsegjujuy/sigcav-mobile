import { postFormData } from '../api/http';
import { getAuthHeader } from '../auth/getAuthHeader';
import type { InfractorSolicitud, VehiculoSolicitud } from '../features/actas/types';
import type { Propietario } from '../features/actas/Propietario';
import type { PhotoValue } from '../components/media/PhotoPicker';
import { requireApiBaseUrl } from './_serviceUtils';

export type OcrDocumentType = 'cedulaFrente' | 'cedulaDorso' | 'licNacFrente';

const endpointByType: Record<OcrDocumentType, string> = {
  cedulaFrente: '/ocr/procesar-cedula-frente',
  cedulaDorso: '/ocr/procesar-cedula-dorso',
  licNacFrente: '/ocr/procesar-frente-lic-nac',
};

async function ensureJpegForOcr(type: OcrDocumentType, photo: PhotoValue): Promise<PhotoValue> {
  let ImageManipulator: typeof import('expo-image-manipulator') | null = null;
  try {
    ImageManipulator = await import('expo-image-manipulator');
  } catch {
    // Si el runtime no tiene el módulo nativo (Expo Go / dev client desactualizado),
    // evitamos crashear y mandamos la imagen original.
    return photo;
  }

  const mime = (photo.mimeType ?? '').toLowerCase();
  const looksJpeg = mime === 'image/jpeg' || mime === 'image/jpg' || /\.jpe?g(\?|$)/i.test(photo.uri);

  // Aunque sea JPEG, algunos decoders Java/Tess4J fallan con ciertos marcadores.
  // Re-encodear a JPEG baseline suele evitar "JFIF APP0 must be first marker after SOI".
  if (looksJpeg) {
    const res = await ImageManipulator.manipulateAsync(
      photo.uri,
      [],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    return {
      ...photo,
      uri: res.uri,
      mimeType: 'image/jpeg',
      fileName: photo.fileName || `${type}.jpg`,
      width: res.width,
      height: res.height,
    };
  }

  const res = await ImageManipulator.manipulateAsync(
    photo.uri,
    [],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
  );
  return {
    ...photo,
    uri: res.uri,
    mimeType: 'image/jpeg',
    fileName: `${type}.jpg`,
    width: res.width,
    height: res.height,
  };
}

function buildFilePart(type: OcrDocumentType, photo: PhotoValue) {
  const name = photo.fileName || `${type}.jpg`;
  const mimeType = photo.mimeType || 'image/jpeg';
  return { uri: photo.uri, name, type: mimeType } as any;
}

async function postOcrPhoto<T>(type: OcrDocumentType, photo: PhotoValue, token: string | null): Promise<T> {
  const baseUrl = requireApiBaseUrl();
  const { headers } = getAuthHeader(token);

  const jpeg = await ensureJpegForOcr(type, photo);
  const formData = new FormData();
  formData.append('file', buildFilePart(type, jpeg));

  return postFormData<T>(baseUrl, endpointByType[type], formData, { headers });
}

export const OcrService = {
  async procesarCedulaFrente(photo: PhotoValue, token: string | null): Promise<VehiculoSolicitud> {
    return postOcrPhoto<VehiculoSolicitud>('cedulaFrente', photo, token);
  },
  async procesarCedulaDorso(photo: PhotoValue, token: string | null): Promise<Propietario> {
    return postOcrPhoto<Propietario>('cedulaDorso', photo, token);
  },
  async procesarLicNacFrente(photo: PhotoValue, token: string | null): Promise<InfractorSolicitud> {
    return postOcrPhoto<InfractorSolicitud>('licNacFrente', photo, token);
  },
};
