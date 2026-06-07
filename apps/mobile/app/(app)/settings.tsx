import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/auth/auth-context";
import {
  ensureSourceConfigs,
  updateSourceConfig,
  type SourceConfigRecord,
} from "@/lib/harmonix-data";
import { INSFORGE_URL } from "@/lib/insforge";
import { Button, Notice, ScreenHeader } from "@/ui/primitives";
import { colors, radii, spacing, typography } from "@/theme/tokens";

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const [sources, setSources] = useState<SourceConfigRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    ensureSourceConfigs()
      .then((nextSources) => {
        if (mounted) {
          setSources(nextSources);
        }
      })
      .catch((nextError) => {
        if (mounted) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load source settings.");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleToggle(source: SourceConfigRecord) {
    setError(null);
    setUpdatingId(source.id);

    try {
      const updated = await updateSourceConfig(source.id, !source.enabled);
      setSources((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update source.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSignOut() {
    setError(null);
    setIsSigningOut(true);

    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign out.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
      <ScreenHeader eyebrow="Account" title="Settings" body={user?.email ?? "Signed in"} />
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <View style={styles.panel}>
        <Text style={styles.panelLabel}>Backend</Text>
        <Text style={styles.panelValue}>{INSFORGE_URL}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sources</Text>
        {sources.map((source) => (
          <Pressable
            key={source.id}
            disabled={updatingId === source.id}
            onPress={() => handleToggle(source)}
            style={({ pressed }) => [
              styles.sourceRow,
              source.enabled ? styles.sourceEnabled : null,
              pressed ? styles.sourcePressed : null,
            ]}
          >
            <View>
              <Text style={styles.sourceName}>{source.source}</Text>
              <Text style={styles.sourceMeta}>{source.enabled ? "Enabled" : "Disabled"}</Text>
            </View>
            <View style={[styles.switchTrack, source.enabled ? styles.switchTrackOn : null]}>
              <View style={[styles.switchThumb, source.enabled ? styles.switchThumbOn : null]} />
            </View>
          </Pressable>
        ))}
      </View>
      <Button label="Sign out" variant="danger" onPress={handleSignOut} loading={isSigningOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  panel: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  panelLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  panelValue: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.small,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle,
    fontWeight: "800",
  },
  sourceRow: {
    minHeight: 64,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
  },
  sourceEnabled: {
    borderColor: colors.accent,
  },
  sourcePressed: {
    opacity: 0.85,
  },
  sourceName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  sourceMeta: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.small,
  },
  switchTrack: {
    width: 48,
    height: 28,
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: 3,
  },
  switchTrackOn: {
    backgroundColor: colors.accent,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
  },
  switchThumbOn: {
    alignSelf: "flex-end",
    backgroundColor: colors.accentText,
  },
});
