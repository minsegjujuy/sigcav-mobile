import { Alert } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { requestBluetoothPermissions } from './PermissionConnect';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const printTest = async (zpl: string) => {
  console.log('1. entró a print');
  Alert.alert('debug', 'entró a print');

  const ok = await requestBluetoothPermissions();
  if (!ok) {
    Alert.alert('debug', 'No se concedieron los permisos de Bluetooth');
    return;
  }

  let printer: any = null;

  try {
    const devices = await RNBluetoothClassic.getBondedDevices();
    console.log('3. devices:', devices);

    printer =
      devices.find(d => d.address === 'AC:3F:A4:86:AA:4D') ||
      devices.find(d => d.address === 'AC:3F:A4:7C:32:1F') ||
      devices.find(d => d.name === 'XXRBJ164200077') ||
      devices.find(d => d.name === 'XXRBJ161701862');

    console.log('4. printer:', printer);

    if (!printer) {
      Alert.alert(
        'debug',
        'No se encontró la impresora emparejada'
      );
      return;
    }

    const connected = await printer.connect();
    console.log('5. connected:', connected);

    if (!connected) {
      Alert.alert('debug', 'No se pudo conectar a la impresora');
      return;
    }

    await sleep(300);

    // Opcional: limpiar buffer si la librería lo soporta bien
    try {
      await printer.clear();
    } catch (err) {
      console.log('clear() no disponible o falló:', err);
    }

    const limpio = (zpl ?? '')
      .replace(/^\uFEFF/, '')
      .trim();

    console.log('ZPL length:', limpio.length);
    console.log('ZPL preview:', JSON.stringify(limpio.slice(0, 300)));

    if (!limpio) {
      Alert.alert('debug', 'El ZPL está vacío');
      return;
    }

    const finalZpl = limpio.startsWith('^XA')
      ? limpio
      : `^XA\n${limpio}`;

    const normalizedZpl = finalZpl.endsWith('^XZ')
      ? finalZpl
      : `${finalZpl}\n^XZ`;

    console.log('6. enviando ZPL...');
    await printer.write(normalizedZpl + '\r\n');

    // Esperar antes de desconectar para no cortar el envío
    await sleep(1200);

    console.log('7. enviado');
    Alert.alert('debug', `Impresión enviada a ${printer.name}`);
  } catch (e) {
    console.error('ERROR print()', e);
    Alert.alert('error', String(e));
  } finally {
    if (printer) {
      try {
        await printer.disconnect();
        console.log('8. desconectado');
      } catch (err) {
        console.log('Error al desconectar:', err);
      }
    }
  }
};