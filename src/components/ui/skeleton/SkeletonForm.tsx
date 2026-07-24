// components/skeleton/SkeletonForm.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

type Props = {
  sections?: number;
  fieldsPerSection?: number;
  showTitle?: boolean;
  showButtons?: boolean;
};

export function SkeletonForm({
  sections = 2,
  fieldsPerSection = 4,
  showTitle = true,
  showButtons = true,
}: Props) {
  return (
    <View style={styles.container}>
      {showTitle && <SkeletonBox width="55%" height={26} borderRadius={8} />}

      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <SkeletonBox width="45%" height={20} borderRadius={8} />

          {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
            <View key={fieldIndex} style={styles.field}>
              <SkeletonBox width="35%" height={14} borderRadius={6} />
              <SkeletonBox width="100%" height={48} borderRadius={10} />
            </View>
          ))}
        </View>
      ))}

      {showButtons && (
        <View style={styles.buttons}>
          <SkeletonBox width="35%" height={44} borderRadius={10} />
          <SkeletonBox width="35%" height={44} borderRadius={10} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 16,
  },
  section: {
    gap: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF',
  },
  field: {
    gap: 6,
  },
  buttons: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});