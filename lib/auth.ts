'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseAuth, AUTH_CHANGE_EVENT, type SupabaseUser, type SupabaseSession } from './supabase';

export interface ToolboxUser {
  id: string;
  name: string;
  email?: string;
}

export interface AuthSession {
  user: ToolboxUser;
  accessToken: string;
}

export function mapUser(user: SupabaseUser | null): ToolboxUser | null {
  if (!user) return null;
  const email = user.email || '';
  const name = user.user_metadata?.name || email.split('@')[0] || 'User';
  return {
    id: user.id,
    name,
    email,
  };
}

export async function getSession(): Promise<AuthSession | null> {
  const session = supabaseAuth.getSession();
  if (!session) return null;
  const user = mapUser(session.user);
  if (!user) return null;
  return {
    user,
    accessToken: session.access_token,
  };
}

export function useAuth() {
  const [user, setUser] = useState<ToolboxUser | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentSession = supabaseAuth.getSession();
    setSession(currentSession);
    setUser(mapUser(currentSession?.user ?? null));
    setLoading(false);

    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<SupabaseSession | null>;
      const newSession = customEvent.detail ?? supabaseAuth.getSession();
      setSession(newSession);
      setUser(mapUser(newSession?.user ?? null));
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    return await supabaseAuth.signInWithOtp(email);
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    return await supabaseAuth.verifyOtp(email, token);
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    return await supabaseAuth.signInWithPassword(email, password);
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string, name?: string) => {
    return await supabaseAuth.signUpWithPassword(email, password, name);
  }, []);

  const verifySignupOtp = useCallback(async (email: string, token: string) => {
    return await supabaseAuth.verifySignupOtp(email, token);
  }, []);

  const signOut = useCallback(async () => {
    await supabaseAuth.signOut();
  }, []);

  return {
    user,
    session,
    loading,
    isAuthenticated: Boolean(user),
    signInWithOtp,
    verifyOtp,
    signInWithPassword,
    signUpWithPassword,
    verifySignupOtp,
    signOut,
  };
}
