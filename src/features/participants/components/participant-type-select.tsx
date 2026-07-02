"use client";

import type { ParticipantType } from "@/services/participants.service";
import { participantTypeLabels } from "@/features/participants/lib/participant-display";
import { selectClass } from "@/lib/design-system";

export function ParticipantTypeSelect({
  defaultValue,
  disabled,
}: {
  defaultValue: ParticipantType;
  disabled: boolean;
}) {
  return (
    <select
      className={selectClass}
      defaultValue={defaultValue}
      disabled={disabled}
      name="participantType"
    >
      <option value="seller">{participantTypeLabels.seller}</option>
      <option value="staff">{participantTypeLabels.staff}</option>
      <option value="special_booth">{participantTypeLabels.special_booth}</option>
    </select>
  );
}
