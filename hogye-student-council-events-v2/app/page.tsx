import { prisma } from "@/lib/prisma";
import { getStatus, type EventStatus, type EventView } from "@/lib/status";
import EventList from "./EventList";

// 매 요청마다 최신 데이터를 보여주기 위해 캐시 사용 안 함
export const dynamic = "force-dynamic";

const ORDER: Record<EventStatus, number> = { active: 0, upcoming: 1, closed: 2 };

export default async function HomePage() {
  const rows = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const events: EventView[] = rows
    .map((row) => {
      const startDate = row.startDate ? row.startDate.toISOString() : null;
      const endDate = row.endDate ? row.endDate.toISOString() : null;
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        naverFormUrl: row.naverFormUrl,
        imageUrl: row.imageUrl,
        startDate,
        endDate,
        status: getStatus({ isActive: row.isActive, startDate, endDate }, now),
      };
    })
    // 진행중 → 예정 → 마감 순서로 보여주고, 같은 상태끼리는 최신순(이미 정렬됨)
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <main className="page">
      <header className="hero">
        <p className="hero-eyebrow">호계고 학생회</p>
        <h1 className="hero-title">학생회 행사</h1>
        <p className="hero-sub">
          행사를 눌러 자세한 내용을 확인하고, 신청 폼으로 바로 이동해 보세요.
        </p>
      </header>

      <EventList events={events} />
    </main>
  );
}
