import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { AppHeader, EmptyState, Panel, PrimaryButton, SectionTitle, StatCard, StudentCard, colors } from "../../src/components/ui";
import { useAuth } from "../../src/context/auth-context";
import { useCache } from "../../src/context/cache-context";
import { shortDateTime } from "../../src/lib/format";

export default function DashboardScreen() {
  const { account } = useAuth();
  const { recentStudents, attendanceEvents, pendingCount } = useCache();

  const checkedIn = useMemo(() => recentStudents.filter((student) => student.attendanceStatus === "checked_in").length, [recentStudents]);
  const checkedOut = useMemo(() => recentStudents.filter((student) => student.attendanceStatus === "checked_out").length, [recentStudents]);

  return (
    <FlatList
      data={recentStudents.slice(0, 5)}
      keyExtractor={(item) => item.registrationId}
      ListHeaderComponent={
        <View style={{ gap: 16, paddingHorizontal: 16, paddingBottom: 10 }}>
          <AppHeader
            icon="account-tie"
            title={`Welcome, ${account?.name ?? "Volunteer"}`}
            subtitle="Monitor check-ins, scan badges, and keep attendance moving even when the network drops."
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatCard label="Recent students" value={recentStudents.length} icon="account-group-outline" />
            <StatCard label="Pending sync" value={pendingCount} icon="cloud-sync-outline" accent={colors.warning} />
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatCard label="Checked in" value={checkedIn} icon="login" />
            <StatCard label="Checked out" value={checkedOut} icon="logout" accent={colors.accent2} />
          </View>

          <Panel style={{ padding: 16, gap: 12 }}>
            <SectionTitle title="Quick actions" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Scan badge" icon="qrcode-scan" onPress={() => router.push("/(tabs)/scan")} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Search student" icon="account-search" onPress={() => router.push("/(tabs)/search")} variant="ghost" />
              </View>
            </View>
          </Panel>

          <SectionTitle title="Recent activity" />
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <StudentCard student={item} onPress={() => router.push(`/student/${encodeURIComponent(item.registrationId)}`)} />
        </View>
      )}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <EmptyState title="No students cached yet" description="Search or scan a student to populate the local dashboard cache." />
        </View>
      }
      ListFooterComponent={
        <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
          <SectionTitle title="Latest attendance logs" />
          {attendanceEvents.slice(0, 3).map((event) => (
            <Panel key={event.id} style={{ padding: 14, gap: 4 }}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>{event.studentName}</Text>
              <Text style={{ color: colors.muted, fontSize: 13 }}>
                {event.registrationId} • {event.eventName}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {event.action.toUpperCase()} via {event.method.toUpperCase()} • {shortDateTime(event.createdAt)}
              </Text>
            </Panel>
          ))}
        </View>
      }
    />
  );
}
