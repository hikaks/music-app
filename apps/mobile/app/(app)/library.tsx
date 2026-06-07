import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { listPlaylists, type PlaylistRecord } from "@/lib/harmonix-data";
import { EmptyState, Notice, ScreenHeader } from "@/ui/primitives";
import { colors, radii, spacing, typography } from "@/theme/tokens";

export default function LibraryScreen() {
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setIsRefreshing(true);

    try {
      setPlaylists(await listPlaylists());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load library.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={load} tintColor={colors.accent} />}
      style={styles.scroll}
    >
      <ScreenHeader eyebrow="Collection" title="Library" body="Saved playlists and listening history." />
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {playlists.length ? (
        <View style={styles.list}>
          {playlists.map((playlist) => (
            <View key={playlist.id} style={styles.row}>
              <Text style={styles.rowTitle}>{playlist.name}</Text>
              <Text style={styles.rowMeta}>{playlist.source}</Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState title="Library is empty" body="Create a playlist to start filling this view." />
      )}
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
  list: {
    gap: spacing.md,
  },
  row: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  rowMeta: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.small,
    textTransform: "uppercase",
  },
});
