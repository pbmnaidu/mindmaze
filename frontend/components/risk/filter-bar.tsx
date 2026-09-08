"use client";

import { useEffect, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RISK_LEVELS, RISK_LEVEL_LABEL } from "@/lib/constants/risk";
import type { FilterOptions } from "@/lib/types";
import { toTitleCase } from "@/lib/utils/format";
import type { QueueFilterState } from "@/hooks/use-queue-filters";

const ALL = "__all__";

interface FilterBarProps {
  filters: QueueFilterState;
  options: FilterOptions | undefined;
  onApply: (next: Partial<QueueFilterState>) => void;
  onReset: () => void;
  activeCount: number;
  showSeverity?: boolean;
}

type Draft = Omit<QueueFilterState, "page">;

function toDraft(filters: QueueFilterState): Draft {
  const { page: _page, ...rest } = filters;
  return rest;
}

export function FilterBar({ filters, options, onApply, onReset, activeCount, showSeverity = true }: FilterBarProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(filters));
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setDraft(toDraft(filters));
  }, [filters]);

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    onApply(draft);
    setSheetOpen(false);
  };

  const fields = (
    <>
      <div className="flex flex-col gap-1.5 lg:min-w-56 lg:flex-1">
        <Label htmlFor="filter-search" className="text-xs">Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="filter-search"
            value={draft.search}
            onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
            placeholder="Work ID, description, or MP"
            className="h-9 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 lg:w-44">
        <Label htmlFor="filter-state" className="text-xs">State</Label>
        <Select value={draft.state || ALL} onValueChange={(v) => setDraft((d) => ({ ...d, state: v === ALL ? "" : v }))}>
          <SelectTrigger id="filter-state" className="h-9 w-full text-xs" size="sm">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All states</SelectItem>
            {options?.states.map((s) => (
              <SelectItem key={s} value={s}>{toTitleCase(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 lg:w-44">
        <Label htmlFor="filter-constituency" className="text-xs">Constituency</Label>
        <Input
          id="filter-constituency"
          value={draft.constituency}
          onChange={(e) => setDraft((d) => ({ ...d, constituency: e.target.value }))}
          placeholder="Any constituency"
          className="h-9 text-xs"
        />
      </div>

      <div className="flex flex-col gap-1.5 lg:w-48">
        <Label htmlFor="filter-category" className="text-xs">Work category</Label>
        <Select value={draft.category || ALL} onValueChange={(v) => setDraft((d) => ({ ...d, category: v === ALL ? "" : v }))}>
          <SelectTrigger id="filter-category" className="h-9 w-full text-xs" size="sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {options?.categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showSeverity && (
        <div className="flex flex-col gap-1.5 lg:w-36">
          <Label htmlFor="filter-severity" className="text-xs">Risk level</Label>
          <Select value={draft.severity || ALL} onValueChange={(v) => setDraft((d) => ({ ...d, severity: v === ALL ? "" : v }))}>
            <SelectTrigger id="filter-severity" className="h-9 w-full text-xs" size="sm">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All levels</SelectItem>
              {(options?.severities?.length ? options.severities : RISK_LEVELS).map((level) => (
                <SelectItem key={level} value={level}>
                  {RISK_LEVEL_LABEL[level as keyof typeof RISK_LEVEL_LABEL] ?? level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );

  const actions = (
    <>
      <Button type="submit" size="sm" className="h-9">Apply</Button>
      <Button type="button" size="sm" variant="ghost" className="h-9" onClick={() => { onReset(); setSheetOpen(false); }} disabled={activeCount === 0 && !draft.search}>
        <X className="size-3.5" aria-hidden="true" />
        Reset
      </Button>
    </>
  );

  return (
    <>
      {/* Desktop / tablet: inline bar */}
      <form onSubmit={submit} className="hidden flex-wrap items-end gap-3 rounded-md border bg-card p-3 lg:flex" aria-label="Filter works">
        {fields}
        <div className="flex items-end gap-2">{actions}</div>
      </form>

      {/* Mobile: search inline, everything else in a sheet */}
      <div className="flex items-end gap-2 lg:hidden">
        <form onSubmit={submit} className="flex flex-1 items-end gap-2" aria-label="Search works">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              placeholder="Search work ID or description"
              className="h-9 pl-8 text-xs"
            />
          </div>
          <Button type="submit" size="sm" className="h-9">Apply</Button>
        </form>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-9">
              <Filter className="size-3.5" aria-hidden="true" />
              Filters
              {activeCount > 0 && (
                <span className="ml-1 rounded-sm bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{activeCount}</span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto rounded-t-lg">
            <SheetHeader className="text-left">
              <SheetTitle className="text-sm">Filter works</SheetTitle>
              <SheetDescription className="text-xs">Filters are applied on the server.</SheetDescription>
            </SheetHeader>
            <form onSubmit={submit} className="flex flex-col gap-4 px-4">
              {fields}
              <SheetFooter className="flex-row justify-end gap-2 px-0 pb-4">{actions}</SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
