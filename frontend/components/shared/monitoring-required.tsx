"use client";

import { ShieldCheck } from "lucide-react";
import { EmptyState } from "./states";
import { useRoleScope } from "@/components/providers/role-scope-provider";

export function MonitoringRequired() {
  const { isReady } = useRoleScope();
  return <EmptyState icon={<ShieldCheck />} title={isReady ? "Select a monitoring role first." : "Restoring monitoring context…"} description={isReady ? "Role-scoped monitoring pages become available after a National, State, or Constituency role is activated from Overview." : undefined} />;
}
