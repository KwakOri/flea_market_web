export default function Home() {
  const summary = [
    { label: "오늘 매출", value: "0원" },
    { label: "정산 대기", value: "0건" },
    { label: "참가 마켓", value: "0팀" },
    { label: "현금 시재 오차", value: "0원" },
  ];

  const rows = [
    {
      receipt: "R-0001",
      customer: "현장 고객",
      payment: "카드",
      participants: "셀러 A 외 2팀",
      amount: "0원",
      status: "입력 대기",
    },
    {
      receipt: "R-0002",
      customer: "현장 고객",
      payment: "현금",
      participants: "운영진 판매",
      amount: "0원",
      status: "검수 대기",
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Flea Market Settlement
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-950">
              플리마켓 운영 대시보드
            </h1>
          </div>
          <div className="flex gap-2">
            <button className="h-10 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm">
              참가자 추가
            </button>
            <button className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm">
              영수증 입력
            </button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-medium text-zinc-500">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-950">
              최근 영수증
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">영수증</th>
                  <th className="px-4 py-3 font-medium">고객</th>
                  <th className="px-4 py-3 font-medium">결제</th>
                  <th className="px-4 py-3 font-medium">판매 라인</th>
                  <th className="px-4 py-3 text-right font-medium">금액</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((row) => (
                  <tr key={row.receipt}>
                    <td className="px-4 py-3 font-medium text-zinc-950">
                      {row.receipt}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {row.customer}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {row.payment}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {row.participants}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-950">
                      {row.amount}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
