import React, { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  size = 'md',
  iconOnly,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  size?: Size;
  iconOnly?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const iconIn = useRef(new Animated.Value(0)).current;
  const textIn = useRef(new Animated.Value(0)).current;
  const isDisabled = !!disabled || !!loading;

  const colors = useMemo(() => {
    if (variant === 'ghost') {
      return {
        bg: 'transparent',
        border: Colors.divider,
        text: Colors.primary,
        icon: Colors.primary,
      };
    }
    if (variant === 'secondary') {
      return {
        bg: Colors.lightPrimary,
        border: Colors.divider,
        text: Colors.primary,
        icon: Colors.primary,
      };
    }
    return {
      bg: Colors.primary,
      border: Colors.primary,
      text: Colors.white,
      icon: Colors.white,
    };
  }, [variant]);

  useEffect(() => {
    iconIn.setValue(0);
    textIn.setValue(0);
    Animated.sequence([
      Animated.timing(iconIn, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(textIn, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [iconIn, textIn, title]);

  const metrics = useMemo(() => {
    if (size === 'sm') {
      return {
        padX: iconOnly ? 12 : 12,
        padY: 9,
        radius: 999,
        font: 13,
        icon: 18,
        minH: 40,
      };
    }
    return {
      padX: iconOnly ? 14 : 14,
      padY: 12,
      radius: 14,
      font: 14,
      icon: 20,
      minH: 44,
    };
  }, [iconOnly, size]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => {
          Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
        }}
        onPressOut={() => {
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        }}
        style={[
          styles.button,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            paddingHorizontal: metrics.padX,
            paddingVertical: metrics.padY,
            borderRadius: metrics.radius,
            minHeight: metrics.minH,
          },
          isDisabled ? styles.disabled : null,
        ]}
      >
        <View style={styles.row}>
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : icon ? (
            <Animated.View
              style={{
                opacity: iconIn,
                transform: [
                  {
                    scale: iconIn.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
                  },
                ],
              }}
            >
              <MaterialIcons name={icon} size={metrics.icon} color={colors.icon} />
            </Animated.View>
          ) : null}
          {!iconOnly ? (
            <Animated.View style={{ opacity: textIn }}>
              <Text style={[styles.text, { color: colors.text, fontSize: metrics.font }]}>{title}</Text>
            </Animated.View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 14, fontWeight: '900' },
});
