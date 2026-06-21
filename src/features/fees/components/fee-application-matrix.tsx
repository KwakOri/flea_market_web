"use client";

import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { CircleDollarSign } from "lucide-react";
import type { Participant } from "@/services/participants.service";
import type { SettlementDefaultSettings } from "@/services/settlement-settings.service";
import {
  defaultFeeSettings,
  feeSettingFields,
  feeSettingScopeLabels,
  formatFeeFieldValue,
  getParticipantFeePolicySource,
  getScopedFeeFieldValue,
  type FeeSettingScope,
} from "@/features/fees/lib/fee-policy";
import { ParticipantTypeBadge } from "@/features/participants/components/participant-type-badge";

const feeApplicationCellVariants = cva(
  "grid h-full min-h-[154px] content-start gap-2 rounded-xl border border-[#ece7d8] bg-white p-[13px] transition-opacity",
  {
    variants: {
      active: {
        true: "border-[#1f8a4d] bg-[#e6f4ec]",
        false: "opacity-50 hover:opacity-75",
      },
    },
  },
);

const feeApplicationStatusTextVariants = cva(
  "font-mono text-[9.5px] font-bold",
  {
    variants: {
      active: {
        true: "text-[#1f8a4d]",
        false: "text-[#bdb9a8]",
      },
    },
  },
);

const feeSettingFieldRowVariants = cva(
  "grid min-h-7 grid-cols-[76px_minmax(0,1fr)_38px] items-center gap-2 rounded-md px-2 py-1",
  {
    variants: {
      active: {
        true: "bg-white shadow-sm ring-1 ring-[#bfe3cd]",
        false: "",
      },
    },
  },
);

const feeSettingFieldStatusVariants = cva(
  "text-right font-mono text-[11px] font-semibold",
  {
    variants: {
      active: {
        true: "text-[#1f8a4d]",
        false: "text-[#c4c0ae]",
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
      <div className="px-4 py-12 text-center text-sm text-[#8a8775]">
        수수료 적용 현황을 불러오는 중입니다.
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-[#8a8775]">
        연결된 참가부스가 없습니다.
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

  return (
    <div className="overflow-hidden rounded-[18px] bg-white">
      <div className="min-w-0 max-w-full overflow-x-auto">
        <div className="min-w-[1120px]">
          <div className="grid grid-cols-[170px_minmax(240px,1fr)_minmax(240px,1fr)_minmax(260px,1fr)] bg-[#16170f] px-[22px] py-[13px] font-mono text-[10.5px] font-semibold tracking-[0.06em] text-[#9b9a86]">
            <span>참가 부스</span>
            <span>전체 기본값</span>
            <span>플리마켓 기본값</span>
            <span className="text-[#c7f94b]">이 부스 설정</span>
          </div>
          <div className="divide-y divide-[#f1eee2]">
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
                  <div className="pt-1">
                    <p className="text-[14.5px] font-semibold text-[#1a1b12]">
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
                    title={hasMarketSettings ? "플리마켓 기본값" : "미설정"}
                    unavailableMessage="플리마켓 설정이 없어 전체 설정을 사용합니다."
                  />
                  <FeeApplicationCell
                    action={
                      <button
                        aria-label={`${participant.displayName} 부스별 수수료 설정`}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#d8d3c2] bg-white text-[#1a1b12] transition hover:bg-[#f1eee2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7f94b]"
                        onClick={() => onEditParticipant(participant)}
                        title="부스별 수수료 설정"
                        type="button"
                      >
                        <CircleDollarSign
                          aria-hidden
                          className="h-3.5 w-3.5"
                        />
                      </button>
                    }
                    fallbackScope={hasMarketSettings ? "market" : "global"}
                    isActive={activeScope === "booth"}
                    scope="booth"
                    settings={hasBoothSettings ? participant.settings : null}
                    title={hasBoothSettings ? "부스 설정" : "부스 설정 없음"}
                    unavailableMessage={`부스 설정이 없어 ${feeSettingScopeLabels[activeScope]}을 사용합니다.`}
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
  unavailableMessage?: string;
}) {
  const isUnavailable = !settings;

  return (
    <div className={feeApplicationCellVariants({ active: isActive })}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-semibold text-[#56564a]">
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
        <p className="grid min-h-[94px] place-items-center rounded-[10px] bg-[#fcfbf6] px-3 py-4 text-center text-sm leading-relaxed text-[#8a8775]">
          {unavailableMessage ?? "설정이 없습니다."}
        </p>
      ) : (
        <dl className="grid gap-1.5">
          {feeSettingFields.map((field) => {
            return (
              <div
                className={feeSettingFieldRowVariants({ active: isActive })}
                key={field.key}
              >
                <dt className="text-xs text-[#8a8775]">{field.label}</dt>
                <dd className="truncate font-display font-semibold text-[#1a1b12]">
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
