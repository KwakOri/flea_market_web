"use client";

import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { CircleDollarSign } from "lucide-react";
import type { Participant } from "@/services/participants.service";
import type { SettlementDefaultSettings } from "@/services/settlement-settings.service";
import {
  defaultFeeSettings,
  feeSettingFields,
  formatFeeFieldValue,
  getParticipantFeePolicySource,
  getScopedFeeFieldValue,
  type FeeSettingScope,
} from "@/features/fees/lib/fee-policy";
import { ParticipantTypeBadge } from "@/features/participants/components/participant-type-badge";
import {
  FLEA_MARKET_DEFAULT_LABEL,
  FLEA_MARKET_SETTINGS_LABEL,
  PARTICIPATING_SELLER,
  SELLER,
  SELLER_FEE_SETTINGS_LABEL,
  SELLER_SETTINGS_LABEL,
} from "@/lib/terminology";
import { cn } from "@/lib/utils";

const feeApplicationCellVariants = cva(
  "grid h-full min-h-0 content-start gap-2 rounded-xl border border-hairline bg-surface p-[13px] transition-opacity md:min-h-[154px]",
  {
    variants: {
      active: {
        true: "border-success bg-success-tint",
        false: "border-hairline bg-surface opacity-30 hover:opacity-50",
      },
    },
  },
);

const feeApplicationStatusTextVariants = cva(
  "font-mono text-[9.5px]",
  {
    variants: {
      active: {
        true: "font-bold text-success",
        false: "font-medium text-muted-soft",
      },
    },
  },
);

const feeSettingFieldRowVariants = cva(
  "grid min-h-7 grid-cols-[76px_minmax(0,1fr)_38px] items-center gap-2 rounded-md px-2 py-1",
  {
    variants: {
      active: {
        true: "bg-surface shadow-sm ring-1 ring-success/40",
        false: "",
      },
    },
  },
);

const feeSettingFieldStatusVariants = cva(
  "text-right font-mono text-[11px]",
  {
    variants: {
      active: {
        true: "font-semibold text-success",
        false: "font-normal text-muted-soft",
      },
    },
  },
);

