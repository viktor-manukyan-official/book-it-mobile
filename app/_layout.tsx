import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Colors } from "../constants/colors";
import { AuthProvider } from "../src/hooks/AuthContext";
import { useAuth } from "../src/hooks/useAuth";

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    const inAuthGroup = segments[0] === "(auth)";
    // Legal pages (Terms / Privacy) are public — reachable before sign-in and
    // from settings after — so they are exempt from the auth redirect.
    const inLegalGroup = segments[0] === "legal";
    if (!isAuthenticated && !inAuthGroup && !inLegalGroup) {
      // Unauthenticated users are redirected to the welcome / landing screen.
      router.replace("/(auth)/welcome");
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated users should never sit in the auth flow.
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="salon/[id]" />
      <Stack.Screen name="service/[id]" />
      <Stack.Screen name="booking/time" />
      <Stack.Screen name="booking/review" options={{ presentation: "modal" }} />
      <Stack.Screen name="booking/cancel" options={{ presentation: "modal" }} />
      <Stack.Screen name="booking/details" />
      <Stack.Screen name="booking/rate" options={{ presentation: "modal" }} />
      <Stack.Screen name="booking/confirmed" options={{ gestureEnabled: false }} />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="profile/personal" />
      <Stack.Screen name="profile/language" />
      <Stack.Screen name="profile/notifications-settings" />
      <Stack.Screen name="profile/help" />
      <Stack.Screen name="legal/terms" />
      <Stack.Screen name="legal/privacy" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
});
