import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import type { SnackbarPayload } from '../../utils/snackbar/SnackbarUtilities';
import { SnackbarUtilities } from '../../utils/snackbar/SnackbarUtilities';

export function SnackbarHost() {
  const insets = useSafeAreaInsets();
  const [payload, setPayload] = useState<SnackbarPayload | null>(null);
  const visible = !!payload;

  useEffect(() => {
    return SnackbarUtilities.subscribe((p) => setPayload(p));
  }, []);

  const snackbarStyle = useMemo(() => {
    const base = { marginBottom: 8 + insets.bottom };
    if (!payload) return [styles.snackbar, base];
    if (payload.variant === 'error') return [styles.snackbar, styles.snackbarError, base];
    if (payload.variant === 'success') return [styles.snackbar, styles.snackbarSuccess, base];
    return [styles.snackbar, styles.snackbarInfo, base];
  }, [insets.bottom, payload]);

  return (
    <Snackbar
      visible={visible}
      onDismiss={() => setPayload(null)}
      duration={payload?.durationMs ?? 4500}
      style={snackbarStyle as any}
    >
      {payload?.message ?? ''}
    </Snackbar>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    backgroundColor: Colors.textPrimary,
  },
  snackbarError: {
    backgroundColor: '#b00020',
  },
  snackbarSuccess: {
    backgroundColor: '#1b5e20',
  },
  snackbarInfo: {
    backgroundColor: Colors.primary,
  },
});

