import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { AppHeader, Badge, EmptyState, Panel, PrimaryButton, SectionTitle, colors } from "../../src/components/ui";
import { useAuth } from "../../src/context/auth-context";
import { useCache } from "../../src/context/cache-context";
import { normalizeScanValue } from "../../src/lib/scan";
import { shortDateTime } from "../../src/lib/format";
import type { StudentRecord } from "../../src/lib/types";

export default function StudentDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ registrationId?: string }>();
  const rawRegistrationId = Array.isArray(params.registrationId) ? params.registrationId[0] : params.registrationId;
  const registrationId = useMemo(() => normalizeScanValue(rawRegistrationId ?? ""), [rawRegistrationId]);
  const { loadStudent } = useAuth();
  const { cacheStudent, recentStudents, recordAttendance } = useCache();
  const [student, setStudent] = useState<StudentRecord | null>(recentStudents.find((item) => item.registrationId === registrationId) ?? null);
  const [loading, setLoading] = useState(!student);

  useEffect(() => {
    if (!registrationId || student) {
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        const result = await loadStudent(registrationId);
        setStudent(result);
        await cacheStudent(result);
      } catch (error) {
        Alert.alert("Student load failed", error instanceof Error ? error.message : "Unable to load the student.");
      } finally {
        setLoading(false);
      }
    })();
  }, [cacheStudent, loadStudent, registrationId, student]);

  const mark = async (action: "entry" | "exit") => {
    if (!student) {
      return;
    }

    await recordAttendance({ student, action, method: "manual" });
    setStudent((current) => (current ? { ...current, attendanceStatus: action === "entry" ? "checked_in" : "checked_out", updatedAt: new Date().toISOString() } : current));
  };

  if (!registrationId) {
    return <EmptyState title="Missing registration ID" description="Open this screen from a search or scan result." />;
  }

  if (loading && !student) {
    return <EmptyState title="Loading student" description="Fetching the latest registration record." />;
  }

  if (!student) {
    return <EmptyState title="Student not found" description="That registration ID is not available in the cache or backend." />;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.ink }} contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 16 }}>
      <AppHeader icon="card-account-details-outline" title={student.studentName} subtitle={`${student.registrationId} • ${student.eventName}`} />

      <Panel style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <Badge label={student.verificationStatus} tone={student.verificationStatus === "approved" ? "accent" : student.verificationStatus === "rejected" ? "danger" : "warning"} />
          <Badge label={student.attendanceStatus} tone={student.attendanceStatus === "checked_in" ? "accent" : student.attendanceStatus === "checked_out" ? "muted" : "warning"} />
        </View>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Venue</Text>
        <Text style={{ color: colors.muted, lineHeight: 20 }}>{student.venue}</Text>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Last updated</Text>
        <Text style={{ color: colors.muted }}>{shortDateTime(student.updatedAt)}</Text>
      </Panel>

      <Panel style={{ padding: 16, gap: 12 }}>
        <SectionTitle title="Attendance actions" />
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Mark entry" icon="login" onPress={() => void mark("entry")} />
          <PrimaryButton label="Mark exit" icon="logout" onPress={() => void mark("exit")} variant="ghost" />
          <PrimaryButton label="Back to scan" icon="qrcode-scan" onPress={() => router.push("/(tabs)/scan")} variant="ghost" />
        </View>
      </Panel>

      <Panel style={{ padding: 16, gap: 10 }}>
        <SectionTitle title="Student snapshot" />
        <Text style={{ color: colors.muted, lineHeight: 20 }}>
          The app keeps this record cached locally so volunteers can keep working when connectivity is weak. Attendance actions are written to the offline queue for later sync.
        </Text>
      </Panel>
    </ScrollView>
  );
}
