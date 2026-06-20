import type { FormEvent } from "react";
import type { SettlementDefaultSettings } from "@/services/settlement-settings.service";
import { FeeSettingsForm } from "@/features/fees/components/fee-settings-form";
import {
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
} from "@/lib/design-system";

export function SettingsView({
  defaultValues,
  disabled,
  message,
  submitLabel,
  onSubmit,
}: {
  defaultValues?: SettlementDefaultSettings | null;
  disabled: boolean;
  message: string | null;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className={panelVariants()}>
      <div className={sectionHeaderClass}>
        <h2 className={sectionTitleClass}>전체 수수료 기본 설정</h2>
        <p className={sectionDescriptionClass}>
          플리마켓별 설정이나 현재 플리마켓 안의 부스별 예외값이 없으면 이 값이
          적용됩니다.
        </p>
      </div>
      <FeeSettingsForm
        defaultValues={defaultValues}
        disabled={disabled}
        message={message}
        submitLabel={submitLabel}
        onSubmit={onSubmit}
      />
    </section>
  );
}
