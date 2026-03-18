import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  type GestureResponderEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  useCanvasRef,
  type SkPath,
} from '@shopify/react-native-skia';
import { Colors } from '../../theme/colors';
import { AppButton } from '../ui/AppButton';

export function SignaturePadSkia({
  label,
  disabled,
  height = 180,
  onChangeBase64,
}: {
  label: string;
  disabled?: boolean;
  height?: number;
  onChangeBase64: (base64: string) => void;
}) {
  const canvasRef = useCanvasRef();
  const [paths, setPaths] = useState<SkPath[]>([]);
  const currentPathRef = useRef<SkPath | null>(null);
  const [, forceRerender] = useState(0);

  const strokeWidth = 3;
  const strokeColor = Colors.textPrimary;

  const hasInk = paths.length > 0 || !!currentPathRef.current;

  const snapshotToBase64 = useCallback(() => {
    try {
      const image = canvasRef.current?.makeImageSnapshot();
      if (!image) return;
      const base64 = image.encodeToBase64();
      onChangeBase64(base64);
    } catch {
    }
  }, [canvasRef, onChangeBase64]);

  const clear = useCallback(() => {
    currentPathRef.current = null;
    setPaths([]);
    onChangeBase64('');
    forceRerender((v) => v + 1);
  }, [onChangeBase64]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          if (disabled) return;
          const { locationX, locationY } = evt.nativeEvent;
          const p = Skia.Path.Make();
          p.moveTo(locationX, locationY);
          currentPathRef.current = p;
          forceRerender((v) => v + 1);
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          if (disabled) return;
          const { locationX, locationY } = evt.nativeEvent;
          currentPathRef.current?.lineTo(locationX, locationY);
          forceRerender((v) => v + 1);
        },
        onPanResponderRelease: () => {
          if (disabled) return;
          if (!currentPathRef.current) return;
          const finished = currentPathRef.current;
          currentPathRef.current = null;
          setPaths((prev) => [...prev, finished]);
          forceRerender((v) => v + 1);
          snapshotToBase64();
        },
        onPanResponderTerminate: () => {
          if (disabled) return;
          if (!currentPathRef.current) return;
          const finished = currentPathRef.current;
          currentPathRef.current = null;
          setPaths((prev) => [...prev, finished]);
          forceRerender((v) => v + 1);
          snapshotToBase64();
        },
      }),
    [disabled, snapshotToBase64]
  );

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <AppButton
          title="Limpiar"
          icon="backspace"
          variant="secondary"
          size="sm"
          onPress={clear}
          disabled={disabled || !hasInk}
        />
      </View>

      <View style={[styles.pad, disabled ? styles.padDisabled : null, { height }]}>
        <View style={styles.canvas} {...panResponder.panHandlers}>
          <Canvas ref={canvasRef} style={StyleSheet.absoluteFill}>
            {paths.map((p, i) => (
              <Path
                key={i}
                path={p}
                color={strokeColor}
                style="stroke"
                strokeWidth={strokeWidth}
                strokeJoin="round"
                strokeCap="round"
              />
            ))}
            {currentPathRef.current ? (
              <Path
                path={currentPathRef.current}
                color={strokeColor}
                style="stroke"
                strokeWidth={strokeWidth}
                strokeJoin="round"
                strokeCap="round"
              />
            ) : null}
          </Canvas>
        </View>
        <Text style={styles.hint}>{disabled ? 'Firma deshabilitada.' : 'Dibujá tu firma con el dedo.'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  label: { fontSize: 13, fontWeight: '900', color: Colors.textPrimary },
  pad: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  padDisabled: {
    opacity: 0.6,
    backgroundColor: '#f2f2f2',
  },
  canvas: { flex: 1 },
  hint: { paddingHorizontal: 10, paddingVertical: 8, color: Colors.textSecondary, fontWeight: '700' },
});
