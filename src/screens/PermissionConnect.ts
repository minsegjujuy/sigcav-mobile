
import { PermissionsAndroid, Platform } from 'react-native';

export async function requestBluetoothPermissions() {
  if (Platform.OS !== 'android') return true;

  if (Platform.Version >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    ]);

    console.log('PERMISOS:', result);

    return (
      result['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
      result['android.permission.BLUETOOTH_SCAN'] === 'granted'
    );
  }

  // Android < 12
  const location = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  return location === 'granted';
}