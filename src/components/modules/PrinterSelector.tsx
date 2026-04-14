import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BluetoothDeviceInfo, getBondedPrinters, getSelectedPrinterAddress, saveSelectedPrinterAddress } from '../../services/BluetoothPrintService';

export default function PrinterSelector() {
  const [devices, setDevices] = useState<BluetoothDeviceInfo[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const bonded = await getBondedPrinters();
      const savedAddress = await getSelectedPrinterAddress();

      setDevices(bonded);
      setSelectedAddress(savedAddress);
    } catch (error) {
      console.error('Error cargando impresoras:', error);
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (device: BluetoothDeviceInfo) => {
    try {
      await saveSelectedPrinterAddress(device.address);
      setSelectedAddress(device.address);
      Alert.alert('Impresora seleccionada', `${device.name ?? 'Sin nombre'}\n${device.address}`);
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const renderItem = ({ item }: { item: BluetoothDeviceInfo }) => {
    const isSelected = item.address === selectedAddress;

    return (
      <Pressable
        onPress={() => handleSelect(item)}
        style={[styles.card, isSelected && styles.cardSelected]}
      >
        <Text style={styles.name}>{item.name || 'Sin nombre'}</Text>
        <Text style={styles.meta}>MAC: {item.address}</Text>
        <Text style={styles.meta}>Tipo: {item.type || 'N/D'}</Text>
        {isSelected ? <Text style={styles.selected}>Seleccionada</Text> : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Impresoras emparejadas</Text>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.address}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDevices} />
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>No hay dispositivos emparejados</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  cardSelected: {
    borderColor: '#1976d2',
    borderWidth: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    marginTop: 4,
  },
  selected: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
});