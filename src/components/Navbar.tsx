import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export type NavbarTabKey =
  | 'mis_actas'
  | 'nueva_acta'
  | 'mis_hechos_viales'
  | 'nuevo_hecho_vial'
  | 'configuracion';

type NavbarGroupKey = 'actas' | 'hechos_viales' | 'configuracion';

type Props = {
  activeTab: NavbarTabKey;
  onChangeTab: (tab: NavbarTabKey) => void;
  activeGroup: NavbarGroupKey;
  onChangeGroup: (group: NavbarGroupKey) => void;
};

const GROUPS: NavbarGroupKey[] = ['actas', 'hechos_viales', 'configuracion'];

export function Navbar({
  activeTab,
  onChangeTab,
  activeGroup,
  onChangeGroup,
}: Props) {
  const handlePrevGroup = () => {
    const currentIndex = GROUPS.indexOf(activeGroup);
    const nextIndex = currentIndex === 0 ? GROUPS.length - 1 : currentIndex - 1;
    onChangeGroup(GROUPS[nextIndex]);
  };

  const handleNextGroup = () => {
    const currentIndex = GROUPS.indexOf(activeGroup);
    const nextIndex = currentIndex === GROUPS.length - 1 ? 0 : currentIndex + 1;
    onChangeGroup(GROUPS[nextIndex]);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePrevGroup} style={styles.arrowButton}>
        <MaterialIcons name="chevron-left" size={24} color={Colors.primary} />
      </Pressable>

      <View style={styles.tabsContainer}>
        {activeGroup === 'actas' ? (
          <>
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
          </>
        ) : activeGroup === 'hechos_viales' ? (
          <>
            <TabButton
              label="MIS HECHOS"
              icon="car-crash"
              isActive={activeTab === 'mis_hechos_viales'}
              onPress={() => onChangeTab('mis_hechos_viales')}
            />
            <TabButton
              label="NUEVO HECHO"
              icon="playlist-add"
              isActive={activeTab === 'nuevo_hecho_vial'}
              onPress={() => onChangeTab('nuevo_hecho_vial')}
            />
          </>
        ) : (
          <TabButton
            label="CONFIGURACIÓN"
            icon="settings"
            isActive={activeTab === 'configuracion'}
            onPress={() => onChangeTab('configuracion')}
          />
        )}
      </View>

      <Pressable onPress={handleNextGroup} style={styles.arrowButton}>
        <MaterialIcons name="chevron-right" size={24} color={Colors.primary} />
      </Pressable>
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
        <MaterialIcons
          name={icon}
          size={18}
          color={isActive ? Colors.white : Colors.primary}
        />
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
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
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
  tabInner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '900',
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabTextInactive: {
    color: Colors.primary,
  },
});