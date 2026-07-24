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
  height = 250,
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
  const isDrawingRef = useRef(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [, forceRerender] = useState(0);

  const strokeWidth = 3;
  const strokeColor = Colors.textPrimary;

  // Margen interno para evitar que el dedo toque el borde real
  const SAFE_PADDING = strokeWidth * 2 + 10;

  const hasInk = paths.length > 0 || !!currentPathRef.current;

  const snapshotToBase64 = useCallback(() => {
    try {
      const image = canvasRef.current?.makeImageSnapshot();
      if (!image) return;
      const base64 = image.encodeToBase64();
      onChangeBase64(base64);
    } catch {
      // noop
    }
  }, [canvasRef, onChangeBase64]);

  const snapshotAfterPaint = useCallback(() => {
    requestAnimationFrame(() => {
      snapshotToBase64();
    });
  }, [snapshotToBase64]);

  const clear = useCallback(() => {
    currentPathRef.current = null;
    isDrawingRef.current = false;
    setPaths([]);
    onChangeBase64('');
    forceRerender((v) => v + 1);
  }, [onChangeBase64]);

  const isInsideSafeArea = useCallback(
    (x: number, y: number) => {
      if (canvasSize.width <= 0 || canvasSize.height <= 0) return false;

      return (
        x >= SAFE_PADDING &&
        y >= SAFE_PADDING &&
        x <= canvasSize.width - SAFE_PADDING &&
        y <= canvasSize.height - SAFE_PADDING
      );
    },
    [SAFE_PADDING, canvasSize.height, canvasSize.width]
  );

  const finishCurrentPath = useCallback(() => {
    if (!currentPathRef.current) return;

    const finished = currentPathRef.current;
    currentPathRef.current = null;
    isDrawingRef.current = false;

    setPaths((prev) => [...prev, finished]);
    forceRerender((v) => v + 1);
    snapshotAfterPaint();
  }, [snapshotAfterPaint]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onStartShouldSetPanResponderCapture: () => !disabled,
        onMoveShouldSetPanResponderCapture: () => !disabled,

        onPanResponderGrant: (evt: GestureResponderEvent) => {
          if (disabled) return;
          if (canvasSize.width === 0 || canvasSize.height === 0) return;

          const { locationX, locationY } = evt.nativeEvent;

          // Solo iniciar dentro del área segura
          if (!isInsideSafeArea(locationX, locationY)) {
            currentPathRef.current = null;
            isDrawingRef.current = false;
            return;
          }

          const p = Skia.Path.Make();
          p.moveTo(locationX, locationY);
          currentPathRef.current = p;
          isDrawingRef.current = true;
          forceRerender((v) => v + 1);
        },

        onPanResponderMove: (evt: GestureResponderEvent) => {
          if (disabled) return;
          if (!currentPathRef.current || !isDrawingRef.current) return;

          const { locationX, locationY } = evt.nativeEvent;

          // Si sale del área segura, cerramos el trazo
          if (!isInsideSafeArea(locationX, locationY)) {
            finishCurrentPath();
            return;
          }

          currentPathRef.current.lineTo(locationX, locationY);
          forceRerender((v) => v + 1);
        },

        onPanResponderRelease: () => {
          if (disabled) return;
          finishCurrentPath();
        },

        onPanResponderTerminate: () => {
          if (disabled) return;
          finishCurrentPath();
        },

        onPanResponderTerminationRequest: () => true,
        onShouldBlockNativeResponder: () => true,
      }),
    [disabled, canvasSize.width, canvasSize.height, isInsideSafeArea, finishCurrentPath]
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
        <View
          style={styles.canvas}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setCanvasSize({ width, height });
          }}
          {...panResponder.panHandlers}
        >
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

          <View
            pointerEvents="none"
            style={[
              styles.safeAreaGuide,
              {
                top: SAFE_PADDING,
                left: SAFE_PADDING,
                right: SAFE_PADDING,
                bottom: SAFE_PADDING,
              },
            ]}
          />
        </View>

        <Text style={styles.hint}>
          {disabled ? 'Firma deshabilitada.' : 'Dibujá tu firma con el dedo.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
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
  canvas: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.surface,
  },
  safeAreaGuide: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.divider,
    borderRadius: 10,
  },
  hint: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
});