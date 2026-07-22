import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { AppHeader, Badge, colors, Input, Panel, PrimaryButton, Shell } from "../../src/components/ui";
import { useAuth } from "../../src/context/auth-context";

const normalizePhone = (value: string) => value.replace(/[\s()-]/g, "");

export default function RegisterScreen() {
  const { register, signingIn, hydrated, account } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (hydrated && account) {
      router.replace("/(tabs)/dashboard");
    }
  }, [account, hydrated]);

  const submit = async () => {
    const normalizedPhone = normalizePhone(phone);
    if (name.trim().length < 2) {
      Alert.alert("Name required", "Enter your full name.");
      return;
    }
    if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhone)) {
      Alert.alert("Invalid phone", "Use an international phone number, for example +919876543210.");
      return;
    }
    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      Alert.alert(
        "Weak password",
        "Use at least 8 characters with uppercase, lowercase, a number, and a special character."
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Enter the same password in both fields.");
      return;
    }

    try {
      await register({
        name: name.trim(),
        phone: normalizedPhone,
        password,
        rememberLogin: true
      });
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error instanceof Error ? error.message : "Unable to create the volunteer account."
      );
    }
  };

  return (
    <Shell>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ gap: 16, paddingHorizontal: 4, paddingVertical: 28 }}>
          <AppHeader
            icon="account-plus"
            title="Volunteer Registration"
            subtitle="Create your account using a unique phone number."
          />

          <Panel style={{ padding: 18, gap: 14 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Create account</Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              autoCapitalize="words"
              icon="account-outline"
            />
            <Input
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone, e.g. +919876543210"
              keyboardType="phone-pad"
              autoCapitalize="none"
              icon="phone-outline"
            />
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPassword}
              icon="lock-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword((value) => !value)}
            />
            <Input
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              secureTextEntry={!showPassword}
              icon="lock-check-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword((value) => !value)}
            />
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
              Passwords require 8+ characters, uppercase, lowercase, a number, and a special character.
            </Text>
            <PrimaryButton
              label={signingIn ? "Creating account..." : "Register and sign in"}
              icon="account-check-outline"
              onPress={() => void submit()}
              disabled={signingIn}
            />
            <PrimaryButton
              label="Back to login"
              icon="arrow-left"
              onPress={() => router.replace("/(auth)/login")}
              variant="ghost"
              disabled={signingIn}
            />
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Badge label="unique phone" />
              <Badge label="encrypted password" tone="muted" />
              <Badge label="automatic login" tone="warning" />
            </View>
          </Panel>
        </View>
      </KeyboardAvoidingView>
    </Shell>
  );
}
