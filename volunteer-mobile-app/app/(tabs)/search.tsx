import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, Text, View } from "react-native";
import { AppHeader, Badge, EmptyState, Input, Panel, SectionTitle, colors } from "../../src/components/ui";
import { useAuth } from "../../src/context/auth-context";
import { useCache } from "../../src/context/cache-context";
import { api } from "../../src/lib/api";
import { shortDateTime } from "../../src/lib/format";
import type { StudentRecord, StudentSearchField } from "../../src/lib/types";

const fields: Array<{ value: StudentSearchField; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = [
  { value: "all", label: "All", icon: "magnify" },
  { value: "registrationId", label: "Registration ID", icon: "identifier" },
  { value: "rollNumber", label: "Roll number", icon: "card-account-details-outline" },
  { value: "phone", label: "Phone", icon: "phone-outline" },
  { value: "college", label: "College", icon: "school-outline" },
  { value: "name", label: "Student name", icon: "account-outline" },
  { value: "code", label: "QR / Barcode", icon: "qrcode-scan" }
];

export default function SearchScreen() {
  const { accessToken } = useAuth();
  const { cacheStudent } = useCache();
  const [query, setQuery] = useState("");
  const [field, setField] = useState<StudentSearchField>("all");
  const [results, setResults] = useState<StudentRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const search = useCallback(async (targetPage: number, append: boolean) => {
    const value = query.trim();
    if (!value || !accessToken) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const response = await api.searchStudents(accessToken, value, field, targetPage, 20);
      if (currentRequest !== requestId.current) return;
      setResults(current => append ? [...current, ...response.items.filter(item => !current.some(existing => existing.registrationId === item.registrationId))] : response.items);
      setPage(response.page);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch {
      if (!append) { setResults([]); setTotal(0); setTotalPages(0); }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [accessToken, field, query]);

  useEffect(() => {
    requestId.current += 1;
    setResults([]);
    setPage(1);
    setTotal(0);
    setTotalPages(0);
    const value = query.trim();
    if (!value || !accessToken) { setLoading(false); return; }
    const timer = setTimeout(() => void search(1, false), 250);
    return () => clearTimeout(timer);
  }, [accessToken, field, query, search]);

  const openStudent = async (student: StudentRecord) => {
    await cacheStudent(student);
    router.push(`/student/${encodeURIComponent(student.registrationId)}`);
  };

  return <FlatList
    data={results}
    keyExtractor={item => item.registrationId}
    contentContainerStyle={{ width: "100%", maxWidth: 920, alignSelf: "center", paddingBottom: 28 }}
    keyboardShouldPersistTaps="handled"
    onEndReachedThreshold={0.35}
    onEndReached={() => { if (!loading && page < totalPages) void search(page + 1, true); }}
    ListHeaderComponent={<View style={{ gap: 16, paddingHorizontal: 16, paddingBottom: 12 }}>
      <AppHeader icon="account-search" title="Student Search" subtitle="Fast lookup by identity, college, phone, QR code, or barcode." />
      <Panel style={{ padding: 16, gap: 13 }}>
        <Input value={query} onChangeText={setQuery} placeholder="Type to search students" icon="magnify" autoCapitalize="none" autoCorrect={false} />
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "800" }}>SEARCH BY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {fields.map(option => <Pressable key={option.value} onPress={() => setField(option.value)} style={{ flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: field === option.value ? colors.accent : "#334155" }}><MaterialCommunityIcons name={option.icon} size={15} color={field === option.value ? colors.ink : colors.textSecondary}/><Text style={{ color: field === option.value ? colors.ink : colors.text, fontSize: 12, fontWeight: "800" }}>{option.label}</Text></Pressable>)}
        </ScrollView>
      </Panel>
      <SectionTitle title={query.trim() ? `${total} result${total === 1 ? "" : "s"}` : "Search results"} />
    </View>}
    renderItem={({ item }) => <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}><Pressable onPress={() => void openStudent(item)}><Panel style={{ padding: 14, gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {item.selfie?.url ? <Image source={{ uri: item.selfie.url }} style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: "#334155" }} /> : <View style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: "#334155", alignItems: "center", justifyContent: "center" }}><MaterialCommunityIcons name="account" size={30} color={colors.muted}/></View>}
        <View style={{ flex: 1, gap: 3 }}><Text style={{ color: colors.text, fontSize: 17, fontWeight: "900" }}>{item.studentName}</Text><Text style={{ color: colors.accent, fontSize: 12, fontWeight: "800" }}>{item.registrationId}</Text><Text style={{ color: colors.muted, fontSize: 12 }}>{item.rollNumber} · {item.phone}</Text></View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted}/>
      </View>
      <View style={{ gap: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(148,163,184,.22)" }}><Text style={{ color: colors.textSecondary, fontSize: 13 }}><Text style={{ fontWeight: "800" }}>College: </Text>{item.collegeName}</Text><Text style={{ color: colors.textSecondary, fontSize: 13 }}><Text style={{ fontWeight: "800" }}>Department: </Text>{item.departmentName}</Text><Text style={{ color: colors.textSecondary, fontSize: 13 }}><Text style={{ fontWeight: "800" }}>Venue: </Text>{item.venue}</Text></View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}><Badge label={item.verificationStatus} tone={item.verificationStatus === "approved" ? "accent" : item.verificationStatus === "rejected" ? "danger" : "warning"}/><Badge label={item.attendanceStatus} tone={item.attendanceStatus === "checked_in" ? "accent" : "muted"}/></View>
      <View style={{ flexDirection: "row", gap: 10 }}><View style={{ flex: 1, borderRadius: 12, backgroundColor: "#0f172a", padding: 10 }}><Text style={{ color: colors.muted, fontSize: 10, fontWeight: "800" }}>ENTRY</Text><Text style={{ color: item.entryTime ? colors.accent : colors.muted, fontSize: 12, marginTop: 4 }}>{item.entryTime ? shortDateTime(item.entryTime) : "Not entered"}</Text></View><View style={{ flex: 1, borderRadius: 12, backgroundColor: "#0f172a", padding: 10 }}><Text style={{ color: colors.muted, fontSize: 10, fontWeight: "800" }}>EXIT</Text><Text style={{ color: item.exitTime ? colors.warning : colors.muted, fontSize: 12, marginTop: 4 }}>{item.exitTime ? shortDateTime(item.exitTime) : "Not exited"}</Text></View></View>
    </Panel></Pressable></View>}
    ListEmptyComponent={<View style={{ paddingHorizontal: 16 }}>{loading ? <View style={{ padding: 30, alignItems: "center", gap: 10 }}><ActivityIndicator color={colors.accent}/><Text style={{ color: colors.muted }}>Searching…</Text></View> : <EmptyState title={query.trim() ? "No students found" : "Start searching"} description={query.trim() ? "Try another field or check the search value." : "Search by registration ID, roll number, phone, college, student name, QR code, or barcode."}/>}</View>}
    ListFooterComponent={results.length && loading ? <View style={{ padding: 18 }}><ActivityIndicator color={colors.accent}/></View> : null}
  />;
}
