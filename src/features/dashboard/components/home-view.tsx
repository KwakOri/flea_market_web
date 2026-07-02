import { HomeActionCard } from "@/features/dashboard/components/home-action-card";
import {
  FLEA_MARKET,
  FLEA_MARKET_MANAGE_LABEL,
  SELLER,
  SELLER_MANAGE_LABEL,
} from "@/lib/terminology";

export function HomeView() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <HomeActionCard
        description={`${FLEA_MARKET}을 만들고 선택한 뒤 해당 ${FLEA_MARKET}의 ${SELLER} 연결, 영수증, 정산을 관리합니다.`}
        href="/markets"
        label={FLEA_MARKET_MANAGE_LABEL}
      />
      <HomeActionCard
        description={`${FLEA_MARKET}에 연결하기 전의 ${SELLER} 기본 정보와 연락처를 관리합니다.`}
        href="/booths"
        label={SELLER_MANAGE_LABEL}
      />
      <HomeActionCard
        description={`전체 수수료 기본값처럼 모든 ${FLEA_MARKET}에 적용되는 기본 정책을 관리합니다.`}
        href="/settings"
        label="설정"
      />
    </section>
  );
}
