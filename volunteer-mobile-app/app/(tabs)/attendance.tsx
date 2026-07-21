import { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { AppHeader, EmptyState, Panel, SectionTitle, Badge, colors } from "../../src/components/ui";
import { useCache } from "../../src/context/cache-context";
import { shortDateTime } from "../../src/lib/format";

export default function AttendanceScreen() {
  const { attendanceEvents } = useCache();
  const entryCount = useMemo(() => attendanceEvents.filter((event) => event.action === "entry").length, [attendanceEvents]);
  const exitCount = useMemo(() => attendanceEvents.filter((event) => event.action === "exit").length, [attendanceEvents]);

  return (
    <FlatList
      data={attendanceEvents}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={{ gap: 16, paddingHorizontal: 16, paddingBottom: 10 }}>
          <AppHeader icon="clipboard-check" title="Attendance" subtitle="Review the local entry and exit trail recorded on this device." />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Panel style={{ flex: 1, padding: 14, gap: 4 }}>
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>{entryCount}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Entry actions</Text>
            </Panel>
            <Panel style={{ flex: 1, padding: 14, gap: 4 }}>
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>{exitCount}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Exit actions</Text>
            </Panel>
          </View>
          <SectionTitle title="Activity log" />
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Panel style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>{item.studentName}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>{item.registrationId}</Text>
              </View>
              <Badge label={item.action} tone={item.action === "entry" ? "accent" : "warning"} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {item.eventName} - {item.method.toUpperCase()} - {shortDateTime(item.createdAt)}
            </Text>
          </Panel>
        </View>
      )}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: 16 }}>
          <EmptyState title="No attendance activity yet" description="Entry and exit actions will appear here when you scan or open a student record." />
        </View>
      }
    />
  );
}
