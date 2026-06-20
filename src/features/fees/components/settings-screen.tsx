"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  useGlobalSettlementSettings,
  useUpdateGlobalSettlementSettings,
} from "@/hooks/use-settlement-settings";
import { getFeeSettingsPayload } from "@/features/fees/lib/fee-settings-payload";
import { SettingsView } from "@/features/fees/components/settings-view";
import { getErrorMessage } from "@/lib/error-message";

export function SettingsScreen({
  enabled,
  onSaved,
}: {
  enabled: boolean;
  onSaved: (title: string, message: string) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const globalFeeSettings = useGlobalSettlementSettings(enabled);
  const updateGlobalFeeSettings = useUpdateGlobalSettlementSettings();

  async function handleUpdateGlobalFeeSettings(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setMessage(null);

    try {
      await updateGlobalFeeSettings.mutateAsync(
        getFeeSettingsPayload(new FormData(event.currentTarget)),
      );
      onSaved("전체 수수료 저장 완료", "전체 수수료 기본값을 저장했습니다.");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <SettingsView
      defaultValues={globalFeeSettings.data}
      disabled={
        globalFeeSettings.isLoading || updateGlobalFeeSettings.isPending
      }
      message={message}
      submitLabel={updateGlobalFeeSettings.isPending ? "저장 중" : "저장"}
      onSubmit={handleUpdateGlobalFeeSettings}
    />
  );
}
