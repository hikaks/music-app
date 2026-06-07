import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "@/lib/api";
import { sourcePreviewLabels } from "@/theme/tokens";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.eyebrow}>Harmonix Mobile</Text>
      <Text style={styles.title}>Phase 0 scaffold is ready.</Text>
      <Text style={styles.body}>
        Mobile shell, API placeholder, and shared music types are wired for the next phase.
      </Text>
      <View style={styles.panel}>
        <Text style={styles.panelLabel}>API</Text>
        <Text style={styles.panelValue}>{API_BASE_URL}</Text>
      </View>
      <View style={styles.sources}>
        {sourcePreviewLabels.map((source) => (
          <View key={source} style={styles.sourcePill}>
            <Text style={styles.sourceText}>{source}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#09090b",
  },
  eyebrow: {
    marginBottom: 12,
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    maxWidth: 320,
    color: "#fafafa",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0,
  },
  body: {
    maxWidth: 340,
    marginTop: 14,
    color: "#d4d4d8",
    fontSize: 16,
    lineHeight: 24,
  },
  panel: {
    marginTop: 28,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#3f3f46",
    borderRadius: 8,
    backgroundColor: "#18181b",
  },
  panelLabel: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  panelValue: {
    marginTop: 6,
    color: "#fafafa",
    fontSize: 14,
  },
  sources: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
  },
  sourcePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#27272a",
  },
  sourceText: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "700",
  },
});
