import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { Navbar, type NavbarTabKey } from '../components/Navbar';
import { MisActasScreen } from './MisActasScreen';
import { NuevaActaScreen } from './NuevaActaScreen';
import { Colors } from '../theme/colors';
import { AppButton } from '../components/ui/AppButton';
import type { ActaRequest } from '../features/actas/types';

export function HomeScreen() {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<NavbarTabKey>('mis_actas');
  const [editActa, setEditActa] = useState<ActaRequest | null>(null);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [fade, tab]);

  const content = useMemo(() => {
    if (tab === 'nueva_acta') {
      return <NuevaActaScreen editActa={editActa} onEditActaConsumed={() => setEditActa(null)} />;
    }
    return (
      <MisActasScreen
        onEditActa={(acta) => {
          setEditActa(acta);
          setTab('nueva_acta');
        }}
      />
    );
  }, [editActa, tab]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ gap: 2 }}>
          <Text style={styles.title}>SIGCAV</Text>
          <Text style={styles.subtitle}>Personal de calle</Text>
        </View>
        <AppButton title="Salir" icon="logout" variant="secondary" size="sm" onPress={signOut} />
      </View>

      <Navbar activeTab={tab} onChangeTab={setTab} />

      <Animated.View style={[styles.body, { opacity: fade }]}>{content}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: Colors.darkPrimary,
  },
  title: { fontSize: 20, fontWeight: '900', color: Colors.white },
  subtitle: { fontSize: 12, fontWeight: '700', color: Colors.lightPrimary },
  body: { flex: 1 },
});
