import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { getApiBaseUrl, getMissingApiBaseUrlMessage } from '../config/env';
import { getAuthHeader } from '../auth/getAuthHeader';
import { postJson } from '../api/http';
import { HttpError } from '../api/http';
import { Colors } from '../theme/colors';

export interface SetupResponse {
  secret: string;
  qrUrl: string;
}

interface TwoFactorSetupScreenProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export function TwoFactorSetupScreen({ onClose }: TwoFactorSetupScreenProps) {
  const { jwt } = useAuth();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;

    const fetchQr = async () => {
      setLoading(true);
      setError('');
      setCopied(false);

      try {
        if (!jwt?.trim()) {
          throw new Error('Necesitas iniciar sesion para configurar el doble factor.');
        }

        const baseUrl = getApiBaseUrl();
        if (!baseUrl) {
          throw new Error(getMissingApiBaseUrlMessage());
        }

        const response = await postJson<Record<string, never>, SetupResponse>(
          baseUrl,
          '/auth/setup',
          {},
          getAuthHeader(jwt)
        );

        if (!alive) return;
        setQrUrl(response.qrUrl);
        setSecret(response.secret);
      } catch (err) {
        if (!alive) return;

        if (err instanceof HttpError) {
          const backendMessage = tryExtractBackendMessage(err.bodyText);
          setError(backendMessage ?? err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error inesperado al generar el codigo QR.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    void fetchQr();

    return () => {
      alive = false;
    };
  }, [jwt]);

  const handleCopySecret = async () => {
    if (!secret) return;

    await Clipboard.setStringAsync(secret);
    setCopied(true);
    Alert.alert('Copiado', 'El secreto fue copiado al portapapeles.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setError('');
    setCopied(false);
    onClose?.();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}>
              <Ionicons name="phone-portrait-outline" size={24} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Autenticacion en dos pasos</Text>
              <Text style={styles.subtitle}>Escanea el QR con una app de autenticacion.</Text>
            </View>
          </View>

          {onClose ? (
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} accessibilityLabel="Cerrar">
              <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Generando codigo QR...</Text>
          </View>
        ) : (
          <>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!error ? (
              <>
                <View style={styles.qrRow}>
                  <View style={styles.qrCard}>
                    {qrUrl ? (
                      <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.emptyQr}>
                        <Text style={styles.emptyQrText}>Sin QR</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.secretCard}>
                    <Text style={styles.secretCaption}>
                      Tambien podes ingresar este codigo manualmente en tu app de autenticacion
                    </Text>

                    <Text style={styles.secretValue}>{secret ? formatSecret(secret) : '-'}</Text>

                    <TouchableOpacity
                      style={[styles.copyButton, copied && styles.copyButtonCopied]}
                      onPress={handleCopySecret}
                      disabled={!secret}
                    >
                      <MaterialIcons
                        name={copied ? 'check' : 'content-copy'}
                        size={18}
                        color={Colors.white}
                      />
                      <Text style={styles.copyButtonText}>{copied ? 'Copiado' : 'Copiar codigo'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : null}
          </>
        )}
      </View>
    </ScrollView>
  );
}

export default TwoFactorSetupScreen;

function formatSecret(value: string): string {
  return value.replace(/(.{4})/g, '$1 ').trim();
}

function tryExtractBackendMessage(bodyText: string | null): string | null {
  const raw = (bodyText ?? '').trim();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as any;
    return typeof parsed?.message === 'string' && parsed.message.trim() ? parsed.message.trim() : null;
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  card: {
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.danger,
    fontWeight: '800',
    lineHeight: 20,
  },
  qrRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  qrCard: {
    width: 156,
    minHeight: 156,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  qrImage: {
    width: 136,
    height: 136,
  },
  emptyQr: {
    width: 136,
    height: 136,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightPrimary,
  },
  emptyQrText: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  secretCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.white,
  },
  secretCaption: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  secretValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  copyButton: {
    marginTop: 4,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  copyButtonCopied: {
    backgroundColor: Colors.darkPrimary,
  },
  copyButtonText: {
    color: Colors.white,
    fontWeight: '800',
  },
});
