import { Tabs } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors } from "../../src/components/ui";

const tabIcon = (name: keyof typeof MaterialCommunityIcons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) => <MaterialCommunityIcons name={name} size={size} color={color} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "#8da3c7",
        tabBarStyle: {
          backgroundColor: "#0b1220",
          borderTopColor: "rgba(255,255,255,0.08)",
          paddingTop: 6,
          height: 68
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700"
        }
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Home", tabBarIcon: tabIcon("view-dashboard-outline") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: tabIcon("account-search-outline") }} />
      <Tabs.Screen name="scan" options={{ title: "Scan", tabBarIcon: tabIcon("qrcode-scan") }} />
      <Tabs.Screen name="attendance" options={{ title: "Attendance", tabBarIcon: tabIcon("clipboard-check-outline") }} />
      <Tabs.Screen name="offline" options={{ title: "Offline", tabBarIcon: tabIcon("cloud-off-outline") }} />
    </Tabs>
  );
}
