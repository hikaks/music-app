import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { LogOut, Save, Server } from "lucide-react-native";
import { useAuth } from "@/auth/auth-context";
import {
  ensureSourceConfigs,
  getOrCreateProfile,
  updateProfile,
  type ProfileRecord,
  updateSourceConfig,
  type SourceConfigRecord,
} from "@/lib/harmonix-data";
import { INSFORGE_URL } from "@/lib/insforge";
import { Button, Field, Notice, ScreenHeader } from "@/ui/primitives";
import { BrandMark, SectionHeader } from "@/ui/music";
import { colors, radii, spacing, typography } from "@/theme/tokens";

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [sources, setSources] = useState<SourceConfigRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      if (!user) {
        return;
      }

      setError(null);
      setIsProfileLoading(true);

      try {
        const [nextProfile, nextSources] = await Promise.all([
          getOrCreateProfile(user),
          ensureSourceConfigs(),
        ]);

        if (mounted) {
          setProfile(nextProfile);
          setDisplayName(nextProfile.display_name ?? "");
          setBio(nextProfile.bio ?? "");
          setSources(nextSources);
        }
      } catch (nextError) {
        if (mounted) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load source settings.");
        }
      } finally {
        if (mounted) {
          setIsProfileLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleSaveProfile() {
    if (!user) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSavingProfile(true);

    try {
      const updated = await updateProfile(user.id, { displayName, bio });
      setProfile(updated);
      setDisplayName(updated.display_name ?? "");
      setBio(updated.bio ?? "");
      setSuccess("Profile saved.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleToggle(source: SourceConfigRecord) {
    setError(null);
    setSuccess(null);
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
    setSuccess(null);
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
      <View style={styles.accountHero}>
        <BrandMark size={54} />
        <View style={styles.accountCopy}>
          <ScreenHeader
            eyebrow="Account"
            title="Settings"
            body={profile?.display_name || user?.email || "Signed in"}
          />
        </View>
      </View>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {success ? <Notice tone="success">{success}</Notice> : null}
      <View style={styles.panel}>
        <View style={styles.panelTop}>
          <Server color={colors.cyan} size={20} strokeWidth={2.4} />
          <Text style={styles.panelLabel}>Backend</Text>
        </View>
        <Text style={styles.panelValue} numberOfLines={1}>
          {INSFORGE_URL}
        </Text>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Profile" />
        <View style={styles.form}>
          <Field
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!isProfileLoading && !isSavingProfile}
          />
          <Field
            label="Bio"
            value={bio}
            onChangeText={setBio}
            editable={!isProfileLoading && !isSavingProfile}
            multiline
            numberOfLines={3}
          />
          <Button
            label="Save profile"
            onPress={handleSaveProfile}
            loading={isSavingProfile}
            disabled={isProfileLoading}
            icon={<Save color={colors.accentText} size={18} strokeWidth={2.5} />}
          />
        </View>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Sources" />
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
      <Button
        label="Sign out"
        variant="danger"
        onPress={handleSignOut}
        loading={isSigningOut}
        icon={<LogOut color={colors.danger} size={18} strokeWidth={2.5} />}
      />
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
    paddingTop: spacing.xxl,
    paddingBottom: 150,
  },
  accountHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  accountCopy: {
    flex: 1,
    minWidth: 0,
  },
  panel: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  panelTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
  form: {
    gap: spacing.lg,
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
