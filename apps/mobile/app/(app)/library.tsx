import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { listPlaylists, type PlaylistRecord } from "@/lib/harmonix-data";
import { EmptyState, Notice, ScreenHeader } from "@/ui/primitives";
import { CoverArt, MusicCard, SectionHeader, coverPalettes } from "@/ui/music";
import { colors, radii, spacing, typography } from "@/theme/tokens";

const collections = [
  { title: "Liked Songs", subtitle: "Private collection", palette: coverPalettes[1] },
  { title: "Downloaded", subtitle: "Available offline", palette: coverPalettes[3] },
  { title: "Recently Played", subtitle: "Listening history", palette: coverPalettes[2] },
];

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
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader eyebrow="Collection" title="Library" body="Albums, playlists, and listening activity." />
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <View style={styles.featuredCollection}>
        <CoverArt title="Harmonix Library" palette={coverPalettes[4]} size={96} />
        <View style={styles.featuredCopy}>
          <Text style={styles.featuredLabel}>Unified Library</Text>
          <Text style={styles.featuredTitle}>All sources in one place</Text>
          <Text style={styles.featuredMeta}>{playlists.length} playlists synced</Text>
        </View>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Collections" />
        <View style={styles.collectionGrid}>
          {collections.map((item) => (
            <View key={item.title} style={styles.collectionCard}>
              <CoverArt title={item.title} palette={item.palette} size={58} />
              <View style={styles.collectionText}>
                <Text style={styles.collectionTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.collectionSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Playlists" action={playlists.length ? "Updated" : undefined} />
        {playlists.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRail}>
            {playlists.map((playlist, index) => (
              <MusicCard
                key={playlist.id}
                title={playlist.name}
                subtitle={playlist.description || "Harmonix playlist"}
                meta={playlist.source}
                palette={coverPalettes[index % coverPalettes.length]}
              />
            ))}
          </ScrollView>
        ) : (
          <EmptyState title="No playlists yet" body="Start with a mix, a mood, or a source." />
        )}
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
  section: {
    gap: spacing.md,
  },
  featuredCollection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    borderRadius: radii.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  featuredCopy: {
    flex: 1,
    minWidth: 0,
  },
  featuredLabel: {
    color: colors.violet,
    fontSize: typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  featuredTitle: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.sectionTitle,
    fontWeight: "900",
  },
  featuredMeta: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.small,
  },
  collectionGrid: {
    gap: spacing.md,
  },
  collectionCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceSoft,
  },
  collectionText: {
    flex: 1,
    minWidth: 0,
  },
  collectionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900",
  },
  collectionSubtitle: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.small,
  },
  cardRail: {
    gap: spacing.lg,
    paddingRight: spacing.xl,
  },
});
