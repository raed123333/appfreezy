import { useAuth } from '../context/AuthContext';
import { Redirect } from 'expo-router';
import { Text, View, ActivityIndicator } from 'react-native';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#013743'
      }}>
        <ActivityIndicator size="large" color="#04D9E7" />
        <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Chargement...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/LogIn" />;
  }

  return <>{children}</>;
};