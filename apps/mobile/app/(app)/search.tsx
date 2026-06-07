import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { searchQuerySchema } from "@harmonix-mobile/shared";
import { EmptyState, Field, Screen, ScreenHeader } from "@/ui/primitives";
import { colors, radii, spacing, typography } from "@/theme/tokens";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const parsed = searchQuerySchema.safeParse({ q: query, limit: 20 });
  const canSearch = parsed.success;

  return (
    <Screen>
      <ScreenHeader eyebrow="Discover" title="Search" body="Find tracks after sources are connected." />
      <Field label="Query" value={query} onChangeText={setQuery} returnKeyType="search" />
      {query ? (
        <View style={styles.resultShell}>
          <Text style={styles.resultTitle}>{canSearch ? query.trim() : "Keep typing"}</Text>
          <Text style={styles.resultBody}>
            {canSearch ? "Search providers will attach here." : "Use at least one non-space character."}
          </Text>
        </View>
      ) : (
        <EmptyState title="No query" body="Local and remote source search will appear here." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  resultShell: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  resultTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle,
    fontWeight: "800",
  },
  resultBody: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.small,
  },
});
