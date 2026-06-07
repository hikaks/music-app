import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { createPlaylist, listPlaylists, type PlaylistRecord } from "@/lib/harmonix-data";
import { Button, EmptyState, Field, Notice, ScreenHeader } from "@/ui/primitives";
import { colors, radii, spacing, typography } from "@/theme/tokens";

export default function PlaylistsScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      setPlaylists(await listPlaylists());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load playlists.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleCreate() {
    setError(null);
    setIsCreating(true);

    try {
      const playlist = await createPlaylist({
        name,
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      setPlaylists((current) => [playlist, ...current]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create playlist.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.accent} />}
      style={styles.scroll}
    >
      <ScreenHeader eyebrow="Queue" title="Playlists" body="Create and manage local playlists." />
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <View style={styles.form}>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Description" value={description} onChangeText={setDescription} multiline />
        <Button
          label="Create playlist"
          onPress={handleCreate}
          loading={isCreating}
          disabled={!name.trim()}
        />
      </View>
      {playlists.length ? (
        <View style={styles.list}>
          {playlists.map((playlist) => (
            <View key={playlist.id} style={styles.row}>
              <Text style={styles.rowTitle}>{playlist.name}</Text>
              <Text style={styles.rowBody}>{playlist.description || "No description"}</Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyState title="No playlists" body="New playlists appear here." />
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
  form: {
    gap: spacing.lg,
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
  rowBody: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
  },
});
