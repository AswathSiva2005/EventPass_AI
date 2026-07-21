import { router } from "expo-router";
import { useDeferredValue, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { AppHeader, EmptyState, Input, Panel, PrimaryButton, SectionTitle, StudentCard } from "../../src/components/ui";
import { useAuth } from "../../src/context/auth-context";
import { useCache } from "../../src/context/cache-context";
import { normalizeRegistrationId } from "../../src/lib/format";

export default function SearchScreen() {
  const { loadStudent } = useAuth();
  const { cacheStudent, findStudents } = useCache();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const results = findStudents(deferredQuery);

  const searchExact = async () => {
    const registrationId = normalizeRegistrationId(query);
    if (!registrationId) {
      Alert.alert("Search required", "Type a registration ID first.");
      return;
    }

    try {
      setSearching(true);
      const student = await loadStudent(registrationId);
      await cacheStudent(student);
      router.push(`/student/${encodeURIComponent(student.registrationId)}`);
    } catch (error) {
      Alert.alert("Student not found", error instanceof Error ? error.message : "Unable to load the student.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.registrationId}
      ListHeaderComponent={
        <View style={{ gap: 16, paddingHorizontal: 16, paddingBottom: 10 }}>
          <AppHeader
            icon="account-search"
            title="Search Student"
            subtitle="Look up a student by registration ID or search the local cache by name, event, or venue."
          />

          <Panel style={{ padding: 16, gap: 12 }}>
            <Input value={query} onChangeText={setQuery} placeholder="Enter registration ID or name" icon="magnify" autoCapitalize="characters" />
            <PrimaryButton label={searching ? "Searching..." : "Fetch exact record"} icon="database-search" onPress={() => void searchExact()} disabled={searching} />
          </Panel>

          <SectionTitle title="Cached matches" />
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <StudentCard student={item} onPress={() => router.push(`/student/${encodeURIComponent(item.registrationId)}`)} />
        </View>
      )}
      ListEmptyComponent={
        query.trim() ? (
          <View style={{ paddingHorizontal: 16 }}>
            <EmptyState title="No matches yet" description="Try the full registration ID or scan the code instead." />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            <EmptyState title="Start typing" description="Search results will appear from the local cache as you type." />
          </View>
        )
      }
    />
  );
}
