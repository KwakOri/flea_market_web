import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import type { Market } from "@/services/markets.service";
import type { Participant } from "@/services/participants.service";
import type { Product, ProductStatus } from "@/services/products.service";
import type { SettlementDefaultSettings } from "@/services/settlement-settings.service";
import { useDashboardUiStore } from "@/stores/dashboard-ui.store";
import { ParticipantList } from "@/features/participants/components/participant-list";
import { ProductTable } from "@/features/products/components/product-table";
import {
  buttonVariants,
  inputClass,
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
  selectClass,
} from "@/lib/design-system";
import {
  FLEA_MARKET,
  FLEA_MARKET_UNSELECTED_LABEL,
  PARTICIPATING_SELLER_ADD_LABEL,
  SELLER,
  SELLER_UNSELECTED_LABEL,
} from "@/lib/terminology";
import { cn } from "@/lib/utils";

export function BoothProductManagementView({
  createParticipantDisabled,
  createProductDisabled,
  deleteParticipantDisabled,
  globalSettings,
  marketSettings,
  participants,
  participantDialogOpen,
  participantMessage,
  products,
  productMessage,
  selectedMarket,
  selectedParticipant,
  selectedParticipantId,
  onCreateParticipant,
  onCreateProductSubmit,
  onDeleteParticipant,
  onEditParticipant,
  onProductStatusChange,
}: {
  createParticipantDisabled: boolean;
  createProductDisabled: boolean;
  deleteParticipantDisabled: boolean;
  globalSettings: SettlementDefaultSettings | null;
  marketSettings: SettlementDefaultSettings | null;
  participants: Participant[];
  participantDialogOpen: boolean;
  participantMessage: string | null;
  products: Product[];
  productMessage: string | null;
  selectedMarket: Market | null;
  selectedParticipant: Participant | null;
  selectedParticipantId: string | null;
  onCreateParticipant: () => void;
  onCreateProductSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteParticipant: (participant: Participant) => void;
  onEditParticipant: (participant: Participant) => void;
  onProductStatusChange: (productId: string, status: ProductStatus) => void;
}) {
  const setRequestedParticipantId = useDashboardUiStore(
    (state) => state.setRequestedParticipantId,
  );

  return (
    <div className="grid gap-6">
      <section className={panelVariants()}>
        <div
          className={cn(
            sectionHeaderClass,
            "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
          )}
        >
          <div>
            <h2 className={sectionTitleClass}>{FLEA_MARKET} 참가 설정</h2>
            <p className={sectionDescriptionClass}>
              {selectedMarket?.name ?? FLEA_MARKET_UNSELECTED_LABEL}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={buttonVariants()}
              disabled={createParticipantDisabled}
              onClick={onCreateParticipant}
              type="button"
            >
              <Plus aria-hidden className="mr-2 h-4 w-4" />
              {PARTICIPATING_SELLER_ADD_LABEL}
            </button>
          </div>
        </div>
        {participantMessage && !participantDialogOpen && (
          <p className="border-t border-hairline px-4 py-2 text-sm font-medium text-error">
            {participantMessage}
          </p>
        )}
        <ParticipantList
          deleteDisabled={deleteParticipantDisabled}
          emptyMessage={`연결된 ${SELLER}가 없습니다.`}
          globalSettings={globalSettings}
          marketSettings={marketSettings}
          participants={participants}
          selectedParticipantId={selectedParticipantId}
          onDeleteParticipant={onDeleteParticipant}
          onEditParticipant={onEditParticipant}
          onSelectParticipant={setRequestedParticipantId}
        />
      </section>
      <section className={panelVariants()}>
        <div
          className={cn(
            sectionHeaderClass,
            "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
          )}
        >
          <div>
            <h2 className={sectionTitleClass}>상품</h2>
            <p className={sectionDescriptionClass}>
              {selectedParticipant
                ? `${selectedMarket?.name ?? FLEA_MARKET} / ${selectedParticipant.displayName}`
                : SELLER_UNSELECTED_LABEL}
            </p>
          </div>
          <form
            className="grid gap-2 xl:grid-cols-[200px_220px_160px_140px_auto]"
            data-testid="product-form"
            onSubmit={onCreateProductSubmit}
          >
            <select
              className={selectClass}
              disabled={!participants.length}
              onChange={(event) =>
                setRequestedParticipantId(event.target.value || null)
              }
              value={selectedParticipantId ?? ""}
            >
              <option value="">{SELLER} 선택</option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.displayName}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              disabled={!selectedParticipant}
              name="name"
              placeholder="상품명"
              type="text"
            />
            <input
              className={inputClass}
              disabled={!selectedParticipant}
              name="sku"
              placeholder="SKU"
              type="text"
            />
            <input
              className={inputClass}
              disabled={!selectedParticipant}
              min="0"
              name="priceAmount"
              placeholder="가격"
              step="1"
              type="number"
            />
            <button
              className={buttonVariants()}
              disabled={createProductDisabled}
              type="submit"
            >
              상품 추가
            </button>
          </form>
        </div>
        {productMessage && (
          <p className="border-b border-hairline px-4 py-2 text-sm font-medium text-error">
            {productMessage}
          </p>
        )}
        <ProductTable products={products} onStatusChange={onProductStatusChange} />
      </section>
    </div>
  );
}
