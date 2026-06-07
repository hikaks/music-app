import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/auth-context";
import { Button, Field, Notice, Screen, ScreenHeader } from "@/ui/primitives";
import { colors, spacing, typography } from "@/theme/tokens";

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signUp({
        name: name.trim() || undefined,
        email: email.trim(),
        password,
      });

      if (result.requireEmailVerification) {
        router.replace({ pathname: "/(auth)/verify-email", params: { email: email.trim() } });
        return;
      }

      router.replace("/(app)");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create account.");
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
        <ScreenHeader eyebrow="Harmonix" title="Create account" body="Email verification uses a code." />
        <View style={styles.form}>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Field label="Name" value={name} onChangeText={setName} autoComplete="name" />
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
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <Button
            label="Create account"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!email.trim() || password.length < 6}
          />
          <Link href="/(auth)/sign-in" asChild>
            <Text style={styles.link}>Back to sign in</Text>
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
