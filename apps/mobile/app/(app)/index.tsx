import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/auth-context";
import { getOrCreateProfile, runRlsSmokeTest, type ProfileRecord } from "@/lib/harmonix-data";
import { Button, Notice, Screen, ScreenHeader } from "@/ui/primitives";
import { colors, radii, spacing, typography } from "@/theme/tokens";

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
    <Screen>
      <ScreenHeader
        eyebrow="Harmonix"
        title={profile?.display_name ?? "Home"}
        body="Your mobile library starts here."
      />
      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {message ? <Notice tone="success">{message}</Notice> : null}
      <View style={styles.metrics}>
        <Metric label="Backend" value="InsForge" />
        <Metric label="Auth" value={user?.email ?? "Signed in"} />
        <Metric label="Library" value="Ready" />
      </View>
      <Button label="Run database check" onPress={handleSmokeTest} loading={isChecking} />
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metrics: {
    gap: spacing.md,
  },
  metric: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricValue: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
});
