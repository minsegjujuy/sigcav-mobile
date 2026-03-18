import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../theme/colors';
import { AppButton } from '../ui/AppButton';

export type PhotoValue = {
  uri: string;
  base64?: string;
  fileName?: string | null;
  mimeType?: string;
  width?: number;
  height?: number;
};

export function PhotoPicker({
  label,
  value,
  onChange,
  includeBase64 = false,
  quality = 0.8,
  allowEditing = false,
}: {
  label: string;
  value: PhotoValue | null;
  onChange: (value: PhotoValue | null) => void;
  includeBase64?: boolean;
  quality?: number;
  allowEditing?: boolean;
}) {
  const [isBusy, setIsBusy] = useState(false);

  const canRemove = !!value?.uri;

  const preview = useMemo(() => {
    if (!value?.uri) return null;
    return { uri: value.uri };
  }, [value?.uri]);

  const handleAsset = useCallback(
    (asset: ImagePicker.ImagePickerAsset | null | undefined) => {
      if (!asset?.uri) return;
      onChange({
        uri: asset.uri,
        base64: asset.base64 ?? undefined,
        fileName: asset.fileName ?? null,
        mimeType: asset.mimeType ?? undefined,
        width: asset.width,
        height: asset.height,
      });
    },
    [onChange]
  );

  const takePhoto = useCallback(async () => {
    setIsBusy(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Necesito permiso de cámara para tomar una foto.');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality,
        base64: includeBase64,
        allowsEditing: allowEditing,
      });

      if (res.canceled) return;
      handleAsset(res.assets?.[0]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo abrir la cámara.');
    } finally {
      setIsBusy(false);
    }
  }, [allowEditing, handleAsset, includeBase64, quality]);

  const pickFromLibrary = useCallback(async () => {
    setIsBusy(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Necesito permiso para acceder a tus fotos/archivos.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality,
        base64: includeBase64,
        allowsEditing: allowEditing,
      });

      if (res.canceled) return;
      handleAsset(res.assets?.[0]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo abrir la galería.');
    } finally {
      setIsBusy(false);
    }
  }, [allowEditing, handleAsset, includeBase64, quality]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.actions}>
        <AppButton title="Tomar" icon="photo-camera" size="sm" onPress={takePhoto} disabled={isBusy} />
        <AppButton
          title="Subir"
          icon="photo-library"
          variant="secondary"
          size="sm"
          onPress={pickFromLibrary}
          disabled={isBusy}
        />
        <AppButton
          title="Quitar"
          icon="delete-outline"
          variant="ghost"
          size="sm"
          onPress={() => onChange(null)}
          disabled={isBusy || !canRemove}
        />
      </View>

      {preview ? (
        <View style={styles.previewBox}>
          <Image source={preview} style={styles.previewImage} resizeMode="contain" />
        </View>
      ) : (
        <Text style={styles.helper}>Sin imagen seleccionada.</Text>
      )}

      {value?.fileName || value?.mimeType ? (
        <Text style={styles.meta}>
          {value.fileName ? `Archivo: ${value.fileName}` : ''}
          {value.fileName && value.mimeType ? ' | ' : ''}
          {value.mimeType ? `Tipo: ${value.mimeType}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 13, fontWeight: '900', color: Colors.textPrimary },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  helper: { color: Colors.textSecondary, fontWeight: '700' },
  meta: { color: Colors.textSecondary, fontWeight: '700' },
  previewBox: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    height: 180,
  },
  previewImage: { width: '100%', height: '100%' },
});
