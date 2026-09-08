"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Landmark, MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilterOptions } from "@/hooks/use-risk-monitor";
import { useRoleScope, type MonitoringRole } from "@/components/providers/role-scope-provider";
import { toTitleCase } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const ROLES: Array<{ role: MonitoringRole; title: string; subtitle: string; description: string; icon: typeof Globe2 }> = [
  { role: "NATIONAL", title: "National Master", subtitle: "MoSPI Core Audit Team", description: "Country-wide monitoring across all States and Constituencies.", icon: Globe2 },
  { role: "STATE", title: "State Master", subtitle: "State Nodal Department Secretary / Chief Secretary", description: "State-level monitoring across Constituencies.", icon: Landmark },
  { role: "CONSTITUENCY", title: "Constituency Master", subtitle: "Member of Parliament", description: "Constituency-level monitoring of individual works.", icon: MapPin },
];

export function RoleSelector({ compact = false, onComplete }: { compact?: boolean; onComplete?: () => void }) {
  const { role, setNational, setStateScope, setConstituencyScope, clearScope, label } = useRoleScope();
  const router = useRouter();
  const [draftRole, setDraftRole] = useState<MonitoringRole | null>(null);
  const [state, setState] = useState("");
  const [constituency, setConstituency] = useState("");
  const filters = useFilterOptions({ role: "national" });
  const constituencies = useMemo(() => {
    // The filter endpoint returns the genuine labels; only present options for the selected state.
    return filters.data?.data.constituenciesByState?.[state] ?? [];
  }, [filters.data?.data.constituenciesByState, state]);
  const selecting = draftRole ?? role;

  const activate = (nextRole: MonitoringRole) => {
    if (nextRole === "NATIONAL") {
      setNational();
      setDraftRole(null);
      router.replace("/");
      onComplete?.();
      return;
    }
    setState("");
    setConstituency("");
    setDraftRole(nextRole);
  };
  const submitScope = () => {
    if (selecting === "STATE" && state) { setStateScope(state); setDraftRole(null); router.replace("/"); onComplete?.(); }
    if (selecting === "CONSTITUENCY" && state && constituency) { setConstituencyScope(state, constituency); setDraftRole(null); router.replace("/"); onComplete?.(); }
  };

  if (compact && role && !draftRole) {
    return (
      <Card className="gap-2 rounded-md p-3 shadow-none">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">MONITORING CONTEXT</p>
        <p className="text-xs font-semibold">{role} MASTER</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        <Button variant="ghost" size="sm" className="mt-1 h-7 justify-start px-0 text-xs text-primary" onClick={() => { clearScope(); onComplete?.(); }}>
          <Pencil className="size-3" /> Change role / scope
        </Button>
      </Card>
    );
  }

  return (
    <section className={cn("flex flex-col gap-4", compact && "gap-3")} aria-label="Select monitoring role">
      {!compact && <div><h2 className="text-lg font-semibold">Select Monitoring Role</h2><p className="text-sm text-muted-foreground">Choose how you want to view MPLADS risk intelligence.</p></div>}
      {!selecting || draftRole ? (
        <div className={cn("grid gap-3", !compact && "lg:grid-cols-3")}>
          {ROLES.map((item) => {
            const Icon = item.icon;
            return <button key={item.role} type="button" onClick={() => activate(item.role)} className="flex min-h-36 flex-col items-start gap-2 rounded-md border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-ring">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.subtitle}</span>
              {!compact && <span className="text-xs text-muted-foreground">{item.description}</span>}
            </button>;
          })}
        </div>
      ) : null}
      {selecting === "STATE" || selecting === "CONSTITUENCY" ? (
        <Card className="flex flex-col gap-3 rounded-md p-4 shadow-none">
          <p className="text-sm font-semibold">{selecting === "STATE" ? "Choose a State" : "Choose State and Constituency"}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5"><Label htmlFor="scope-state" className="text-xs">State</Label><Select value={state} onValueChange={(value) => { setState(value); setConstituency(""); }}><SelectTrigger id="scope-state"><SelectValue placeholder="Select State" /></SelectTrigger><SelectContent>{filters.data?.data.states.map((item) => <SelectItem key={item} value={item}>{toTitleCase(item)}</SelectItem>)}</SelectContent></Select></div>
            {selecting === "CONSTITUENCY" && <div className="flex flex-col gap-1.5"><Label htmlFor="scope-constituency" className="text-xs">Constituency</Label><Select value={constituency} onValueChange={setConstituency} disabled={!state}><SelectTrigger id="scope-constituency"><SelectValue placeholder={state ? "Select Constituency" : "Select State first"} /></SelectTrigger><SelectContent>{constituencies.map((item) => <SelectItem key={item} value={item}>{toTitleCase(item)}</SelectItem>)}</SelectContent></Select></div>}
          </div>
          <div className="flex gap-2"><Button size="sm" onClick={submitScope} disabled={!state || (selecting === "CONSTITUENCY" && !constituency)}>Activate monitoring</Button><Button size="sm" variant="ghost" onClick={() => setDraftRole(null)}>Back</Button></div>
        </Card>
      ) : null}
      {role && !draftRole && !compact && <Button variant="outline" size="sm" className="self-start" onClick={clearScope}>Change role / scope</Button>}
    </section>
  );
}
