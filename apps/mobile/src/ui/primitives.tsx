import type { TextInputProps, ViewProps } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radii, spacing, typography } from "@/theme/tokens";

export function Screen({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.screen, style]} {...props}>
      {children}
    </View>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        style={[styles.input, error ? styles.inputError : null]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        isDisabled ? styles.buttonDisabled : null,
        pressed && !isDisabled ? styles.buttonPressed : null,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === "primary" ? colors.accentText : colors.text} /> : null}
      <Text style={[styles.buttonLabel, variant === "primary" ? styles.primaryLabel : null]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "danger" | "success" | "warning";
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.notice, styles[`${tone}Notice`]]}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: typography.small,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "800",
    letterSpacing: 0,
  },
  body: {
    color: colors.subtle,
    fontSize: typography.body,
    lineHeight: 24,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    color: colors.subtle,
    fontSize: typography.small,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    backgroundColor: colors.surface,
    fontSize: typography.body,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: typography.small,
  },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
    backgroundColor: "transparent",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  primaryLabel: {
    color: colors.accentText,
  },
  notice: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  neutralNotice: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dangerNotice: {
    borderColor: colors.danger,
    backgroundColor: "#2a1215",
  },
  successNotice: {
    borderColor: colors.accent,
    backgroundColor: "#052e16",
  },
  warningNotice: {
    borderColor: colors.warning,
    backgroundColor: "#2b2110",
  },
  noticeText: {
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 19,
  },
  empty: {
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  emptyBody: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
  },
});
