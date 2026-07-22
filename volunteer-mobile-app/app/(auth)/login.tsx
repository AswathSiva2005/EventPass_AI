import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { Shell, Panel, Input, PrimaryButton, Badge, AppHeader, colors } from "../../src/components/ui";
import { useAuth } from "../../src/context/auth-context";

export default function LoginScreen() {
  const { login, signingIn, hydrated, account } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(true);

  useEffect(() => {
    if (hydrated && account) {
      router.replace("/(tabs)/dashboard");
    }
  }, [account, hydrated, router]);

  const submit = async () => {
    const normalizedPhone = phone.replace(/[\s()-]/g, "");
    if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhone) || !password) {
      Alert.alert("Login required", "Enter a valid phone number and password.");
      return;
    }

    try {
      await login({ phone: normalizedPhone, password, rememberLogin });
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      Alert.alert("Login failed", error instanceof Error ? error.message : "Unable to sign in.");
    }
  };

  return (
    <Shell scroll={false}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1, justifyContent: "center", gap: 16, paddingHorizontal: 4 }}>
          <AppHeader
            icon="shield-account"
            title="Volunteer Login"
            subtitle="Secure sign in for event entry, exit, and attendance handling."
          />

          <Panel style={{ padding: 18, gap: 14 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Sign in</Text>
            <Input value={phone} onChangeText={setPhone} placeholder="Phone, e.g. +919876543210" keyboardType="phone-pad" autoCapitalize="none" icon="phone-outline" />
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPassword}
              icon="lock-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword((value) => !value)}
            />
            <PrimaryButton label={rememberLogin ? "Remember session" : "Forget session"} icon={rememberLogin ? "toggle-switch" : "toggle-switch-off-outline"} onPress={() => setRememberLogin((value) => !value)} variant="ghost" />
            <PrimaryButton label={signingIn ? "Signing in..." : "Login"} icon="login" onPress={() => void submit()} disabled={signingIn} />
            <PrimaryButton label="Create volunteer account" icon="account-plus-outline" onPress={() => router.push("/(auth)/register")} variant="ghost" disabled={signingIn} />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Badge label="secure login" />
              <Badge label="refresh tokens" tone="muted" />
              <Badge label="offline cache" tone="warning" />
            </View>
          </Panel>

          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", paddingHorizontal: 18 }}>
            Sign in with the unique phone number used during registration. Access tokens stay in memory; refresh tokens are stored securely on device.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Shell>
  );
}
