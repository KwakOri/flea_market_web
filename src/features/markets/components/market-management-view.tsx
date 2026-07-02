import { useMemo, type FormEvent } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import type { Market } from "@/services/markets.service";
import type { SettlementDefaultSettings } from "@/services/settlement-settings.service";
import { useDashboardUiStore } from "@/stores/dashboard-ui.store";
import { FeeSettingsForm } from "@/features/fees/components/fee-settings-form";
import { MarketDetailPanel } from "@/features/markets/components/market-detail-panel";
import { MarketLifecycleFilterControl } from "@/features/markets/components/market-lifecycle-filter-control";
import { MarketSelectionCards } from "@/features/markets/components/market-selection-cards";
import {
  filterMarketsByLifecycle,
  sortMarketsByNewest,
} from "@/features/markets/lib/market-display";
import {
  buttonVariants,
  panelVariants,
  sectionDescriptionClass,
  sectionHeaderClass,
  sectionTitleClass,
} from "@/lib/design-system";
import {
  FLEA_MARKET,
  FLEA_MARKET_ADD_LABEL,
  FLEA_MARKET_INFO_LABEL,
  FLEA_MARKET_SELECT_LABEL,
  SELLER,
} from "@/lib/terminology";
import { cn } from "@/lib/utils";

export function MarketManagementView({
  createMarketDisabled,
  marketFeeSettings,
  marketFeeSettingsDisabled,
  marketFeeSettingsMessage,
  marketFeeSettingsSubmitLabel,
  marketId,
  marketMessage,
  markets,
  selectedMarket,
  onCreateMarket,
  onEditMarket,
  onSelectMarket,
  onUpdateMarketFeeSettings,
}: {
  createMarketDisabled: boolean;
  marketFeeSettings?: SettlementDefaultSettings | null;
  marketFeeSettingsDisabled: boolean;
  marketFeeSettingsMessage: string | null;
  marketFeeSettingsSubmitLabel: string;
  marketId: string | null;
  marketMessage: string | null;
  markets: Market[];
  selectedMarket: Market | null;
  onCreateMarket: () => void;
  onEditMarket: (market: Market) => void;
  onSelectMarket: (marketId: string) => void;
  onUpdateMarketFeeSettings: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const marketLifecycleFilter = useDashboardUiStore(
    (state) => state.marketLifecycleFilter,
  );
  const setMarketLifecycleFilter = useDashboardUiStore(
    (state) => state.setMarketLifecycleFilter,
  );
  const filteredMarkets = useMemo(
    () => sortMarketsByNewest(filterMarketsByLifecycle(markets, marketLifecycleFilter)),
    [marketLifecycleFilter, markets],
  );

  if (marketId) {
    return (
      <section className={panelVariants()}>
        <div
          className={cn(
            sectionHeaderClass,
            "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
          )}
        >
          <div>
            <h2 className={sectionTitleClass}>{FLEA_MARKET_INFO_LABEL}</h2>
            <p className={sectionDescriptionClass}>
              선택한 {FLEA_MARKET}의 기본 정보를 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={buttonVariants({ intent: "secondary" })}
              disabled={!selectedMarket}
              onClick={() => selectedMarket && onEditMarket(selectedMarket)}
              type="button"
            >
              <Pencil aria-hidden className="mr-2 h-4 w-4" />
              정보 수정
            </button>
            <Link
              className={buttonVariants({ intent: "secondary" })}
              href="/markets"
            >
              {FLEA_MARKET_SELECT_LABEL}
            </Link>
          </div>
        </div>
        {marketMessage && (
          <p className="border-b border-hairline px-4 py-2 text-sm font-medium text-error">
            {marketMessage}
          </p>
        )}
        <MarketDetailPanel market={selectedMarket} />
        <div className="border-t border-hairline">
          <div className={sectionHeaderClass}>
            <h2 className={sectionTitleClass}>{FLEA_MARKET} 수수료 기본 설정</h2>
            <p className={sectionDescriptionClass}>
              현재 {FLEA_MARKET} 안의 {SELLER}별 예외값이 없으면 이 값이 전체 설정보다
              우선 적용됩니다.
            </p>
          </div>
          <FeeSettingsForm
            defaultValues={marketFeeSettings}
            disabled={marketFeeSettingsDisabled}
            message={marketFeeSettingsMessage}
            submitLabel={marketFeeSettingsSubmitLabel}
            onSubmit={onUpdateMarketFeeSettings}
          />
        </div>
      </section>
    );
  }

  return (
    <section className={panelVariants()}>
      <div
        className={cn(
          sectionHeaderClass,
          "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
        )}
      >
        <div>
          <h2 className={sectionTitleClass}>{FLEA_MARKET_SELECT_LABEL}</h2>
          <p className={sectionDescriptionClass}>
            작업할 {FLEA_MARKET}을 먼저 선택합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MarketLifecycleFilterControl
            selectedFilter={marketLifecycleFilter}
            onSelectFilter={setMarketLifecycleFilter}
          />
          <button
            className={buttonVariants()}
            disabled={createMarketDisabled}
            onClick={onCreateMarket}
            type="button"
          >
            <Plus aria-hidden className="mr-2 h-4 w-4" />
            {FLEA_MARKET_ADD_LABEL}
          </button>
        </div>
      </div>
      {marketMessage && (
        <p className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-red-700">
          {marketMessage}
        </p>
      )}
      <MarketSelectionCards
        emptyMessage={`조건에 맞는 ${FLEA_MARKET}이 없습니다.`}
        markets={filteredMarkets}
        selectedMarketId={null}
        onManageMarket={onEditMarket}
        onSelectMarket={onSelectMarket}
      />
    </section>
  );
}
