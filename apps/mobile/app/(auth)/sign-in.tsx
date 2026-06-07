import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/auth-context";
import { Button, Field, Notice, Screen, ScreenHeader } from "@/ui/primitives";
import { colors, spacing, typography } from "@/theme/tokens";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
      router.replace("/(app)");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboard}
    >
      <Screen style={styles.screen}>
        <ScreenHeader eyebrow="Harmonix" title="Sign in" body="Use your InsForge account to continue." />
        <View style={styles.form}>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
          />
          <Button
            label="Sign in"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!email.trim() || !password}
          />
          <Link href="/(auth)/sign-up" asChild>
            <Text style={styles.link}>Create account</Text>
          </Link>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    justifyContent: "center",
  },
  form: {
    gap: spacing.lg,
  },
  link: {
    alignSelf: "center",
    color: colors.accent,
    fontSize: typography.body,
    fontWeight: "800",
    paddingVertical: spacing.sm,
  },
});
