import { API } from '@/config';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  nomEntreprise: string;
  token: string;
  utilisateur?: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  registerGoogle: (googleData: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyResetCode: (email: string, code: string) => Promise<void>;
  resetPasswordWithCode: (email: string, code: string, newPassword: String) => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await SecureStore.getItemAsync('userData');
      const authToken = await SecureStore.getItemAsync('authToken');
      
      if (userData && authToken) {
        const parsedUserData = JSON.parse(userData);
        // Ensure the user object has the token
        const userWithToken = {
          ...parsedUserData,
          token: authToken
        };
        setUser(userWithToken);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get auth token
  const getAuthToken = async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API}/utilisateur/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motpasse: password }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData = { 
          ...data, 
          token: data.token,
          id: data.utilisateur?.idU || data.utilisateur?.id 
        };

        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
        await SecureStore.setItemAsync('authToken', data.token);

        setUser(userData);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
    } catch (error) {
      Alert.alert("Erreur", error.message || "Impossible de se connecter");
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await fetch(`${API}/utilisateur`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      // After successful registration, automatically log the user in
      await login(userData.email, userData.motpasse);

    } catch (error) {
      Alert.alert("Erreur", error.message || "Impossible de créer le compte");
      throw error;
    }
  };

  const registerGoogle = async (googleData: any) => {
    try {
      const { email, givenName, familyName } = googleData;

      const userPayload = {
        nom: familyName || "",
        prenom: givenName || "",
        email: email,
        nomEntreprise: "",
        adresse: "",
        telephone: "",
      };

      const response = await fetch(`${API}/utilisateur/LoginGoogle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Google signup failed");
      }

      const data = await response.json();
      const userData = { 
        ...data, 
        token: data.token,
        id: data.utilisateur?.idU || data.utilisateur?.id 
      };

      await SecureStore.setItemAsync("userData", JSON.stringify(userData));
      await SecureStore.setItemAsync("authToken", data.token);

      setUser(userData);

      Alert.alert("Succès", "Connexion réussie", [
        {
          text: "OK",
          onPress: () => router.push("../(freezycorp)/Home"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de créer le compte avec Google");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('userData');
      await SecureStore.deleteItemAsync('authToken');
      setUser(null);
      // Navigate to auth screen after logout
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await fetch(`${API}/utilisateur/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send reset email");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      Alert.alert("Erreur", error.message || "Impossible d'envoyer l'email de réinitialisation");
      throw error;
    }
  };

  const verifyResetCode = async (email: String, code: String) => {
    const response = await fetch(`${API}/utilisateur/verifyResetCode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw data;
    }
    return data;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch(`${API}/utilisateur/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reset password");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      Alert.alert("Erreur", error.message || "Impossible de réinitialiser le mot de passe");
      throw error;
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string) => {
    try {
      const response = await fetch(`${API}/utilisateur/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      return data;
    } catch (error) {
      Alert.alert("Erreur", error.message || "Erreur lors de la réinitialisation du mot de passe");
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      register,
      forgotPassword,
      resetPassword,
      verifyResetCode,
      registerGoogle,
      resetPasswordWithCode,
      getAuthToken // ADDED
    }}>
      {children}
    </AuthContext.Provider>
  );
};