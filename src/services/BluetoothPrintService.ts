import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { requestBluetoothPermissions } from '../screens/PermissionConnect';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const PRINTER_ADDRESS_KEY = 'selected_printer_address';

export interface BluetoothDeviceInfo {
  name?: string;
  address: string;
  id?: string;
  bonded?: boolean;
  type?: string;
}

function normalizeZpl(zpl: string): string {
  const limpio = (zpl ?? '').replace(/^\uFEFF/, '').trim();

  if (!limpio) {
    throw new Error('El ZPL está vacío');
  }

  const withStart = limpio.startsWith('^XA') ? limpio : `^XA\n${limpio}`;
  return withStart.endsWith('^XZ') ? withStart : `${withStart}\n^XZ`;
}

export async function getBondedPrinters(): Promise<BluetoothDeviceInfo[]> {
  const ok = await requestBluetoothPermissions();
  if (!ok) {
    throw new Error('No se concedieron los permisos de Bluetooth');
  }

  const devices = await RNBluetoothClassic.getBondedDevices();

  return devices.map((d: any) => ({
    name: d.name,
    address: d.address,
    id: d.id,
    bonded: d.bonded,
    type: d.type,
  }));
}

export async function saveSelectedPrinterAddress(address: string): Promise<void> {
  await AsyncStorage.setItem(PRINTER_ADDRESS_KEY, address);
}

export async function getSelectedPrinterAddress(): Promise<string | null> {
  return AsyncStorage.getItem(PRINTER_ADDRESS_KEY);
}

export async function clearSelectedPrinterAddress(): Promise<void> {
  await AsyncStorage.removeItem(PRINTER_ADDRESS_KEY);
}

async function resolvePrinter(selectedAddress?: string) {
  const ok = await requestBluetoothPermissions();
  if (!ok) {
    throw new Error('No se concedieron los permisos de Bluetooth');
  }

  const devices = await RNBluetoothClassic.getBondedDevices();
  console.log('devices:', devices);

  const addressToUse = selectedAddress ?? (await getSelectedPrinterAddress());

  if (!addressToUse) {
    throw new Error('No hay una impresora seleccionada');
  }

  const printer = devices.find((d: any) => d.address === addressToUse);

  if (!printer) {
    throw new Error('La impresora seleccionada no está emparejada actualmente');
  }

  return printer;
}

export async function sendPrintZpl(zpl: string, selectedAddress?: string): Promise<void> {
  let printer: any = null;

  try {
    printer = await resolvePrinter(selectedAddress);
    console.log('printer:', printer);

    const connected = await printer.connect();
    console.log('connected:', connected);

    if (!connected) {
      throw new Error('No se pudo conectar a la impresora');
    }

    await sleep(300);

    try {
      await printer.clear();
    } catch (err) {
      console.log('clear() no disponible o falló:', err);
    }

    const normalizedZpl = normalizeZpl(zpl);

    console.log('ZPL length:', normalizedZpl.length);
    console.log('ZPL preview:', JSON.stringify(normalizedZpl.slice(0, 300)));

    await printer.write(normalizedZpl + '\r\n');
    await sleep(1200);

    console.log('Impresión enviada');
  } catch (error) {
    console.error('ERROR printZpl()', error);
    throw error;
  } finally {
    if (printer) {
      try {
        await printer.disconnect();
        console.log('Impresora desconectada');
      } catch (err) {
        console.log('Error al desconectar:', err);
      }
    }
  }
}

export async function printTest(zpl: string): Promise<void> {
  try {
    Alert.alert('debug', 'Entró a print');
    await sendPrintZpl(zpl);
    Alert.alert('debug', 'Impresión enviada correctamente');
  } catch (error) {
    Alert.alert('error', String(error));
  }
}