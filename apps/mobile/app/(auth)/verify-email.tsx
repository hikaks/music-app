import { Link, router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { MailCheck, RefreshCw } from "lucide-react-native";
import { useAuth } from "@/auth/auth-context";
import { Button, Field, Notice } from "@/ui/primitives";
import { AuthStage } from "@/ui/music";
import { colors, spacing, typography } from "@/theme/tokens";

export default function VerifyEmailScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { resendVerification, verifyEmail } = useAuth();
  const initialEmail = useMemo(() => (typeof emailParam === "string" ? emailParam : ""), [emailParam]);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerify() {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await verifyEmail(email.trim(), otp.trim());
      router.replace("/(app)");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to verify email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setMessage(null);
    setIsResending(true);

    try {
      await resendVerification(email.trim());
      setMessage("Verification code sent.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to resend code.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboard}
    >
      <AuthStage title="Confirm your listening profile." body="Enter the code from your email to unlock your Harmonix library.">
        <View style={styles.form}>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {message ? <Notice tone="success">{message}</Notice> : null}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Field
            label="Code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
          />
          <Button
            label="Verify"
            onPress={handleVerify}
            loading={isSubmitting}
            disabled={!email.trim() || otp.trim().length !== 6}
            icon={<MailCheck color={colors.accentText} size={18} strokeWidth={2.5} />}
          />
          <Button
            label="Resend code"
            variant="secondary"
            onPress={handleResend}
            loading={isResending}
            disabled={!email.trim()}
            icon={<RefreshCw color={colors.text} size={18} strokeWidth={2.4} />}
          />
          <Link href="/(auth)/sign-in" asChild>
            <Text style={styles.link}>Back to sign in</Text>
          </Link>
        </View>
      </AuthStage>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: colors.background,
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
