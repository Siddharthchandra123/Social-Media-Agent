"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getAccessToken } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SocialAccount {
  id: string;
  platform: string;
  platform_user_id: string;
  display_name: string | null;
  status: string;
  created_at: string;
}

interface UserContextType {
  user: User | null;
  socialAccounts: SocialAccount[];
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  disconnectAccount: (platform: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: unknown } }).response;
    if (
      response &&
      typeof response.data === "object" &&
      response.data !== null &&
      "detail" in response.data
    ) {
      const detail = (response.data as { detail?: unknown }).detail;
      if (typeof detail === "string") return detail;
    }
  }
  return err instanceof Error ? err.message : fallback;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      setError(null);
      // Fetch current user and connected social accounts
      const [userRes, accountsRes] = await Promise.all([
        api.get<User>("/auth/me").catch(() => ({ data: { id: "", email: "", name: "User" } })),
        api.get<SocialAccount[]>("/social-accounts"),
      ]);
      setUser(userRes.data);
      setSocialAccounts(accountsRes.data);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to load session"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      const token = getAccessToken();
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setSocialAccounts([]);
          setLoading(false);
        }
        return;
      }

      try {
        const [userRes, accountsRes] = await Promise.all([
          api.get<User>("/auth/me").catch(() => ({ data: { id: "", email: "", name: "User" } })),
          api.get<SocialAccount[]>("/social-accounts"),
        ]);
        if (cancelled) return;
        setUser(userRes.data);
        setSocialAccounts(accountsRes.data);
      } catch (err: unknown) {
        if (!cancelled) setError(errorMessage(err, "Failed to load session"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const disconnectAccount = async (platform: string) => {
    try {
      await api.delete(`/social-accounts/${platform}`);
      setSocialAccounts((prev) => prev.filter((acc) => acc.platform !== platform));
    } catch (err: unknown) {
      throw new Error(errorMessage(err, "Failed to disconnect account"));
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        socialAccounts,
        loading,
        error,
        refreshUser,
        disconnectAccount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
