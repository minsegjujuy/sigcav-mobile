import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
} from 'react-native-reanimated';
import { useAuth } from '../auth/AuthContext';
import { Navbar, type NavbarTabKey } from '../components/Navbar';
import { MisActasScreen } from './MisActasScreen';
import { NuevaActaScreen } from './NuevaActaScreen';
import { Colors } from '../theme/colors';
import { AppButton } from '../components/ui/AppButton';
import type { ActaRequest } from '../features/actas/types';
import { HechoVialFormRN } from './HechosVialesScreen';
import HechosVialesScreen from './HechosVialesList';
import PrinterSelector from '../components/modules/PrinterSelector';
import TwoFactorSetupScreen from './TwoFactorSetupScreen';

type NavbarGroupKey = 'actas' | 'hechos_viales' | 'configuracion';

export function HomeScreen() {
  const { signOut } = useAuth();

  const [tab, setTab] = useState<NavbarTabKey>('mis_actas');
  const [activeGroup, setActiveGroup] = useState<NavbarGroupKey>('actas');
  const [editActa, setEditActa] = useState<ActaRequest | null>(null);

  //const fade = useRef(new Animated.Value(1)).current;

  const isFormTab = tab === 'nueva_acta' || tab === 'nuevo_hecho_vial';

  const confirmLeaveForm = (onConfirm: () => void) => {
    Alert.alert('Confirmación', '¿seguro que deseas salir del formulario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: onConfirm,
      },
    ]);
  };

  /*useEffect(() => {
    //printTest();
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [fade, tab]);*/

  const handleChangeTab = (nextTab: NavbarTabKey) => {
    if (isFormTab && nextTab !== tab) {
      confirmLeaveForm(() => {
        setTab(nextTab);

        if (nextTab === 'mis_actas' || nextTab === 'nueva_acta') {
          setActiveGroup('actas');
        } else if (nextTab === 'mis_hechos_viales' || nextTab === 'nuevo_hecho_vial') {
          setActiveGroup('hechos_viales');
        } else if (nextTab === 'configuracion' || nextTab === '2FA') {
          setActiveGroup('configuracion');
        }
      });
      return;
    }

    setTab(nextTab);

    if (nextTab === 'mis_actas' || nextTab === 'nueva_acta') {
      setActiveGroup('actas');
    } else if (nextTab === 'mis_hechos_viales' || nextTab === 'nuevo_hecho_vial') {
      setActiveGroup('hechos_viales');
    } else if (nextTab === 'configuracion' || nextTab === '2FA') {
      setActiveGroup('configuracion');
    }
  };

  const handleChangeGroup = (group: NavbarGroupKey) => {
    const nextTab =
      group === 'actas' ? 'mis_actas' : group === 'hechos_viales' ? 'mis_hechos_viales' : 'configuracion';

    if (isFormTab) {
      confirmLeaveForm(() => {
        setActiveGroup(group);
        setTab(nextTab);
      });
      return;
    }

    setActiveGroup(group);
    setTab(nextTab);
  };

  const content = useMemo(() => {
    switch (tab) {
      case 'nueva_acta':
        return (
          <NuevaActaScreen
            editActa={editActa}
            onEditActaConsumed={() => setEditActa(null)}
          />
        );

      case 'mis_actas':
        return (
          <MisActasScreen
            onEditActa={(acta) => {
              setEditActa(acta);
              setTab('nueva_acta');
              setActiveGroup('actas');
            }}
          />
        );

      case 'mis_hechos_viales':
        return <HechosVialesScreen />;

      case 'nuevo_hecho_vial':
        return <HechoVialFormRN
          modo="create"
          limpiarHechoVial={() => console.log('limpiar hecho vial')}
        />;

      case 'configuracion':
        return <PrinterSelector />;

        case '2FA':
        return <TwoFactorSetupScreen />;

      default:
        return null;
    }
  }, [editActa, tab]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !isFormTab) return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmLeaveForm(() => {
        if (tab === 'nuevo_hecho_vial') {
          setActiveGroup('hechos_viales');
          setTab('mis_hechos_viales');
        } else {
          setActiveGroup('actas');
          setTab('mis_actas');
        }
      });
      return true;
    });

    return () => subscription.remove();
  }, [isFormTab, tab]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ gap: 2 }}>
          <Text style={styles.title}>SIGCAV</Text>
          <Text style={styles.subtitle}>Personal de calle</Text>
        </View>

        <AppButton
          title="Salir"
          icon="logout"
          variant="secondary"
          size="sm"
          onPress={signOut}
        />
      </View>

      <Navbar
        activeTab={tab}
        onChangeTab={handleChangeTab}
        activeGroup={activeGroup}
        onChangeGroup={handleChangeGroup}
      />

      <Animated.View key={tab} style={[styles.body]} entering={SlideInRight.duration(250)}
        exiting={FadeOut.duration(150)} >
        {content}
      </Animated.View>
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
