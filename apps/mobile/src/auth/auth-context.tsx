import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { insforge } from "@/lib/insforge";
import { toAppErrorMessage } from "@/lib/errors";

export type AuthUser = {
  id: string;
  email: string;
  emailVerified?: boolean;
  profile?: {
    name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
};

type SignUpInput = {
  email: string;
  password: string;
  name?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ requireEmailVerification: boolean }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUser(user: unknown): AuthUser | null {
  if (!user || typeof user !== "object") {
    return null;
  }

  const record = user as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : null;
  const email = typeof record.email === "string" ? record.email : "";
  const emailVerified =
    typeof record.emailVerified === "boolean"
      ? record.emailVerified
      : typeof record.email_verified === "boolean"
        ? record.email_verified
        : undefined;
  const profile = record.profile && typeof record.profile === "object" ? record.profile : undefined;

  if (!id) {
    return null;
  }

  return {
    id,
    email,
    emailVerified,
    profile: profile as AuthUser["profile"],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { data, error } = await insforge.auth.getCurrentUser();

    if (error) {
      throw new Error(toAppErrorMessage(error, "Unable to load current user."));
    }

    setUser(normalizeUser(data.user));
  }, []);

  useEffect(() => {
    let mounted = true;

    insforge.auth
      .getCurrentUser()
      .then(({ data }) => {
        if (mounted) {
          setUser(normalizeUser(data.user));
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(toAppErrorMessage(error, "Unable to sign in."));
    }

    setUser(normalizeUser(data?.user));
  }, []);

  const signUp = useCallback(async ({ email, password, name }: SignUpInput) => {
    const { data, error } = await insforge.auth.signUp({ email, password, name });

    if (error) {
      throw new Error(toAppErrorMessage(error, "Unable to create account."));
    }

    const nextUser = normalizeUser(data?.user);
    if (nextUser && data?.accessToken) {
      setUser(nextUser);
    }

    return { requireEmailVerification: Boolean(data?.requireEmailVerification) };
  }, []);

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });

    if (error) {
      throw new Error(toAppErrorMessage(error, "Unable to verify email."));
    }

    setUser(normalizeUser(data?.user));
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const { error } = await insforge.auth.resendVerificationEmail({ email });

    if (error) {
      throw new Error(toAppErrorMessage(error, "Unable to resend verification code."));
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await insforge.auth.signOut();

    if (error) {
      throw new Error(toAppErrorMessage(error, "Unable to sign out."));
    }

    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signIn,
      signUp,
      verifyEmail,
      resendVerification,
      signOut,
      refreshUser,
    }),
    [isLoading, refreshUser, resendVerification, signIn, signOut, signUp, user, verifyEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}
