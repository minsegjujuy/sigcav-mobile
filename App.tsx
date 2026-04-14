import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { SnackbarHost } from './src/components/snackbar/SnackbarHost';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { Colors } from './src/theme/colors';
import { NavigationContainer } from '@react-navigation/native';
import { HechoVialProvider } from './src/features/hechos-viales/HechoVialContext';

function Root() {
  const { jwt } = useAuth();
  return jwt ? <HomeScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <NavigationContainer>
      <HechoVialProvider>
        <SafeAreaProvider>
          <PaperProvider>
            <AuthProvider>
              <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <Root />
                <SnackbarHost />
                <StatusBar style="light" />
              </SafeAreaView>
            </AuthProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </HechoVialProvider>
    </NavigationContainer>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
