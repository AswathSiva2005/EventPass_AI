import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Platform, Pressable, Text, useWindowDimensions, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { AppHeader, EmptyState, Panel, SectionTitle, Badge, colors } from "../../src/components/ui";
import { useCache } from "../../src/context/cache-context";
import { shortDateTime } from "../../src/lib/format";
import { useAuth } from "../../src/context/auth-context";
import { api, apiBaseUrl } from "../../src/lib/api";
import type { ExportEvent } from "../../src/lib/types";

export default function AttendanceScreen() {
  const { attendanceEvents, recentStudents } = useCache();
  const { accessToken } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exportEvents, setExportEvents] = useState<ExportEvent[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const entryCount = useMemo(() => attendanceEvents.filter((event) => event.action === "entry").length, [attendanceEvents]);
  const exitCount = useMemo(() => attendanceEvents.filter((event) => event.action === "exit").length, [attendanceEvents]);
  const activity = useMemo(() => {
    const groups = new Map<string, typeof attendanceEvents>();
    attendanceEvents.forEach((event) => groups.set(event.registrationId, [...(groups.get(event.registrationId) ?? []), event]));
    return [...groups.entries()].map(([registrationId, events]) => ({
      registrationId,
      student: recentStudents.find((item) => item.registrationId === registrationId),
      events: [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      latest: events.reduce((latest, event) => event.createdAt > latest.createdAt ? event : latest)
    })).sort((a, b) => b.latest.createdAt.localeCompare(a.latest.createdAt));
  }, [attendanceEvents, recentStudents]);

  useEffect(() => {
    if (!accessToken) return;
    api.getExportEvents(accessToken).then(setExportEvents).catch(() => setExportEvents([]));
  }, [accessToken, attendanceEvents]);

  const downloadAttendance = async (event: ExportEvent) => {
    if (!accessToken) return;
    const url = `${apiBaseUrl}/students/attendance/export/${encodeURIComponent(event._id)}`;
    const filename = `${event.code.toLowerCase()}-attendance.xlsx`;
    try {
      setDownloadingId(event._id);
      if (Platform.OS === "web") {
        const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!response.ok) throw new Error("Unable to download attendance");
        const objectUrl = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(objectUrl);
      } else {
        const destination = new File(Paths.cache, `${Date.now()}-${filename}`);
        const file = await File.downloadFileAsync(url, destination, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", dialogTitle: `Save ${event.name} attendance` });
        } else {
          Alert.alert("Download complete", `Saved to ${file.uri}`);
        }
      }
    } catch (error) {
      Alert.alert("Download failed", error instanceof Error ? error.message : "Unable to download attendance.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <FlatList
      data={activity}
      keyExtractor={(item) => item.registrationId}
      contentContainerStyle={{ width: "100%", maxWidth: 920, alignSelf: "center", paddingBottom: 24 }}
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
          <Panel style={{ padding: 16, gap: 12 }}>
            <SectionTitle title="Attendance downloads" />
            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>Download your latest attendance spreadsheet at any time.</Text>
            {exportEvents.length === 0 ? <Text style={{ color: colors.muted, fontSize: 13 }}>Record attendance to make an event export available.</Text> : exportEvents.map(event => (
              <View key={event._id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(148,163,184,.22)" }}>
                <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: "800" }}>{event.name}</Text><Text style={{ color: colors.muted, fontSize: 12 }}>{event.code} · Updated attendance export</Text></View>
                <Pressable accessibilityRole="button" accessibilityLabel={`Download ${event.name} attendance`} disabled={downloadingId !== null} onPress={() => void downloadAttendance(event)} style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: downloadingId === event._id ? "rgba(74,222,128,.12)" : colors.accent, opacity: downloadingId !== null && downloadingId !== event._id ? .45 : pressed ? .8 : 1 })}>
                  <MaterialCommunityIcons name={downloadingId === event._id ? "progress-download" : "download"} size={23} color={downloadingId === event._id ? colors.accent : colors.ink} />
                </Pressable>
              </View>
            ))}
          </Panel>
          <SectionTitle title="Activity log" />
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Pressable onPress={() => setExpandedId((current) => current === item.registrationId ? null : item.registrationId)}>
          <Panel style={{ padding: width < 360 ? 12 : 16, gap: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{item.latest.studentName}</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>{item.registrationId}</Text>
              </View>
              <Badge label={item.student?.verificationStatus ?? "pending"} tone={item.student?.verificationStatus === "approved" ? "accent" : item.student?.verificationStatus === "rejected" ? "danger" : "warning"} />
              <MaterialCommunityIcons name={expandedId === item.registrationId ? "chevron-up" : "chevron-down"} size={22} color={colors.textSecondary} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {item.latest.eventName} · {item.events.length} attendance action{item.events.length === 1 ? "" : "s"}
            </Text>
            {expandedId === item.registrationId ? (
              <View style={{ borderTopWidth: 1, borderTopColor: "rgba(148,163,184,.22)", paddingTop: 10, gap: 10 }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  <Badge label={item.student?.attendanceStatus ?? item.latest.action} tone={item.student?.attendanceStatus === "checked_in" ? "accent" : "muted"} />
                  <Badge label={item.events.every((event) => event.synced) ? "synced" : "pending sync"} tone={item.events.every((event) => event.synced) ? "accent" : "warning"} />
                </View>
                {item.events.map((event) => (
                  <View key={event.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}>
                    <MaterialCommunityIcons name={event.action === "entry" ? "login" : "logout"} size={20} color={event.action === "entry" ? colors.accent : colors.warning} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "800", textTransform: "capitalize" }}>{event.action}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{event.method.toUpperCase()} · {shortDateTime(event.createdAt)}</Text>
                    </View>
                    <Text style={{ color: event.synced ? colors.accent : colors.warning, fontSize: 12, fontWeight: "700" }}>{event.synced ? "APPROVED" : "PENDING"}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Panel>
          </Pressable>
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
