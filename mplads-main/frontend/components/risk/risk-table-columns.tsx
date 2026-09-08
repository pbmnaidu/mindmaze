"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "./risk-badge";
import { RiskScore } from "./risk-score";
import { WorkId } from "./work-id";
import type { WorkRecord } from "@/lib/types";
import { formatInr, toTitleCase } from "@/lib/utils/format";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    label?: string;
    align?: "left" | "right" | "center";
  }
}

const text = (value: string | undefined) => <span className="whitespace-nowrap">{toTitleCase(value)}</span>;

export const riskTableColumns: ColumnDef<WorkRecord>[] = [
  {
    id: "work_id",
    accessorKey: "work_id",
    header: "Work ID",
    meta: { label: "Work ID" },
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => <WorkId id={row.original.work_id} />,
  },
  {
    id: "state",
    accessorFn: (r) => r.State ?? r.state ?? "",
    header: "State",
    meta: { label: "State" },
    cell: ({ getValue }) => text(getValue<string>()),
  },
  {
    id: "constituency",
    accessorFn: (r) => r.Constituency ?? r.constituency ?? "",
    header: "Constituency",
    meta: { label: "Constituency" },
    cell: ({ getValue }) => text(getValue<string>()),
  },
  {
    id: "category",
    accessorKey: "work_category",
    header: "Category",
    meta: { label: "Category" },
    cell: ({ getValue }) => <span className="block max-w-40 truncate" title={getValue<string>()}>{getValue<string>()}</span>,
  },
  {
    id: "sanction_amount",
    accessorKey: "sanction_amount",
    header: "Sanction",
    meta: { label: "Sanction amount", align: "right" },
    cell: ({ getValue }) => <span className="font-mono tabular">{formatInr(getValue<number>())}</span>,
  },
  {
    id: "expenditure",
    accessorKey: "effective_expenditure",
    header: "Expenditure",
    meta: { label: "Expenditure", align: "right" },
    cell: ({ getValue }) => <span className="font-mono tabular">{formatInr(getValue<number>())}</span>,
  },
  {
    id: "financial",
    accessorKey: "financial_risk_score",
    header: "Financial",
    meta: { label: "Financial risk", align: "right" },
    cell: ({ row }) => <RiskScore score={row.original.financial_risk_score} level={row.original.financial_risk_level} />,
  },
  {
    id: "vendor",
    accessorKey: "vendor_risk_score",
    header: "Vendor",
    meta: { label: "Vendor risk", align: "right" },
    cell: ({ row }) => <RiskScore score={row.original.vendor_risk_score} level={row.original.vendor_risk_level} />,
  },
  {
    id: "duplicate",
    accessorKey: "duplicate_risk_score",
    header: "Duplicate",
    meta: { label: "Duplicate risk", align: "right" },
    cell: ({ row }) => <RiskScore score={row.original.duplicate_risk_score} />,
  },
  {
    id: "compliance",
    accessorKey: "compliance_risk_score",
    header: "Compliance",
    meta: { label: "Compliance risk", align: "right" },
    cell: ({ row }) => <RiskScore score={row.original.compliance_risk_score} level={row.original.compliance_risk_level} />,
  },
  {
    id: "composite",
    accessorKey: "composite_risk_score",
    header: "Composite",
    meta: { label: "Composite risk", align: "right" },
    enableHiding: false,
    cell: ({ row }) => <RiskScore score={row.original.composite_risk_score} level={row.original.overall_risk_level} withBar />,
  },
  {
    id: "level",
    accessorKey: "overall_risk_level",
    header: "Risk level",
    meta: { label: "Risk level" },
    enableHiding: false,
    sortingFn: (a, b) => {
      const order = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 } as Record<string, number>;
      return (order[a.original.overall_risk_level] ?? -1) - (order[b.original.overall_risk_level] ?? -1);
    },
    cell: ({ row }) => <RiskBadge level={row.original.overall_risk_level} />,
  },
  {
    id: "action",
    header: "Action",
    meta: { label: "Action", align: "right" },
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
        <Link href={`/projects/${encodeURIComponent(row.original.work_id)}`} aria-label={`View details for ${row.original.work_id}`}>
          View
        </Link>
      </Button>
    ),
  },
];
