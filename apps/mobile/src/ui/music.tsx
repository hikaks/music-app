import type { ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ChevronRight, Heart, Music2, Play, SkipForward, Volume2 } from "lucide-react-native";
import { colors, radii, spacing, typography } from "@/theme/tokens";

export const coverPalettes = [
  ["#1ed760", "#0f5130", "#b7f7c7"],
  ["#ff4f7b", "#6b1232", "#ffd1df"],
  ["#38bdf8", "#0f3e68", "#d7f3ff"],
  ["#fbbf24", "#65420e", "#fff0b3"],
  ["#8b5cf6", "#312061", "#ddd6fe"],
] as const;

type CoverPalette = readonly [string, string, string];

function initialsFor(title: string) {
  const words = title
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) {
    return "HX";
  }

  return words.map((word) => word[0]?.toUpperCase()).join("");
}

export function CoverArt({
  title,
  palette = coverPalettes[0],
  artworkUrl,
  size = 88,
}: {
  title: string;
  palette?: CoverPalette;
  artworkUrl?: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.cover,
        {
          width: size,
          height: size,
          backgroundColor: palette[0],
        },
      ]}
    >
      {artworkUrl ? (
        <Image source={{ uri: artworkUrl }} style={styles.coverImage} />
      ) : (
        <>
          <View style={[styles.coverStripe, { backgroundColor: palette[1] }]} />
          <View style={[styles.coverBlock, { backgroundColor: palette[2] }]} />
          <View style={[styles.coverLine, { backgroundColor: palette[2] }]} />
          <Text style={[styles.coverText, { color: palette[2], fontSize: Math.max(18, size * 0.28) }]}>
            {initialsFor(title)}
          </Text>
        </>
      )}
    </View>
  );
}

export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <View style={[styles.brandMark, { width: size, height: size }]}>
      <Music2 color={colors.accentText} size={Math.max(18, size * 0.48)} strokeWidth={2.8} />
    </View>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <View style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
          <ChevronRight color={colors.muted} size={16} strokeWidth={2.4} />
        </View>
      ) : null}
    </View>
  );
}

export function MusicCard({
  title,
  subtitle,
  meta,
  palette,
  artworkUrl,
  width = 152,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  palette?: CoverPalette;
  artworkUrl?: string;
  width?: number;
}) {
  return (
    <View style={[styles.musicCard, { width }]}>
      <CoverArt title={title} palette={palette} artworkUrl={artworkUrl} size={width} />
      <Text style={styles.musicCardTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.musicCardSubtitle} numberOfLines={1}>
        {subtitle}
      </Text>
      {meta ? <Text style={styles.musicCardMeta}>{meta}</Text> : null}
    </View>
  );
}

export function TrackRow({
  title,
  artist,
  source,
  palette,
  artworkUrl,
  trailing,
}: {
  title: string;
  artist: string;
  source?: string;
  palette?: CoverPalette;
  artworkUrl?: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.trackRow}>
      <CoverArt title={title} palette={palette} artworkUrl={artworkUrl} size={54} />
      <View style={styles.trackText}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {artist}
        </Text>
      </View>
      {source ? <Text style={styles.trackSource}>{source}</Text> : null}
      {trailing}
    </View>
  );
}

export function SourcePill({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <View style={[styles.sourcePill, active ? styles.sourcePillActive : null]}>
      <Volume2 color={active ? colors.accentText : colors.muted} size={14} strokeWidth={2.4} />
      <Text style={[styles.sourcePillText, active ? styles.sourcePillTextActive : null]}>{label}</Text>
    </View>
  );
}

export function MiniPlayer() {
  return (
    <View style={styles.miniPlayer}>
      <CoverArt title="Night Drive" palette={coverPalettes[2]} size={44} />
      <View style={styles.miniText}>
        <Text style={styles.miniTitle} numberOfLines={1}>
          Night Drive
        </Text>
        <Text style={styles.miniSubtitle} numberOfLines={1}>
          Harmonix Preview
        </Text>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>
      <Pressable accessibilityRole="button" style={styles.iconButton} onPress={() => undefined}>
        <Heart color={colors.subtle} size={20} strokeWidth={2.3} />
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.playButton} onPress={() => undefined}>
        <Play color={colors.accentText} size={19} fill={colors.accentText} strokeWidth={2.2} />
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.iconButton} onPress={() => undefined}>
        <SkipForward color={colors.subtle} size={20} strokeWidth={2.3} />
      </Pressable>
    </View>
  );
}

export function AuthStage({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.authContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.authInner}>
        <View style={styles.authBrandRow}>
          <BrandMark />
          <Text style={styles.authBrand}>Harmonix</Text>
        </View>
        <View style={styles.authArtwork}>
          <CoverArt title="Pulse Radio" palette={coverPalettes[1]} size={112} />
          <CoverArt title="Fresh Finds" palette={coverPalettes[3]} size={88} />
          <CoverArt title="After Hours" palette={coverPalettes[4]} size={72} />
        </View>
        <View style={styles.authCopy}>
          <Text style={styles.authTitle}>{title}</Text>
          <Text style={styles.authBody}>{body}</Text>
        </View>
        <View style={styles.authForm}>{children}</View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cover: {
    overflow: "hidden",
    borderRadius: radii.md,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverStripe: {
    position: "absolute",
    top: -14,
    left: -18,
    width: "72%",
    height: "44%",
    transform: [{ rotate: "-18deg" }],
  },
  coverBlock: {
    position: "absolute",
    right: 10,
    bottom: 12,
    width: "38%",
    height: "18%",
    opacity: 0.7,
  },
  coverLine: {
    position: "absolute",
    left: 12,
    bottom: 12,
    width: "44%",
    height: 4,
    opacity: 0.75,
  },
  coverText: {
    position: "absolute",
    left: 12,
    bottom: 18,
    fontWeight: "900",
    letterSpacing: 0,
  },
  brandMark: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.accent,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sectionTitle,
    fontWeight: "900",
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sectionActionText: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: "800",
  },
  musicCard: {
    gap: spacing.sm,
  },
  musicCardTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 20,
  },
  musicCardSubtitle: {
    color: colors.muted,
    fontSize: typography.small,
  },
  musicCardMeta: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  trackRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceSoft,
  },
  trackText: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900",
  },
  trackArtist: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.small,
  },
  trackSource: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  sourcePill: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSoft,
  },
  sourcePillActive: {
    backgroundColor: colors.accent,
  },
  sourcePillText: {
    color: colors.subtle,
    fontSize: typography.small,
    fontWeight: "800",
  },
  sourcePillTextActive: {
    color: colors.accentText,
  },
  miniPlayer: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.canvas,
  },
  miniText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  miniTitle: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "900",
  },
  miniSubtitle: {
    color: colors.muted,
    fontSize: typography.caption,
  },
  progressTrack: {
    height: 3,
    overflow: "hidden",
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceStrong,
  },
  progressFill: {
    width: "42%",
    height: "100%",
    backgroundColor: colors.accent,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  authContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  authInner: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    gap: spacing.xl,
  },
  authBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  authBrand: {
    color: colors.text,
    fontSize: typography.sectionTitle,
    fontWeight: "900",
  },
  authArtwork: {
    minHeight: 132,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
  },
  authCopy: {
    gap: spacing.sm,
  },
  authTitle: {
    color: colors.text,
    fontSize: typography.hero,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 42,
  },
  authBody: {
    color: colors.subtle,
    fontSize: typography.body,
    lineHeight: 24,
  },
  authForm: {
    gap: spacing.lg,
  },
});
