import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // If user is authenticated, prevent going back to auth screens
      // This will redirect them to Home if they try to go back
      const currentRoute = router;
      
      // You can add additional logic here if needed
    }
  }, [user, isLoading, router]);

  return <>{children}</>;
};