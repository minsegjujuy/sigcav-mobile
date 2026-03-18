import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export type NavbarTabKey = 'mis_actas' | 'nueva_acta';

type Props = {
  activeTab: NavbarTabKey;
  onChangeTab: (tab: NavbarTabKey) => void;
};

export function Navbar({ activeTab, onChangeTab }: Props) {
  return (
    <View style={styles.container}>
      <TabButton
        label="MIS ACTAS"
        icon="receipt-long"
        isActive={activeTab === 'mis_actas'}
        onPress={() => onChangeTab('mis_actas')}
      />
      <TabButton
        label="NUEVA ACTA"
        icon="note-add"
        isActive={activeTab === 'nueva_acta'}
        onPress={() => onChangeTab('nueva_acta')}
      />
    </View>
  );
}

function TabButton({
  label,
  icon,
  isActive,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, isActive ? styles.tabActive : styles.tabInactive]}
    >
      <View style={styles.tabInner}>
        <MaterialIcons name={icon} size={18} color={isActive ? Colors.white : Colors.primary} />
        <Text style={[styles.tabText, isActive ? styles.tabTextActive : styles.tabTextInactive]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabInactive: {
    backgroundColor: Colors.white,
    borderColor: Colors.divider,
  },
  tabInner: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '900' },
  tabTextActive: { color: Colors.white },
  tabTextInactive: { color: Colors.primary },
});
