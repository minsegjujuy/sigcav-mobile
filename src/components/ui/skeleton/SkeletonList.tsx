// components/skeleton/SkeletonList.tsx
import React from 'react';
import { View } from 'react-native';
import { SkeletonCard } from './SkeletonCard';

type Props = {
  count?: number;
  variant?: 'small' | 'medium' | 'large';
};

export function SkeletonList({ count = 4, variant = 'medium' }: Props) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} variant={variant} />
      ))}
    </View>
  );
}