import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export const colors = {
  ink: "#0b1220",
  panel: "rgba(11, 18, 32, 0.82)",
  panelLight: "rgba(255, 255, 255, 0.82)",
  accent: "#22c55e",
  accent2: "#7c3aed",
  warning: "#f59e0b",
  danger: "#ef4444",
  text: "#e5eefb",
  muted: "#8da3c7"
};

export const Shell = ({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) => {
  const insets = useSafeAreaInsets();
  const content = (
    <View style={[styles.shell, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.backdrop}>
        <View style={styles.glowA} />
        <View style={styles.glowB} />
      </View>
      {children}
    </View>
  );

  if (!scroll) {
    return <SafeAreaView style={styles.root}>{content}</SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{content}</ScrollView>
    </SafeAreaView>
  );
};

export const AppHeader = ({ title, subtitle, icon }: { title: string; subtitle: string; icon?: keyof typeof MaterialCommunityIcons.glyphMap }) => (
  <View style={styles.header}>
    <BlurView intensity={25} tint="dark" style={styles.headerGlass}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name={icon ?? "shield-account"} size={20} color={colors.ink} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Volunteer mobile</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </BlurView>
  </View>
);

export const Panel = ({ children, style }: { children: ReactNode; style?: object }) => (
  <BlurView intensity={24} tint="dark" style={[styles.panel, style]}>
    {children}
  </BlurView>
);

export const PrimaryButton = ({
  label,
  icon,
  onPress,
  variant = "primary",
  disabled = false
}: {
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) => {
  const bg =
    variant === "danger"
      ? [colors.danger, "#b91c1c"]
      : variant === "ghost"
        ? ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.06)"]
        : [colors.accent, "#16a34a"];

  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, pressed && !disabled ? { transform: [{ scale: 0.98 }] } : null, disabled && { opacity: 0.55 }]}>
      <LinearGradient colors={bg} style={styles.buttonFill}>
        {icon ? <MaterialCommunityIcons name={icon} size={18} color="#fff" /> : null}
        <Text style={styles.buttonText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
};

export const Input = (props: React.ComponentProps<typeof TextInput> & { icon?: keyof typeof MaterialCommunityIcons.glyphMap }) => (
  <View style={styles.inputWrap}>
    {props.icon ? <MaterialCommunityIcons name={props.icon} size={18} color={colors.muted} style={styles.inputIcon} /> : null}
    <TextInput
      placeholderTextColor="rgba(141, 163, 199, 0.7)"
      {...props}
      style={[styles.input, props.style]}
    />
  </View>
);

export const StatCard = ({
  label,
  value,
  icon,
  accent = colors.accent
}: {
  label: string;
  value: string | number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent?: string;
}) => (
  <Panel style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: accent }]}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.ink} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Panel>
);

export const Badge = ({
  label,
  tone = "accent"
}: {
  label: string;
  tone?: "accent" | "warning" | "danger" | "muted";
}) => {
  const palette = {
    accent: { bg: "rgba(34, 197, 94, 0.15)", fg: "#86efac" },
    warning: { bg: "rgba(245, 158, 11, 0.15)", fg: "#fcd34d" },
    danger: { bg: "rgba(239, 68, 68, 0.15)", fg: "#fca5a5" },
    muted: { bg: "rgba(141, 163, 199, 0.15)", fg: "#bfd0ea" }
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
};

export const EmptyState = ({
  title,
  description,
  icon = "database-off-outline"
}: {
  title: string;
  description: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) => (
  <Panel style={styles.empty}>
    <MaterialCommunityIcons name={icon} size={26} color={colors.muted} />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyDescription}>{description}</Text>
  </Panel>
);

export const LoadingState = ({ label = "Loading..." }: { label?: string }) => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={styles.loadingText}>{label}</Text>
  </View>
);

export const SectionTitle = ({ title, action }: { title: string; action?: ReactNode }) => (
  <View style={styles.sectionTitleRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action}
  </View>
);

export const StudentCard = ({
  student,
  onPress
}: {
  student: {
    registrationId: string;
    studentName: string;
    eventName: string;
    verificationStatus: string;
    attendanceStatus: string;
    venue: string;
  };
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.studentCard, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}>
    <Text style={styles.studentName}>{student.studentName}</Text>
    <Text style={styles.studentMeta}>{student.registrationId} • {student.eventName}</Text>
    <Text style={styles.studentMeta}>{student.venue}</Text>
    <View style={styles.studentRow}>
      <Badge label={student.verificationStatus} tone={student.verificationStatus === "approved" ? "accent" : student.verificationStatus === "rejected" ? "danger" : "warning"} />
      <Badge label={student.attendanceStatus} tone={student.attendanceStatus === "checked_in" ? "accent" : student.attendanceStatus === "checked_out" ? "muted" : "warning"} />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink
  },
  shell: {
    flexGrow: 1,
    paddingHorizontal: 16,
    gap: 16
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden"
  },
  glowA: {
    position: "absolute",
    top: -100,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: "rgba(34,197,94,0.18)"
  },
  glowB: {
    position: "absolute",
    top: 120,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(124,58,237,0.14)"
  },
  header: {
    marginBottom: 4
  },
  headerGlass: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 14
  },
  headerRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start"
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent
  },
  headerText: {
    flex: 1
  },
  kicker: {
    color: "#9fb5d8",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 10,
    fontWeight: "700"
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 6
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6
  },
  panel: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: colors.panel
  },
  statCard: {
    flex: 1,
    padding: 14,
    gap: 8,
    minHeight: 120
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  statValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800"
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  button: {
    borderRadius: 18,
    overflow: "hidden"
  },
  buttonFill: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800"
  },
  inputWrap: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center"
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingVertical: 12
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start"
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7
  },
  empty: {
    alignItems: "center",
    padding: 22,
    gap: 8
  },
  emptyTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16
  },
  emptyDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center"
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14
  },
  loadingText: {
    color: colors.muted,
    fontWeight: "700"
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800"
  },
  studentCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 6
  },
  studentName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800"
  },
  studentMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  studentRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap"
  }
});
