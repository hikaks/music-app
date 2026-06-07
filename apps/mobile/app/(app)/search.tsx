import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, Music2, Plus, Search, SlidersHorizontal } from "lucide-react-native";
import { searchQuerySchema, type Track } from "@harmonix-mobile/shared";
import { ensureSourceConfigs, saveTrackToDefaultPlaylist } from "@/lib/harmonix-data";
import {
  defaultSearchSourceIds,
  normalizeSearchSourceIds,
  searchableSources,
  searchMusic,
  summarizeTrack,
  type MusicSearchResponse,
} from "@/lib/music-search";
import { Notice } from "@/ui/primitives";
import { SectionHeader, TrackRow, coverPalettes } from "@/ui/music";
import { colors, radii, spacing, typography } from "@/theme/tokens";

const browseCards = [
  { title: "Indie Focus", color: colors.rose },
  { title: "Electronic", color: colors.cyan },
  { title: "Acoustic", color: colors.amber },
  { title: "Late Night", color: colors.violet },
];

const suggestedQueries = ["daft punk", "ambient", "lofi", "jazz"];
const configuredSearchSourceIds = new Set<string>(
  searchableSources.filter((source) => !source.needsConfig).map((source) => source.id),
);

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [activeSources, setActiveSources] = useState<string[]>(defaultSearchSourceIds);
  const [results, setResults] = useState<MusicSearchResponse | null>(null);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [savingTrackKey, setSavingTrackKey] = useState<string | null>(null);
  const [savedTrackKeys, setSavedTrackKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const parsed = useMemo(() => searchQuerySchema.safeParse({ q: query, limit: 20 }), [query]);
  const canSearch = parsed.success;
  const searchTitle = useMemo(() => {
    if (!query.trim()) return "Start with a song, artist, or mood";
    return canSearch ? `Results for ${query.trim()}` : "Keep typing";
  }, [canSearch, query]);

  useEffect(() => {
    let mounted = true;

    ensureSourceConfigs()
      .then((configs) => {
        if (!mounted) return;
        const enabled = normalizeSearchSourceIds(
          configs
            .filter((config) => config.enabled && configuredSearchSourceIds.has(config.source))
            .map((config) => config.source),
        );
        setActiveSources(enabled);
      })
      .catch((nextError) => {
        if (mounted) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load source settings.");
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingSources(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!canSearch) {
      setResults(null);
      setIsSearching(false);
      return () => {
        cancelled = true;
      };
    }

    setIsSearching(true);
    setError(null);

    const timeout = setTimeout(() => {
      searchMusic(parsed.data.q, { limit: 18, sourceIds: activeSources })
        .then((nextResults) => {
          if (!cancelled) {
            setResults(nextResults);
          }
        })
        .catch((nextError) => {
          if (!cancelled) {
            setError(nextError instanceof Error ? nextError.message : "Unable to search music.");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [activeSources, canSearch, parsed]);

  function toggleSource(sourceId: string) {
    setActiveSources((current) => {
      if (current.includes(sourceId)) {
        const next = current.filter((id) => id !== sourceId);
        return next.length > 0 ? next : current;
      }

      return normalizeSearchSourceIds([...current, sourceId]);
    });
  }

  async function handleSaveTrack(track: Track) {
    const trackKey = trackKeyFor(track);
    setSavingTrackKey(trackKey);
    setError(null);
    setSaveMessage(null);

    try {
      const { playlist, item } = await saveTrackToDefaultPlaylist(track);
      setSavedTrackKeys((current) => (current.includes(trackKey) ? current : [...current, trackKey]));
      setSaveMessage(item.alreadyExists ? `Already saved in ${playlist.name}.` : `Saved to ${playlist.name}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save track.");
    } finally {
      setSavingTrackKey(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Discover</Text>
        <Text style={styles.title}>Search</Text>
      </View>
      <View style={styles.searchBox}>
        <Search color={colors.muted} size={22} strokeWidth={2.5} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Artists, songs, playlists"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.searchInput}
        />
        <View style={styles.filterButton}>
          <SlidersHorizontal color={colors.subtle} size={20} strokeWidth={2.4} />
        </View>
      </View>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {saveMessage ? <Notice tone="success">{saveMessage}</Notice> : null}
      <View style={styles.sourceRail}>
        {searchableSources.map((source) => {
          const active = activeSources.includes(source.id);
          return (
            <Pressable
              key={source.id}
              accessibilityRole="button"
              disabled={source.needsConfig || isLoadingSources}
              onPress={() => toggleSource(source.id)}
              style={[
                styles.sourceChip,
                active ? styles.sourceChipActive : null,
                source.needsConfig ? styles.sourceChipDisabled : null,
              ]}
            >
              <Text style={[styles.sourceChipText, active ? styles.sourceChipTextActive : null]}>
                {source.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {query.trim() ? (
        <View style={styles.section}>
          <SectionHeader title={searchTitle} action={results ? `${results.tracks.length} tracks` : undefined} />
          {isSearching ? <ActivityIndicator color={colors.accent} /> : null}
          {!isSearching && results?.tracks.length === 0 ? (
            <View style={styles.emptySearch}>
              <Music2 color={colors.muted} size={24} strokeWidth={2.4} />
              <Text style={styles.emptyTitle}>No tracks found</Text>
              <Text style={styles.emptyBody}>Try another query or enable another source.</Text>
            </View>
          ) : null}
          <SearchResultList
            tracks={results?.tracks ?? []}
            savingTrackKey={savingTrackKey}
            savedTrackKeys={savedTrackKeys}
            onSaveTrack={handleSaveTrack}
          />
          {results?.statuses.length ? (
            <View style={styles.statusList}>
              {results.statuses.map((status) => (
                <Text key={status.sourceId} style={[styles.statusText, !status.ok ? styles.statusError : null]}>
                  {status.ok
                    ? `${status.sourceId}: ${status.count}`
                    : `${status.sourceId}: ${status.message ?? "failed"}`}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={styles.section}>
        <SectionHeader title="Browse" />
        <View style={styles.browseGrid}>
          {browseCards.map((card) => (
            <Pressable
              key={card.title}
              accessibilityRole="button"
              onPress={() => setQuery(card.title)}
              style={[styles.browseCard, { backgroundColor: card.color }]}
            >
              <Text style={styles.browseTitle}>{card.title}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Try a search" />
        <View style={styles.suggestions}>
          {suggestedQueries.map((suggestion) => (
            <Pressable
              key={suggestion}
              accessibilityRole="button"
              onPress={() => setQuery(suggestion)}
              style={styles.suggestionChip}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function trackKeyFor(track: Track) {
  return `${track.source}:${track.sourceId}`;
}

function SearchResultList({
  tracks,
  savingTrackKey,
  savedTrackKeys,
  onSaveTrack,
}: {
  tracks: Track[];
  savingTrackKey: string | null;
  savedTrackKeys: string[];
  onSaveTrack: (track: Track) => void;
}) {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <View style={styles.trackList}>
      {tracks.map((track, index) => {
        const summary = summarizeTrack(track);
        const trackKey = trackKeyFor(track);
        const isSaving = savingTrackKey === trackKey;
        const isSaved = savedTrackKeys.includes(trackKey);
        return (
          <TrackRow
            key={`${track.source}:${track.sourceId}:${index}`}
            title={track.title}
            artist={`${summary.artist} - ${summary.duration}`}
            source={String(track.source)}
            artworkUrl={track.artworkUrl}
            palette={coverPalettes[index % coverPalettes.length]}
            trailing={
              <View style={styles.trailingActions}>
                <View style={[styles.playableBadge, !track.isPlayable ? styles.playableBadgeMuted : null]}>
                  <Text style={styles.playableText}>{summary.playableLabel}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isSaved ? "Track saved" : "Save track"}
                  disabled={isSaving || isSaved}
                  onPress={() => onSaveTrack(track)}
                  style={[styles.saveButton, isSaved ? styles.saveButtonSaved : null]}
                >
                  {isSaving ? (
                    <ActivityIndicator color={colors.accentText} size="small" />
                  ) : isSaved ? (
                    <Check color={colors.accentText} size={18} strokeWidth={2.8} />
                  ) : (
                    <Plus color={colors.text} size={18} strokeWidth={2.8} />
                  )}
                </Pressable>
              </View>
            }
          />
        );
      })}
    </View>
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
    color: colors.cyan,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: typography.hero,
    fontWeight: "900",
  },
  searchBox: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  filterButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
  },
  sourceRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sourceChip: {
    minHeight: 34,
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSoft,
  },
  sourceChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  sourceChipDisabled: {
    opacity: 0.45,
  },
  sourceChipText: {
    color: colors.subtle,
    fontSize: typography.small,
    fontWeight: "900",
  },
  sourceChipTextActive: {
    color: colors.accentText,
  },
  section: {
    gap: spacing.md,
  },
  browseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  browseCard: {
    minHeight: 92,
    width: "47%",
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  browseTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900",
  },
  trackList: {
    gap: spacing.sm,
  },
  emptySearch: {
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900",
  },
  emptyBody: {
    color: colors.muted,
    fontSize: typography.small,
  },
  playableBadge: {
    minWidth: 58,
    alignItems: "center",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.accent,
  },
  playableBadgeMuted: {
    backgroundColor: colors.surfaceStrong,
  },
  playableText: {
    color: colors.accentText,
    fontSize: typography.caption,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  trailingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  saveButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceStrong,
  },
  saveButtonSaved: {
    backgroundColor: colors.accent,
  },
  statusList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statusText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  statusError: {
    color: colors.warning,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  suggestionChip: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSoft,
  },
  suggestionText: {
    color: colors.subtle,
    fontSize: typography.small,
    fontWeight: "800",
  },
});
