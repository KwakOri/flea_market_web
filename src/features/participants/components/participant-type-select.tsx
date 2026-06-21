"use client";

import type { ParticipantType } from "@/services/participants.service";
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
      <option value="seller">셀러</option>
      <option value="staff">운영진</option>
      <option value="special_booth">특수 부스</option>
    </select>
  );
}
