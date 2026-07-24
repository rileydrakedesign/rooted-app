/**
 * AuthContext — the single owner of the Supabase auth session.
 *
 * Every consumer reads the session/user from here instead of calling
 * supabase.auth.getUser()/getSession() per screen. The subscription is
 * registered exactly once; downstream contexts (GardenContext) react to
 * `user?.id` changes rather than holding their own auth listeners.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  /** True until the initial getSession() resolves. */
  initializing: boolean;
  /**
   * True while the signup-onboarding flow still has post-signup steps to
   * show (first watering, completion). RootNavigator keeps the Auth stack
   * mounted even though a session exists, so signUp doesn't yank the user
   * into the garden mid-flow.
   */
  onboardingActive: boolean;
  setOnboardingActive: (active: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [onboardingActive, setOnboardingActive] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Deferred: supabase-js holds an internal lock during this callback;
      // calling back into the client synchronously can deadlock.
      setTimeout(() => setSession(nextSession), 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        initializing,
        onboardingActive,
        setOnboardingActive,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
