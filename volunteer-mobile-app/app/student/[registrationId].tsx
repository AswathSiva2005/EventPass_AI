import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { AppHeader, Badge, EmptyState, Panel, PrimaryButton, SectionTitle, colors } from "../../src/components/ui";
import { useAuth } from "../../src/context/auth-context";
import { useCache } from "../../src/context/cache-context";
import { normalizeScanValue } from "../../src/lib/scan";
import { shortDateTime } from "../../src/lib/format";
import type { StudentRecord } from "../../src/lib/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StudentDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ registrationId?: string }>();
  const rawRegistrationId = Array.isArray(params.registrationId) ? params.registrationId[0] : params.registrationId;
  const registrationId = useMemo(() => normalizeScanValue(rawRegistrationId ?? ""), [rawRegistrationId]);
  const { loadStudent, markAttendance } = useAuth();
  const { cacheStudent, recentStudents, recordAttendance } = useCache();
  const [student, setStudent] = useState<StudentRecord | null>(recentStudents.find((item) => item.registrationId === registrationId) ?? null);
  const [loading, setLoading] = useState(!student);
  const [submitting, setSubmitting] = useState<"entry" | "exit" | null>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 700;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!registrationId) {
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
  }, [cacheStudent, loadStudent, registrationId]);

  const performMark = async (action: "entry" | "exit") => {
    if (!student) {
      return;
    }
    try {
      setSubmitting(action);
      const updated = await markAttendance(student.registrationId, action, "manual");
      await recordAttendance({ student: updated, action, method: "manual", synced: true });
      await cacheStudent(updated);
      setStudent(updated);
      Alert.alert(action === "entry" ? "Entry recorded" : "Exit recorded", `${student.studentName}'s ${action} was saved successfully.`);
    } catch (error) {
      Alert.alert("Attendance not changed", error instanceof Error ? error.message : "Unable to update attendance.");
    } finally {
      setSubmitting(null);
    }
  };

  const confirmMark = (action: "entry" | "exit") => {
    Alert.alert(
      action === "entry" ? "Confirm entry" : "Confirm exit",
      `This ${action} can be recorded only once for ${student?.studentName ?? "this student"}.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: action === "entry" ? "Mark entry" : "Mark exit", onPress: () => void performMark(action) }
      ]
    );
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

  const canMarkEntry = student.attendanceStatus === "registered";
  const canMarkExit = student.attendanceStatus === "checked_in";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.ink }} contentContainerStyle={{ width: "100%", maxWidth: 920, alignSelf: "center", paddingHorizontal: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28, gap: 16 }}>
      <AppHeader icon="card-account-details-outline" title={student.studentName} subtitle={`${student.registrationId} • ${student.eventName}`} />

      <Panel style={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <Badge label={student.verificationStatus} tone={student.verificationStatus === "approved" ? "accent" : student.verificationStatus === "rejected" ? "danger" : "warning"} />
          <Badge label={student.attendanceStatus} tone={student.attendanceStatus === "checked_in" ? "accent" : student.attendanceStatus === "checked_out" ? "muted" : "warning"} />
        </View>
        <SectionTitle title="Student details" />
        <View style={{ flexDirection: isWide ? "row" : "column", gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>ROLL NUMBER</Text>
            <Text style={{ color: colors.text, fontWeight: "700" }}>{student.rollNumber}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>COLLEGE & DEPARTMENT</Text>
            <Text style={{ color: colors.text }}>{student.collegeName} · {student.departmentName} · Year {student.year}</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>CONTACT</Text>
            <Text style={{ color: colors.text }}>{student.phone} · {student.email}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>VENUE / UPDATED</Text>
            <Text style={{ color: colors.text }}>{student.venue} · {shortDateTime(student.updatedAt)}</Text>
          </View>
        </View>
      </Panel>

      <Panel style={{ padding: 16, gap: 14 }}>
        <SectionTitle title="Identity verification" />
        <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
          Compare the live student with the selfie and college ID before recording attendance.
        </Text>
        <View style={{ flexDirection: isWide ? "row" : "column", gap: 12 }}>
          {[
            { label: "Student selfie", source: student.selfie?.url, ratio: 1 },
            { label: "ID card · front", source: student.idFront?.url, ratio: 1.58 },
            { label: "ID card · back", source: student.idBack?.url, ratio: 1.58 }
          ].map((document) => (
            <View key={document.label} style={{ flex: 1, gap: 7 }}>
              <Text style={{ color: colors.text, fontWeight: "800" }}>{document.label}</Text>
              {document.source ? <Image source={{ uri: document.source }} resizeMode="cover" accessibilityLabel={document.label} style={{ width: "100%", aspectRatio: document.ratio, borderRadius: 16, backgroundColor: "#17243a", borderWidth: 1, borderColor: "rgba(148,163,184,.35)" }} /> : <View style={{ width: "100%", aspectRatio: document.ratio, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#17243a", borderWidth: 1, borderColor: "rgba(148,163,184,.35)", padding: 16 }}><Text style={{ color: colors.muted, textAlign: "center", fontSize: 13 }}>Refreshing document…</Text></View>}
            </View>
          ))}
        </View>
      </Panel>

      <Panel style={{ padding: 16, gap: 12 }}>
        <SectionTitle title="Attendance actions" />
        <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
          {student.attendanceStatus === "registered"
              ? "Ready for entry. Each action is permanently recorded once."
              : student.attendanceStatus === "checked_in"
                ? "Entry is complete. Exit is now available once."
                : "Entry and exit are complete for this student."}
        </Text>
        <View style={{ gap: 10 }}>
          <PrimaryButton
            label={student.attendanceStatus === "registered" ? (submitting === "entry" ? "Saving entry..." : "Mark entry") : "Entry already recorded"}
            icon={student.attendanceStatus === "registered" ? "login" : "check-circle-outline"}
            onPress={() => confirmMark("entry")}
            disabled={!canMarkEntry || submitting !== null}
          />
          <PrimaryButton
            label={student.attendanceStatus === "checked_out" ? "Exit already recorded" : submitting === "exit" ? "Saving exit..." : "Mark exit"}
            icon={student.attendanceStatus === "checked_out" ? "check-circle-outline" : "logout"}
            onPress={() => confirmMark("exit")}
            variant="ghost"
            disabled={!canMarkExit || submitting !== null}
          />
          <PrimaryButton label="Back to scan" icon="qrcode-scan" onPress={() => router.push("/(tabs)/scan")} variant="ghost" />
        </View>
      </Panel>

    </ScrollView>
  );
}
