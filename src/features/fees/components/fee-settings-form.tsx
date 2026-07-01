import type { FormEvent } from "react";
import type {
  SettlementDefaultSettings,
  SettlementFeeSettings,
} from "@/services/settlement-settings.service";
import {
  feeSettingScopeLabels,
  type FeeSettingScope,
} from "@/features/fees/lib/fee-policy";
import { buttonVariants, inputClass, selectClass } from "@/lib/design-system";

export function FeeSettingsForm({
  defaultValues,
  disabled,
  message,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: SettlementDefaultSettings | null;
  disabled: boolean;
  message: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
}) {
  return (
    <form
      className="grid gap-3 p-4"
      key={defaultValues?.updatedAt ?? defaultValues?.id ?? "empty"}
      onSubmit={onSubmit}
    >
      <FeeSettingsFields defaultValues={defaultValues ?? null} disabled={disabled} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          우선순위: 현재 플리마켓의 부스별 예외값, 플리마켓별 설정,
          전체 설정
        </p>
        <button className={buttonVariants()} disabled={disabled} type="submit">
          {submitLabel}
        </button>
      </div>
      {message && <p className="text-sm font-medium text-error">{message}</p>}
    </form>
  );
}

export function FeeSettingsFields({
  allowInheritance = false,
  defaultValues,
  disabled,
  inheritanceScope = "market",
}: {
  allowInheritance?: boolean;
  defaultValues: Partial<SettlementFeeSettings> | null;
  disabled: boolean;
  inheritanceScope?: FeeSettingScope;
}) {
  const inheritanceLabel = `${feeSettingScopeLabels[inheritanceScope]} 사용`;

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <label className="grid gap-1 text-xs font-medium text-body">
        판매 수수료 %
        <input
          className={inputClass}
          defaultValue={formatRateInput(defaultValues?.salesCommissionRate)}
          disabled={disabled}
          min="0"
          name="salesCommissionPercent"
          placeholder={allowInheritance ? inheritanceLabel : "0"}
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-body">
        카드 수수료 %
        <input
          className={inputClass}
          defaultValue={formatRateInput(defaultValues?.cardFeeRate)}
          disabled={disabled}
          min="0"
          name="cardFeePercent"
          placeholder={allowInheritance ? inheritanceLabel : "0"}
          step="0.01"
          type="number"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-body">
        카드 수수료 부담
        <select
          className={selectClass}
          defaultValue={defaultValues?.cardFeePayer ?? ""}
          disabled={disabled}
          name="cardFeePayer"
        >
          {allowInheritance && <option value="">{inheritanceLabel}</option>}
          <option value="market">마켓 부담</option>
          <option value="participant">참가부스 부담</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-body">
        참가비
        <input
          className={inputClass}
          defaultValue={
            defaultValues?.participationFeeAmount === undefined ||
            defaultValues.participationFeeAmount === null
              ? ""
              : String(defaultValues.participationFeeAmount)
          }
          disabled={disabled}
          min="0"
          name="participationFeeAmount"
          placeholder={allowInheritance ? inheritanceLabel : "0"}
          step="1"
          type="number"
        />
      </label>
    </div>
  );
}

function formatRateInput(value: number | null | undefined): string {
  return value === null || value === undefined
    ? ""
    : String(Number((value * 100).toFixed(4)));
}
