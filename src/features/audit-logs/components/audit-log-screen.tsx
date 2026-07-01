"use client";

import { useMemo, useState } from "react";
import type {
  AuditLog,
  AuditLogAction,
  AuditLogCategory,
  AuditLogResult,
} from "@/services/audit-logs.service";
import type { Market } from "@/services/markets.service";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { DashboardPageTitle } from "@/features/dashboard/components/dashboard-page-title";
import { formatFullDateTime } from "@/lib/date-format";
import {
  buttonVariants,
  inputClass,
  panelVariants,
  selectClass,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";

const categoryOptions: Array<{
  label: string;
  value: AuditLogCategory;
}> = [
  { label: "인증/보안", value: "auth_security" },
  { label: "마켓", value: "market" },
  { label: "참가부스", value: "booth" },
  { label: "상품", value: "product" },
  { label: "영수증", value: "receipt" },
  { label: "수수료 정책", value: "fee_policy" },
  { label: "정산", value: "settlement" },
  { label: "내보내기", value: "export" },
  { label: "관리", value: "admin" },
  { label: "시스템", value: "system" },
];

const actionOptions: Array<{
  label: string;
  value: AuditLogAction;
}> = [
  { label: "가입", value: "register" },
  { label: "로그인", value: "login" },
  { label: "로그아웃", value: "logout" },
  { label: "권한 거부", value: "access_denied" },
  { label: "생성", value: "create" },
  { label: "수정", value: "update" },
  { label: "제거", value: "remove" },
  { label: "확정", value: "confirm" },
  { label: "무효", value: "void" },
  { label: "다운로드", value: "download" },
  { label: "조회", value: "view" },
];

const resultOptions: Array<{
  label: string;
  value: AuditLogResult;
}> = [
  { label: "성공", value: "success" },
  { label: "실패", value: "failure" },
];

const categoryLabels = Object.fromEntries(
  categoryOptions.map((option) => [option.value, option.label]),
) as Record<AuditLogCategory, string>;

const actionLabels = Object.fromEntries(
  actionOptions.map((option) => [option.value, option.label]),
) as Record<AuditLogAction, string>;

const resultLabels = Object.fromEntries(
  resultOptions.map((option) => [option.value, option.label]),
) as Record<AuditLogResult, string>;

type AuditLogFilterState = {
  action: AuditLogAction | "";
  category: AuditLogCategory | "";
  marketId: string;
  result: AuditLogResult | "";
  search: string;
};

export function AuditLogScreen({
  markets,
  selectedMarket,
  selectedMarketId,
}: {
  markets: Market[];
  selectedMarket: Market | null;
  selectedMarketId: string | null;
}) {
  const initialMarketId = selectedMarketId ?? "";
  const [draftFilters, setDraftFilters] = useState<AuditLogFilterState>({
    action: "",
    category: "",
    marketId: initialMarketId,
    result: "",
    search: "",
  });
  const [filters, setFilters] = useState<AuditLogFilterState>(draftFilters);

  const marketNameById = useMemo(
    () => new Map(markets.map((market) => [market.id, market.name])),
    [markets],
  );
  const auditLogs = useAuditLogs({
    action: filters.action,
    category: filters.category,
    limit: 80,
    marketId: filters.marketId || undefined,
    result: filters.result,
    search: filters.search.trim() || undefined,
  });
  const logs = auditLogs.data?.logs ?? [];

  return (
    <div className="min-w-0">
      <DashboardPageTitle
        eyebrow={selectedMarket?.name ?? "전체 플리마켓"}
        subtitle="영수증, 정산, 수수료 정책처럼 운영 결과에 영향을 주는 작업 기록을 확인합니다."
        title="LOG"
      />

      <section className={panelVariants()}>
        <form
          className="grid gap-3 border-b border-hairline px-4 py-4 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1.1fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)_minmax(120px,0.7fr)_minmax(180px,1fr)_auto] lg:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters(draftFilters);
          }}
        >
          <label className="grid gap-1.5">
            <span className="font-mono text-[10.5px] tracking-[0.06em] text-muted">
              플리마켓
            </span>
            <select
              className={selectClass}
              value={draftFilters.marketId}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  marketId: event.target.value,
                }))
              }
            >
              <option value="">전체</option>
              {markets.map((market) => (
                <option key={market.id} value={market.id}>
                  {market.name}
                </option>
              ))}
            </select>
          </label>

          <AuditSelect
            label="카테고리"
            options={categoryOptions}
            value={draftFilters.category}
            onChange={(category) =>
              setDraftFilters((current) => ({ ...current, category }))
            }
          />

          <AuditSelect
            label="액션"
            options={actionOptions}
            value={draftFilters.action}
            onChange={(action) =>
              setDraftFilters((current) => ({ ...current, action }))
            }
          />

          <AuditSelect
            label="결과"
            options={resultOptions}
            value={draftFilters.result}
            onChange={(result) =>
              setDraftFilters((current) => ({ ...current, result }))
            }
          />

          <label className="grid gap-1.5">
            <span className="font-mono text-[10.5px] tracking-[0.06em] text-muted">
              검색
            </span>
            <input
              className={inputClass}
              placeholder="영수증번호 · 정산 ID"
              type="search"
              value={draftFilters.search}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
            />
          </label>

          <button className={buttonVariants({ size: "md" })} type="submit">
            적용
          </button>
        </form>

        {auditLogs.isLoading ? (
          <LogStateMessage message="로그를 불러오는 중입니다." />
        ) : auditLogs.isError ? (
          <LogStateMessage message="로그를 불러오지 못했습니다." />
        ) : logs.length === 0 ? (
          <LogStateMessage message="조건에 맞는 로그가 없습니다." />
        ) : (
          <>
            <div className="grid gap-3 p-3 md:hidden">
              {logs.map((log) => (
                <AuditLogCard
                  key={log.id}
                  log={log}
                  marketName={resolveMarketName(log, marketNameById)}
                />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[920px] w-full border-collapse">
                <thead className="bg-brand-deep text-left font-mono text-[10px] uppercase tracking-[0.06em] text-muted-soft">
                  <tr>
                    <th className="px-5 py-4 font-semibold">시각</th>
                    <th className="px-5 py-4 font-semibold">구분</th>
                    <th className="px-5 py-4 font-semibold">내용</th>
                    <th className="px-5 py-4 font-semibold">담당자</th>
                    <th className="px-5 py-4 font-semibold">플리마켓</th>
                    <th className="px-5 py-4 font-semibold">대상</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline bg-surface text-sm">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-[11.5px] text-muted">
                        {formatFullDateTime(log.occurredAt)}
                      </td>
                      <td className="px-5 py-4">
                        <LogBadges log={log} />
                      </td>
                      <td className="min-w-[260px] px-5 py-4">
                        <div className="font-semibold text-ink">
                          {log.summary}
                        </div>
                        <div className="mt-1 font-mono text-[10.5px] text-muted-soft">
                          {formatMetadata(log.metadata)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-body">
                        {log.actorDisplayName ?? "시스템"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-body">
                        {resolveMarketName(log, marketNameById)}
                      </td>
                      <td className="px-5 py-4 font-mono text-[10.5px] text-muted">
                        {log.targetType ?? "-"}
                        {log.targetId ? ` · ${shortId(log.targetId)}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function AuditSelect<TValue extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: TValue }>;
  value: TValue | "";
  onChange: (value: TValue | "") => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[10.5px] tracking-[0.06em] text-muted">
        {label}
      </span>
      <select
        className={selectClass}
        value={value}
        onChange={(event) => onChange(event.target.value as TValue | "")}
      >
        <option value="">전체</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AuditLogCard({
  log,
  marketName,
}: {
  log: AuditLog;
  marketName: string;
}) {
  return (
    <article className="rounded-[12px] border border-hairline bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-muted">
            {formatFullDateTime(log.occurredAt)}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold text-ink">
            {log.summary}
          </h3>
        </div>
        <LogResultPill result={log.result} />
      </div>
      <div className="mt-3">
        <LogBadges log={log} />
      </div>
      <dl className="mt-3 grid gap-1.5 text-sm text-body">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">담당자</dt>
          <dd className="text-right">{log.actorDisplayName ?? "시스템"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">플리마켓</dt>
          <dd className="text-right">{marketName}</dd>
        </div>
      </dl>
      <p className="mt-3 font-mono text-[10.5px] text-muted-soft">
        {formatMetadata(log.metadata)}
      </p>
    </article>
  );
}

function LogBadges({ log }: { log: AuditLog }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="rounded-md bg-canvas-soft px-2 py-1 font-mono text-[10.5px] font-semibold text-body">
        {categoryLabels[log.category]}
      </span>
      <span className="rounded-md bg-surface-sunken px-2 py-1 font-mono text-[10.5px] font-semibold text-muted">
        {actionLabels[log.action]}
      </span>
      <LogResultPill result={log.result} />
    </div>
  );
}

function LogResultPill({ result }: { result: AuditLogResult }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-1 font-mono text-[10.5px] font-bold",
        result === "success"
          ? "bg-[#e6f4ec] text-[#1f8a4d]"
          : "bg-error-tint text-error",
      )}
    >
      {resultLabels[result]}
    </span>
  );
}

function LogStateMessage({ message }: { message: string }) {
  return (
    <div className="px-4 py-12 text-center text-sm text-muted">
      {message}
    </div>
  );
}

function resolveMarketName(
  log: AuditLog,
  marketNameById: Map<string, string>,
): string {
  if (!log.marketId) {
    return "전역";
  }

  return marketNameById.get(log.marketId) ?? shortId(log.marketId);
}

function formatMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }

  const entries = Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .slice(0, 4);

  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(" · ");
}

function shortId(value: string): string {
  return value.slice(0, 8);
}
