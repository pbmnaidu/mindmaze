"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type MonitoringRole = "NATIONAL" | "STATE" | "CONSTITUENCY";

export interface MonitoringScope {
  role: MonitoringRole | null;
  state: string | null;
  constituency: string | null;
}

interface RoleScopeContextValue extends MonitoringScope {
  isReady: boolean;
  setNational: () => void;
  setStateScope: (state: string) => void;
  setConstituencyScope: (state: string, constituency: string) => void;
  clearScope: () => void;
  apiScope: { role: "national" | "state" | "constituency"; state?: string; constituency?: string } | null;
  label: string;
}

const RoleScopeContext = createContext<RoleScopeContextValue | null>(null);
const STORAGE_KEY = "nirikshan-monitoring-scope";
const EMPTY_SCOPE: MonitoringScope = { role: null, state: null, constituency: null };

function scopeLabel(scope: MonitoringScope) {
  if (scope.role === "NATIONAL") return "All India";
  if (scope.role === "STATE") return scope.state ?? "Select state";
  if (scope.role === "CONSTITUENCY") return [scope.constituency, scope.state].filter(Boolean).join(", ");
  return "Select Monitoring Role";
}

export function RoleScopeProvider({ children }: { children: React.ReactNode }) {
  const [scope, setScope] = useState<MonitoringScope>(EMPTY_SCOPE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as MonitoringScope;
        if (
          (parsed.role === "NATIONAL") ||
          (parsed.role === "STATE" && parsed.state) ||
          (parsed.role === "CONSTITUENCY" && parsed.state && parsed.constituency)
        ) setScope(parsed);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  const update = useCallback((next: MonitoringScope) => {
    setScope(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const value = useMemo<RoleScopeContextValue>(() => {
    const apiScope = scope.role
      ? {
          role: scope.role.toLowerCase() as "national" | "state" | "constituency",
          ...(scope.state ? { state: scope.state } : {}),
          ...(scope.constituency ? { constituency: scope.constituency } : {}),
        }
      : null;
    return {
      ...scope,
      isReady,
      apiScope,
      label: scopeLabel(scope),
      setNational: () => update({ role: "NATIONAL", state: null, constituency: null }),
      setStateScope: (state) => update({ role: "STATE", state, constituency: null }),
      setConstituencyScope: (state, constituency) => update({ role: "CONSTITUENCY", state, constituency }),
      clearScope: () => update(EMPTY_SCOPE),
    };
  }, [isReady, scope, update]);

  return <RoleScopeContext.Provider value={value}>{children}</RoleScopeContext.Provider>;
}

export function useRoleScope() {
  const context = useContext(RoleScopeContext);
  if (!context) throw new Error("useRoleScope must be used within RoleScopeProvider");
  return context;
}
