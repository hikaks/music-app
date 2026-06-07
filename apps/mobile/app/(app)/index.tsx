import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { DatabaseZap, Play } from "lucide-react-native";
import { useAuth } from "@/auth/auth-context";
import { getOrCreateProfile, runRlsSmokeTest, type ProfileRecord } from "@/lib/harmonix-data";
import { Button, Notice } from "@/ui/primitives";
import { CoverArt, SectionHeader, SourcePill, TrackRow, coverPalettes } from "@/ui/music";
import { colors, radii, spacing, typography } from "@/theme/tokens";

const jumpBackIn = [
  { title: "Velvet Static", artist: "Nova Lane", source: "local", palette: coverPalettes[1] },
  { title: "Signal Bloom", artist: "Ari North", source: "audius", palette: coverPalettes[2] },
  { title: "Late City Lights", artist: "Mira Vale", source: "jamendo", palette: coverPalettes[3] },
];

const sourcePills = ["Local", "Audius", "Jamendo", "Deezer"];

export default function HomeScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!user) {
      return;
    }

    getOrCreateProfile(user)
      .then((nextProfile) => {
        if (mounted) {
          setProfile(nextProfile);
        }
      })
      .catch((nextError) => {
        if (mounted) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load profile.");
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleSmokeTest() {
    if (!user) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsChecking(true);

    try {
      await runRlsSmokeTest(user);
      setMessage("Database access verified for this account.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Database check failed.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Harmonix</Text>
        <Text style={styles.title}>{profile?.display_name ? `For ${profile.display_name}` : "For you"}</Text>
      </View>
      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}
      <View style={styles.hero}>
        <CoverArt title="Harmonix Daily" palette={coverPalettes[4]} size={118} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroLabel}>Daily Mix</Text>
          <Text style={styles.heroTitle}>Fresh picks from every source</Text>
          <Text style={styles.heroBody} numberOfLines={2}>
            Local files, open catalogs, and connected services in one queue.
          </Text>
          <Button
            label="Play mix"
            size="sm"
            onPress={() => undefined}
            icon={<Play color={colors.accentText} size={16} fill={colors.accentText} strokeWidth={2.4} />}
          />
        </View>
      </View>
      <View style={styles.pills}>
        {sourcePills.map((source, index) => (
          <SourcePill key={source} label={source} active={index === 0} />
        ))}
      </View>
      <View style={styles.section}>
        <SectionHeader title="Jump back in" action="Library" />
        <View style={styles.trackList}>
          {jumpBackIn.map((track) => (
            <TrackRow
              key={track.title}
              title={track.title}
              artist={track.artist}
              source={track.source}
              palette={track.palette}
            />
          ))}
        </View>
      </View>
      <View style={styles.checkPanel}>
        <View style={styles.checkIcon}>
          <DatabaseZap color={colors.accent} size={22} strokeWidth={2.4} />
        </View>
        <View style={styles.checkCopy}>
          <Text style={styles.checkTitle}>Account sync</Text>
          <Text style={styles.checkBody} numberOfLines={1}>
            {user?.email ?? "Signed in"}
          </Text>
        </View>
        <Button label="Check" variant="secondary" size="sm" onPress={handleSmokeTest} loading={isChecking} />
      </View>
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
  header: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: typography.hero,
    fontWeight: "900",
    letterSpacing: 0,
  },
  hero: {
    flexDirection: "row",
    gap: spacing.lg,
    borderRadius: radii.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
  },
  heroLabel: {
    color: colors.rose,
    fontSize: typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle,
    fontWeight: "900",
    lineHeight: 24,
  },
  heroBody: {
    color: colors.subtle,
    fontSize: typography.small,
    lineHeight: 19,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  trackList: {
    gap: spacing.sm,
  },
  checkPanel: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSoft,
  },
  checkIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
  },
  checkCopy: {
    flex: 1,
    minWidth: 0,
  },
  checkTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900",
  },
  checkBody: {
    color: colors.muted,
    fontSize: typography.small,
  },
});
