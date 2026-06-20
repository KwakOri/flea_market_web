import { HomeActionCard } from "@/features/dashboard/components/home-action-card";

export function HomeView() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <HomeActionCard
        description="플리마켓을 만들고 선택한 뒤 해당 마켓의 참가부스 연결, 영수증, 정산을 관리합니다."
        href="/markets"
        label="마켓 관리"
      />
      <HomeActionCard
        description="마켓에 연결하기 전의 부스 기본 정보와 연락처를 관리합니다."
        href="/booths"
        label="부스 관리"
      />
      <HomeActionCard
        description="전체 수수료 기본값처럼 모든 플리마켓에 적용되는 기본 정책을 관리합니다."
        href="/settings"
        label="설정"
      />
    </section>
  );
}
