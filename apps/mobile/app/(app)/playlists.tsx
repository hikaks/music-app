import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react-native";
import {
  createPlaylist,
  deletePlaylist,
  listPlaylists,
  updatePlaylist,
  type PlaylistRecord,
} from "@/lib/harmonix-data";
import { Button, EmptyState, Field, Notice, ScreenHeader } from "@/ui/primitives";
import { CoverArt, SectionHeader, coverPalettes } from "@/ui/music";
import { colors, radii, spacing, typography } from "@/theme/tokens";

export default function PlaylistsScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    setSuccess(null);
    setIsCreating(true);

    try {
      const playlist = await createPlaylist({
        name,
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      setConfirmDeleteId(null);
      setPlaylists((current) => [playlist, ...current]);
      setSuccess("Playlist created.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create playlist.");
    } finally {
      setIsCreating(false);
    }
  }

  function beginEdit(playlist: PlaylistRecord) {
    setError(null);
    setSuccess(null);
    setConfirmDeleteId(null);
    setEditingId(playlist.id);
    setEditName(playlist.name);
    setEditDescription(playlist.description ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  }

  async function handleUpdate(id: string) {
    setError(null);
    setSuccess(null);
    setMutatingId(id);

    try {
      const updated = await updatePlaylist(id, {
        name: editName,
        description: editDescription.trim() || undefined,
      });
      setPlaylists((current) => current.map((playlist) => (playlist.id === id ? updated : playlist)));
      cancelEdit();
      setSuccess("Playlist updated.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update playlist.");
    } finally {
      setMutatingId(null);
    }
  }

  async function handleDelete(playlist: PlaylistRecord) {
    setError(null);
    setSuccess(null);

    if (confirmDeleteId !== playlist.id) {
      setConfirmDeleteId(playlist.id);
      return;
    }

    setMutatingId(playlist.id);

    try {
      await deletePlaylist(playlist.id);
      setPlaylists((current) => current.filter((item) => item.id !== playlist.id));
      setConfirmDeleteId(null);

      if (editingId === playlist.id) {
        cancelEdit();
      }

      setSuccess("Playlist deleted.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to delete playlist.");
    } finally {
      setMutatingId(null);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.accent} />}
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader eyebrow="Queue" title="Playlists" body="Curate mixes for moods, moments, and sources." />
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {success ? <Notice tone="success">{success}</Notice> : null}
      <View style={styles.createPanel}>
        <SectionHeader title="New playlist" />
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Description" value={description} onChangeText={setDescription} multiline />
        <Button
          label="Create playlist"
          onPress={handleCreate}
          loading={isCreating}
          disabled={!name.trim()}
          icon={<Plus color={colors.accentText} size={18} strokeWidth={2.6} />}
        />
      </View>
      {playlists.length ? (
        <View style={styles.list}>
          <SectionHeader title="Your playlists" />
          {playlists.map((playlist, index) => (
            <View key={playlist.id} style={styles.row}>
              {editingId === playlist.id ? (
                <View style={styles.editForm}>
                  <Field label="Name" value={editName} onChangeText={setEditName} />
                  <Field
                    label="Description"
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                  />
                  <View style={styles.actions}>
                    <Button
                      label="Save"
                      onPress={() => handleUpdate(playlist.id)}
                      loading={mutatingId === playlist.id}
                      disabled={!editName.trim()}
                      icon={<Save color={colors.accentText} size={16} strokeWidth={2.5} />}
                    />
                    <Button
                      label="Cancel"
                      variant="secondary"
                      onPress={cancelEdit}
                      icon={<X color={colors.text} size={16} strokeWidth={2.5} />}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.rowTop}>
                    <CoverArt
                      title={playlist.name}
                      palette={coverPalettes[index % coverPalettes.length]}
                      size={72}
                    />
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{playlist.name}</Text>
                      <Text style={styles.rowBody}>{playlist.description || "Harmonix playlist"}</Text>
                      <Text style={styles.rowMeta}>{playlist.visibility}</Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <Button
                      label="Edit"
                      variant="secondary"
                      onPress={() => beginEdit(playlist)}
                      disabled={mutatingId === playlist.id}
                      size="sm"
                      icon={<Pencil color={colors.text} size={15} strokeWidth={2.5} />}
                    />
                    <Button
                      label={confirmDeleteId === playlist.id ? "Confirm delete" : "Delete"}
                      variant="danger"
                      onPress={() => handleDelete(playlist)}
                      loading={mutatingId === playlist.id}
                      size="sm"
                      icon={<Trash2 color={colors.danger} size={15} strokeWidth={2.5} />}
                    />
                  </View>
                </>
              )}
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
    paddingTop: spacing.xxl,
    paddingBottom: 150,
  },
  createPanel: {
    gap: spacing.lg,
    borderRadius: radii.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
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
  rowTop: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900",
  },
  rowBody: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
  },
  rowMeta: {
    marginTop: spacing.md,
    color: colors.accent,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  editForm: {
    gap: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
});
