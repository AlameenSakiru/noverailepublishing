"use client";

import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminSignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-red-950/60 text-gray-300 hover:text-red-400 border border-gray-700 hover:border-red-800/60 transition-colors text-xs font-medium"
      title="End Administrator Session"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>{loading ? "Signing out..." : "Sign Out"}</span>
    </button>
  );
}
