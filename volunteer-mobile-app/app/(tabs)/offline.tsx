import { Alert, FlatList, Text, View } from "react-native";
import { AppHeader, EmptyState, Panel, PrimaryButton, SectionTitle, Badge, colors } from "../../src/components/ui";
import { useAuth } from "../../src/context/auth-context";
import { useCache } from "../../src/context/cache-context";
import { shortDateTime } from "../../src/lib/format";

export default function OfflineScreen() {
  const { logout } = useAuth();
  const { recentStudents, attendanceEvents, pendingCount, clearCache } = useCache();

  const confirmClear = () => {
    Alert.alert("Clear offline data", "Remove cached students and local attendance events from this device?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          void clearCache();
        }
      }
    ]);
  };

  return (
    <FlatList
      data={attendanceEvents}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={{ gap: 16, paddingHorizontal: 16, paddingBottom: 10 }}>
          <AppHeader icon="cloud-off-outline" title="Offline cache" subtitle="See what is stored locally on this device and manage the cached check-in trail." />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Panel style={{ flex: 1, padding: 14, gap: 4 }}>
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>{recentStudents.length}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Cached students</Text>
            </Panel>
            <Panel style={{ flex: 1, padding: 14, gap: 4 }}>
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>{pendingCount}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Pending sync</Text>
            </Panel>
          </View>
          <SectionTitle title="Controls" />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Clear cache" icon="trash-can-outline" onPress={confirmClear} variant="danger" />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Sign out" icon="logout" onPress={() => void logout()} variant="ghost" />
            </View>
          </View>
          <SectionTitle title="Stored activity" />
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Panel style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>{item.studentName}</Text>
              <Badge label={item.synced ? "synced" : "local"} tone={item.synced ? "accent" : "warning"} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{item.registrationId} • {item.eventName}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{shortDateTime(item.createdAt)}</Text>
          </Panel>
        </View>
      )}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 16 }}>
          <EmptyState title="Nothing cached yet" description="Search or scan a student to build local offline history." />
        </View>
      }
    />
  );
}
