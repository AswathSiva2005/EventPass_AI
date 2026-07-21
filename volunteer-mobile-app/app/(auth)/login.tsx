import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { Shell, Panel, Input, PrimaryButton, Badge, AppHeader, colors } from "../../src/components/ui";
import { useAuth } from "../../src/context/auth-context";

export default function LoginScreen() {
  const { login, signingIn, hydrated, account } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberLogin, setRememberLogin] = useState(true);

  useEffect(() => {
    if (hydrated && account) {
      router.replace("/(tabs)/dashboard");
    }
  }, [account, hydrated, router]);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Login required", "Enter your email and password.");
      return;
    }

    try {
      await login({ email: email.trim().toLowerCase(), password, rememberLogin });
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
            <Input value={email} onChangeText={setEmail} placeholder="Volunteer email" keyboardType="email-address" autoCapitalize="none" icon="email-outline" />
            <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry icon="lock-outline" />
            <PrimaryButton label={rememberLogin ? "Remember session" : "Forget session"} icon={rememberLogin ? "toggle-switch" : "toggle-switch-off-outline"} onPress={() => setRememberLogin((value) => !value)} variant="ghost" />
            <PrimaryButton label={signingIn ? "Signing in..." : "Login"} icon="login" onPress={() => void submit()} disabled={signingIn} />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Badge label="secure login" />
              <Badge label="refresh tokens" tone="muted" />
              <Badge label="offline cache" tone="warning" />
            </View>
          </Panel>

          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center", paddingHorizontal: 18 }}>
            Use the same volunteer account created in the backend. Access tokens stay in memory; refresh tokens are stored securely on device.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Shell>
  );
}
