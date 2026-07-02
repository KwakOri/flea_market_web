"use client";

import { useMemo } from "react";
import type { Participant } from "@/services/participants.service";
import { participantTypeLabels } from "@/features/participants/lib/participant-display";
import { inputClass } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export function ParticipantPicker({
  disabled,
  participants,
  search,
  selectedParticipantId,
  onSearchChange,
  onSelectParticipant,
}: {
  disabled: boolean;
  participants: Participant[];
  search: string;
  selectedParticipantId: string;
  onSearchChange: (search: string) => void;
  onSelectParticipant: (participantId: string) => void;
}) {
  const filteredParticipants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return participants;
    }

    return participants.filter((participant) => {
      const searchableText = [
        participant.displayName,
        participant.contactName,
        participant.phone,
        participant.email,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [participants, search]);

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-xs font-medium text-body">
        참가부스 검색
        <input
          className={inputClass}
          disabled={disabled || participants.length === 0}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
          placeholder="부스명, 담당자, 연락처 검색"
          type="search"
          value={search}
        />
      </label>
      <div className="max-h-72 overflow-y-auto rounded-md border border-hairline bg-surface">
        {participants.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted">
            연결 가능한 참가부스가 없습니다.
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {filteredParticipants.map((participant) => {
              const isSelected = participant.id === selectedParticipantId;
              const secondaryText = [
                participant.contactName,
                participant.phone,
                participant.email,
              ]
                .filter((value): value is string => Boolean(value))
                .join(" · ");

              return (
                <button
                  aria-pressed={isSelected}
                  className={cn(
                    "grid w-full gap-2 px-4 py-3 text-left transition hover:bg-brand-tint",
                    isSelected &&
                      "bg-brand-tint-strong ring-1 ring-inset ring-brand",
                  )}
                  disabled={disabled}
                  key={participant.id}
                  onClick={() => onSelectParticipant(participant.id)}
                  type="button"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {participant.displayName}
                      </span>
                      {secondaryText && (
                        <span className="mt-1 block truncate text-xs text-muted">
                          {secondaryText}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-1 text-xs font-medium",
                        isSelected
                          ? "bg-success-tint text-success"
                          : "bg-canvas-soft text-muted",
                      )}
                    >
                      {isSelected
                        ? "선택됨"
                        : participantTypeLabels[participant.participantType]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
