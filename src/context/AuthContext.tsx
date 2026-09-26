"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  role: string;
  isEmailVerified?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    user?: UserProfile;
    error?: string;
    requiresVerification?: boolean;
    email?: string;
    code?: string;
  }>;
  loginWithGoogle: (googlePayload: { credential?: string; email?: string; name?: string; avatarUrl?: string }) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{
    success: boolean;
    email?: string;
    code?: string;
    requiresVerification?: boolean;
    error?: string;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.requiresVerification) {
        if (typeof window !== "undefined" && data.code) {
          sessionStorage.setItem(`pending_pin_${data.email || email}`, data.code);
        }
        return {
          success: false,
          requiresVerification: true,
          email: data.email,
          code: data.code,
          message: data.message,
        };
      }
      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Login failed",
          requiresVerification: data.requiresVerification,
          email: data.email,
        };
      }
      setUser(data.user);
      router.refresh();
      return { success: true, user: data.user };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    }
  };

  const loginWithGoogle = async (googlePayload: {
    credential?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  }) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(googlePayload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Google authentication failed" };
      }
      setUser(data.user);
      router.refresh();
      return { success: true, user: data.user };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error during Google sign in" };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }
      if (typeof window !== "undefined" && data.code) {
        sessionStorage.setItem(`pending_pin_${data.email || email}`, data.code);
      }
      // Do NOT set user context until email verification is complete
      return {
        success: true,
        requiresVerification: true,
        email: data.email || email,
        code: data.code,
      };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
