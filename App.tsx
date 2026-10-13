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
import { installAuthRefreshInterceptor } from './src/auth/installAuthRefreshInterceptor';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { asyncStoragePersister } from './src/features/common/asyncStoragePersister';

installAuthRefreshInterceptor();

function Root() {
  const { jwt } = useAuth();
  return jwt ? <HomeScreen /> : <LoginScreen />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24h
      gcTime: 1000 * 60 * 60 * 24, // 24 horas
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient}
    persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24,
      }}>
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
    </PersistQueryClientProvider>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
