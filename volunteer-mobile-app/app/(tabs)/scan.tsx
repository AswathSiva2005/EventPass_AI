import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { AppHeader, EmptyState, Input, Panel, PrimaryButton, colors } from "../../src/components/ui";
import { useAuth } from "../../src/context/auth-context";
import { useCache } from "../../src/context/cache-context";
import { normalizeRegistrationId } from "../../src/lib/format";
import { normalizeScanValue } from "../../src/lib/scan";

export default function ScanScreen() {
  const { loadStudent } = useAuth();
  const { cacheStudent } = useCache();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualValue, setManualValue] = useState("");
  const [scanned, setScanned] = useState(false);
  const scanningLock = useRef(false);

  useEffect(() => {
    if (!permission?.granted) {
      void requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  const openStudent = async (rawValue: string) => {
    const registrationId = normalizeScanValue(rawValue);
    if (!registrationId || scanningLock.current) {
      return;
    }

    scanningLock.current = true;
    try {
      const student = await loadStudent(registrationId);
      await cacheStudent(student);
      router.push(`/student/${encodeURIComponent(student.registrationId)}`);
    } catch (error) {
      Alert.alert("Scan failed", error instanceof Error ? error.message : "Unable to load the scanned student.");
    } finally {
      setTimeout(() => {
        scanningLock.current = false;
      }, 1200);
    }
  };

  if (!permission) {
    return <EmptyState title="Preparing camera" description="Checking scan permissions..." />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 16, backgroundColor: colors.ink, gap: 16 }}>
        <AppHeader icon="camera" title="Scanner access" subtitle="Allow camera access to scan QR codes and barcodes." />
        <PrimaryButton label="Grant camera access" icon="camera-outline" onPress={() => void requestPermission()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "code39", "ean13", "ean8", "upc_a", "upc_e"] as any }}
        onBarcodeScanned={(event) => {
          if (scanned) {
            return;
          }
          setScanned(true);
          void openStudent(event.data);
        }}
      />
      <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, justifyContent: "space-between", padding: 16 }}>
        <AppHeader icon="qrcode-scan" title="QR / Barcode Scanner" subtitle="Aim at the student QR code or barcode to open the record instantly." />
        <Panel style={{ padding: 16, gap: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>Manual fallback</Text>
          <Input value={manualValue} onChangeText={setManualValue} placeholder="Paste registration ID" icon="card-account-details-outline" autoCapitalize="characters" />
          <PrimaryButton label="Open record" icon="open-in-new" onPress={() => void openStudent(normalizeRegistrationId(manualValue))} />
          <PrimaryButton label="Reset scanner" icon="restart" onPress={() => setScanned(false)} variant="ghost" />
        </Panel>
      </View>
    </View>
  );
}