export function FeeApplicationMatrix({
  globalSettings,
  isLoading,
  marketSettings,
  onEditParticipant,
  participants,
}: {
  globalSettings: SettlementDefaultSettings | null;
  isLoading: boolean;
  marketSettings: SettlementDefaultSettings | null;
  onEditParticipant: (participant: Participant) => void;
  participants: Participant[];
}) {
  if (isLoading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted">
        수수료 적용 현황을 불러오는 중입니다.
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted">
        연결된 {SELLER}가 없습니다.
      </div>
    );
  }

  const resolvedGlobalSettings = globalSettings ?? {
    ...defaultFeeSettings,
    id: null,
    scope: "global" as const,
    marketId: null,
    createdBy: null,
    createdAt: null,
    updatedAt: null,
  };
  const hasMarketSettings = Boolean(marketSettings?.id);

  function renderParticipantFeeAction(
    participant: Participant,
    size: "compact" | "large",
  ) {
    return (
      <button
        aria-label={`${participant.displayName} ${SELLER_FEE_SETTINGS_LABEL}`}
        className={cn(
          "inline-flex shrink-0 items-center justify-center border border-border bg-surface text-ink transition hover:bg-canvas-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
          size === "large"
            ? "h-16 w-16 rounded-[18px] shadow-card"
            : "h-7 w-7 rounded-lg",
        )}
        onClick={() => onEditParticipant(participant)}
        title={SELLER_FEE_SETTINGS_LABEL}
        type="button"
      >
        <CircleDollarSign
          aria-hidden
          className={size === "large" ? "h-8 w-8" : "h-3.5 w-3.5"}
        />
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-[12px] bg-surface">
      <div className="grid gap-3 p-3 md:hidden">
        {participants.map((participant) => {
          const activeScope = getParticipantFeePolicySource(
            participant,
            hasMarketSettings,
          );
          const hasBoothSettings =
            participant.settings?.feeSettingOverrideEnabled === true;

          return (
            <article
              className="grid gap-3 rounded-[12px] border border-hairline bg-canvas-soft p-3"
              data-testid="fee-status-card"
              key={participant.id}
            >
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-ink">
                  {participant.displayName}
                </p>
                <p className="mt-2">
                  <ParticipantTypeBadge type={participant.participantType} />
                </p>
              </div>
              <FeeApplicationCell
                isActive={activeScope === "global"}
                scope="global"
                settings={resolvedGlobalSettings}
                title="전체 기본값"
              />
              <FeeApplicationCell
                isActive={activeScope === "market"}
                scope="market"
                settings={hasMarketSettings ? marketSettings : null}
                title={hasMarketSettings ? FLEA_MARKET_DEFAULT_LABEL : "미설정"}
                unavailableMessage={`${FLEA_MARKET_SETTINGS_LABEL}이 없어 전체 설정을 사용합니다.`}
              />
              <FeeApplicationCell
                action={
                  hasBoothSettings
                    ? renderParticipantFeeAction(participant, "compact")
                    : undefined
                }
                fallbackScope={hasMarketSettings ? "market" : "global"}
                isActive={activeScope === "booth"}
                scope="booth"
                settings={hasBoothSettings ? participant.settings : null}
                title={hasBoothSettings ? SELLER_SETTINGS_LABEL : `${SELLER_SETTINGS_LABEL} 없음`}
                unavailableAction={
                  hasBoothSettings
                    ? undefined
                    : renderParticipantFeeAction(participant, "large")
                }
              />
            </article>
          );
        })}
      </div>
      <div className="hidden min-w-0 max-w-full overflow-x-auto md:block">
        <div className="min-w-[1120px]">
          <div className="grid grid-cols-[170px_minmax(240px,1fr)_minmax(240px,1fr)_minmax(260px,1fr)] items-center bg-surface-sunken px-[22px] py-3 text-center text-sm font-medium text-muted">
            <span>{PARTICIPATING_SELLER}</span>
            <span>전체 기본값</span>
            <span>{FLEA_MARKET_DEFAULT_LABEL}</span>
            <span className="font-semibold text-brand">이 {SELLER_SETTINGS_LABEL}</span>
          </div>
          <div className="divide-y divide-hairline">
            {participants.map((participant) => {
              const activeScope = getParticipantFeePolicySource(
                participant,
                hasMarketSettings,
              );
              const hasBoothSettings =
                participant.settings?.feeSettingOverrideEnabled === true;

              return (
                <div
                  className="grid grid-cols-[170px_minmax(240px,1fr)_minmax(240px,1fr)_minmax(260px,1fr)] items-stretch gap-3.5 px-[22px] py-4"
                  data-testid="fee-status-row"
                  key={participant.id}
                >
                  <div className="flex min-h-full flex-col items-center justify-center text-center">
                    <p className="text-[14.5px] font-semibold text-ink">
                      {participant.displayName}
                    </p>
                    <p className="mt-2">
                      <ParticipantTypeBadge
                        type={participant.participantType}
                      />
                    </p>
                  </div>
                  <FeeApplicationCell
                    isActive={activeScope === "global"}
                    scope="global"
                    settings={resolvedGlobalSettings}
                    title="전체 기본값"
                  />
                  <FeeApplicationCell
                    isActive={activeScope === "market"}
                    scope="market"
                    settings={hasMarketSettings ? marketSettings : null}
                    title={hasMarketSettings ? FLEA_MARKET_DEFAULT_LABEL : "미설정"}
                    unavailableMessage={`${FLEA_MARKET_SETTINGS_LABEL}이 없어 전체 설정을 사용합니다.`}
                  />
                  <FeeApplicationCell
                    action={
                      hasBoothSettings
                        ? renderParticipantFeeAction(participant, "compact")
                        : undefined
                    }
                    fallbackScope={hasMarketSettings ? "market" : "global"}
                    isActive={activeScope === "booth"}
                    scope="booth"
                    settings={hasBoothSettings ? participant.settings : null}
                    title={hasBoothSettings ? SELLER_SETTINGS_LABEL : `${SELLER_SETTINGS_LABEL} 없음`}
                    unavailableAction={
                      hasBoothSettings
                        ? undefined
                        : renderParticipantFeeAction(participant, "large")
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeeApplicationCell({
  action,
  fallbackScope,
  isActive,
  scope,
  settings,
  title,
  unavailableAction,
  unavailableMessage,
}: {
  action?: ReactNode;
  fallbackScope?: FeeSettingScope;
  isActive: boolean;
  scope: FeeSettingScope;
  settings:
    | SettlementDefaultSettings
    | Participant["settings"]
    | null
    | undefined;
  title: string;
  unavailableAction?: ReactNode;
  unavailableMessage?: string;
}) {
  const isUnavailable = !settings;

  return (
    <div
      className={cn(
        feeApplicationCellVariants({ active: isActive }),
        isUnavailable &&
          unavailableAction &&
          !isActive &&
          "opacity-70 hover:opacity-100",
        isUnavailable &&
          unavailableAction &&
          "grid-rows-[auto_minmax(0,1fr)] content-stretch",
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p
          className={cn(
            "min-w-0 truncate text-xs",
            isActive
              ? "font-semibold text-body"
              : "font-medium text-muted-soft",
          )}
        >
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={feeApplicationStatusTextVariants({ active: isActive })}
          >
            {isActive ? "적용 중" : isUnavailable ? "미설정" : "대기"}
          </span>
          {action}
        </div>
      </div>
      {isUnavailable ? (
        unavailableAction ? (
          <div className="grid h-full min-h-0 place-items-center px-3 py-4">
            {unavailableAction}
          </div>
        ) : (
          <p
            className={cn(
              "grid min-h-[94px] place-items-center rounded-[8px] bg-canvas-soft px-3 py-4 text-center text-sm leading-relaxed",
              isActive ? "font-medium text-muted" : "font-normal text-muted-soft",
            )}
          >
            {unavailableMessage ?? "설정이 없습니다."}
          </p>
        )
      ) : (
        <dl className="grid gap-1.5">
          {feeSettingFields.map((field) => {
            return (
              <div
                className={feeSettingFieldRowVariants({ active: isActive })}
                key={field.key}
              >
                <dt
                  className={cn(
                    "text-xs",
                    isActive ? "font-normal text-muted" : "font-light text-muted-soft",
                  )}
                >
                  {field.label}
                </dt>
                <dd
                  className={cn(
                    "truncate font-display",
                    isActive
                      ? "font-semibold text-ink"
                      : "font-medium text-muted",
                  )}
                >
                  {formatFeeFieldValue(
                    field.key,
                    getScopedFeeFieldValue(scope, settings, field.key),
                    fallbackScope,
                  )}
                </dd>
                <span
                  className={feeSettingFieldStatusVariants({
                    active: isActive,
                  })}
                >
                  {isActive ? "적용" : "-"}
                </span>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
