import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
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
const sessionStorageKey = "harmonix.auth.session.v1";

type StoredSession = {
  accessToken: string;
  user: AuthUser;
};

let secureStoreAvailable: boolean | null = null;

async function canUseSecureStore() {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }

  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureStoreAvailable = false;
  }

  return secureStoreAvailable;
}

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

function normalizeStoredSession(value: unknown): StoredSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const accessToken = typeof record.accessToken === "string" ? record.accessToken : null;
  const user = normalizeUser(record.user);

  if (!accessToken || !user) {
    return null;
  }

  return { accessToken, user };
}

async function readStoredSession() {
  if (!(await canUseSecureStore())) {
    return null;
  }

  const raw = await SecureStore.getItemAsync(sessionStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return normalizeStoredSession(JSON.parse(raw));
  } catch {
    await SecureStore.deleteItemAsync(sessionStorageKey);
    return null;
  }
}

async function writeStoredSession(session: StoredSession) {
  if (!(await canUseSecureStore())) {
    return;
  }

  await SecureStore.setItemAsync(sessionStorageKey, JSON.stringify(session));
}

async function clearStoredSession() {
  insforge.setAccessToken(null);

  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(sessionStorageKey);
  }
}

async function activateSession(accessToken: string, user: AuthUser) {
  insforge.setAccessToken(accessToken);
  await writeStoredSession({ accessToken, user });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { data, error } = await insforge.auth.getCurrentUser();

    if (error) {
      throw new Error(toAppErrorMessage(error, "Unable to load current user."));
    }

    const nextUser = normalizeUser(data?.user);
    setUser(nextUser);

    const storedSession = await readStoredSession();
    if (storedSession?.accessToken && nextUser) {
      await writeStoredSession({ accessToken: storedSession.accessToken, user: nextUser });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const storedSession = await readStoredSession();
      if (storedSession) {
        insforge.setAccessToken(storedSession.accessToken);

        if (mounted) {
          setUser(storedSession.user);
        }
      }

      const { data, error } = await insforge.auth.getCurrentUser();
      if (!mounted) {
        return;
      }

      const nextUser = error ? null : normalizeUser(data?.user);
      if (nextUser) {
        setUser(nextUser);

        if (storedSession?.accessToken) {
          await writeStoredSession({ accessToken: storedSession.accessToken, user: nextUser });
        }
      } else {
        await clearStoredSession();
        setUser(null);
      }
    }

    bootstrap().finally(() => {
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

    const nextUser = normalizeUser(data?.user);
    if (!data?.accessToken || !nextUser) {
      throw new Error("Unable to sign in because the session token was not returned.");
    }

    await activateSession(data.accessToken, nextUser);
    setUser(nextUser);
  }, []);

  const signUp = useCallback(async ({ email, password, name }: SignUpInput) => {
    const { data, error } = await insforge.auth.signUp({ email, password, name });

    if (error) {
      throw new Error(toAppErrorMessage(error, "Unable to create account."));
    }

    const nextUser = normalizeUser(data?.user);
    if (nextUser && data?.accessToken) {
      await activateSession(data.accessToken, nextUser);
      setUser(nextUser);
    }

    return { requireEmailVerification: Boolean(data?.requireEmailVerification) };
  }, []);

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });

    if (error) {
      throw new Error(toAppErrorMessage(error, "Unable to verify email."));
    }

    const nextUser = normalizeUser(data?.user);
    if (!data?.accessToken || !nextUser) {
      throw new Error("Unable to verify email because the session token was not returned.");
    }

    await activateSession(data.accessToken, nextUser);
    setUser(nextUser);
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const { error } = await insforge.auth.resendVerificationEmail({ email });

    if (error) {
      throw new Error(toAppErrorMessage(error, "Unable to resend verification code."));
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await insforge.auth.signOut();
    await clearStoredSession();
    setUser(null);

    if (error) {
      throw new Error(toAppErrorMessage(error, "Unable to sign out."));
    }
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
