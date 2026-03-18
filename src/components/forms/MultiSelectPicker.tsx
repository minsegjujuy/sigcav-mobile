import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { AppButton } from '../ui/AppButton';

export type MultiSelectOption<T extends string | number> = {
  value: T;
  label: string;
};

export function MultiSelectPicker<T extends string | number>({
  label,
  placeholder,
  values,
  options,
  onChangeValues,
}: {
  label: string;
  placeholder: string;
  values: T[];
  options: Array<MultiSelectOption<T>>;
  onChangeValues: (values: T[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const summary = useMemo(() => {
    if (values.length === 0) return null;
    const selectedSet = new Set(values);
    const selectedLabels = options.filter((o) => selectedSet.has(o.value)).map((o) => o.label);
    if (selectedLabels.length === 0) return null;
    if (selectedLabels.length === 1) return selectedLabels[0] ?? null;
    return `${selectedLabels.length} seleccionados`;
  }, [options, values]);

  return (
    <>
      <View style={{ gap: 6 }}>
        <Text style={styles.label}>{label}</Text>
        <Pressable onPress={() => setIsOpen(true)} style={styles.selectBox}>
          <Text style={summary ? styles.selectText : styles.selectPlaceholder} numberOfLines={1}>
            {summary ?? placeholder}
          </Text>
          <Text style={styles.selectChevron}>v</Text>
        </Pressable>
      </View>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setIsOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AppButton
                  title="Limpiar"
                  icon="close"
                  variant="secondary"
                  size="sm"
                  onPress={() => onChangeValues([])}
                />
                <AppButton title="Listo" icon="check" size="sm" onPress={() => setIsOpen(false)} />
              </View>
            </View>

            <ScrollView>
              <View style={{ gap: 8 }}>
                {options.map((o) => {
                  const isActive = values.includes(o.value);
                  return (
                    <Pressable
                      key={String(o.value)}
                      style={[styles.optionRow, isActive ? styles.optionRowActive : null]}
                      onPress={() => {
                        if (isActive) onChangeValues(values.filter((v) => v !== o.value));
                        else onChangeValues([...values, o.value]);
                      }}
                    >
                      <Text style={styles.optionText}>{isActive ? `[x] ${o.label}` : `[ ] ${o.label}`}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '900', color: Colors.textPrimary },
  selectBox: {
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  selectText: { fontSize: 16, color: Colors.textPrimary, flexShrink: 1 },
  selectPlaceholder: { fontSize: 16, color: Colors.textSecondary, flexShrink: 1 },
  selectChevron: { fontSize: 16, fontWeight: '900', color: Colors.primary },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 12,
    maxHeight: '70%',
    gap: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  optionRowActive: { borderColor: Colors.primary, backgroundColor: Colors.lightPrimary },
  optionText: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
});
