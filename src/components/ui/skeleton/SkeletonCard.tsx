// components/skeleton/SkeletonCard.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

type Props = {
  variant?: 'small' | 'medium' | 'large';
};

export function SkeletonCard({ variant = 'medium' }: Props) {
  const isLarge = variant === 'large';
  const isSmall = variant === 'small';

  return (
    <View style={styles.card}>
      <SkeletonBox height={isLarge ? 26 : 20} width="65%" />

      <SkeletonBox height={14} width="90%" />
      <SkeletonBox height={14} width="75%" />

      {!isSmall && (
        <>
          <SkeletonBox height={14} width="55%" />
          <View style={styles.row}>
            <SkeletonBox height={32} width="30%" />
            <SkeletonBox height={32} width="30%" />
          </View>
        </>
      )}

      {isLarge && (
        <>
          <SkeletonBox height={80} width="100%" />
          <SkeletonBox height={14} width="80%" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});