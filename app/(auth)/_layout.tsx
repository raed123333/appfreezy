import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users away from auth pages
    if (!isLoading && user) {
      router.replace("/(freezycorp)/Home");
    }
  }, [user, isLoading, router]);

  // Don't render auth routes if user is authenticated
  if (!isLoading && user) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}