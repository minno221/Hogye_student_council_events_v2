// 행사 상태 계산 + 화면에 보여줄 때 쓰는 공통 도구

export type EventStatus = "upcoming" | "active" | "closed";

export type EventView = {
  id: string;
  title: string;
  description: string;
  naverFormUrl: string;
  imageUrl: string | null;
  startDate: string | null; // ISO 문자열
  endDate: string | null; // ISO 문자열
  status: EventStatus;
};

export const STATUS_LABEL: Record<EventStatus, string> = {
  upcoming: "예정",
  active: "진행중",
  closed: "마감",
};

// 수동 설정(isActive)과 날짜를 함께 보고 상태를 정해요.
// - 관리자가 "진행중" 체크를 껐으면 마감
// - 마감일이 지났으면 자동으로 마감
// - 시작일이 아직 안 됐으면 예정
export function getStatus(
  e: { isActive: boolean; startDate: string | null; endDate: string | null },
  now: Date = new Date()
): EventStatus {
  if (!e.isActive) return "closed";
  if (e.endDate && new Date(e.endDate) < now) return "closed";
  if (e.startDate && new Date(e.startDate) > now) return "upcoming";
  return "active";
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  });
}

// 예: "11월 3일 ~ 11월 20일"
export function formatPeriod(
  start: string | null,
  end: string | null
): string | null {
  if (start && end) return `${formatDay(start)} ~ ${formatDay(end)}`;
  if (start) return `${formatDay(start)}부터`;
  if (end) return `${formatDay(end)}까지`;
  return null;
}

// 서버/관리자 입력창용: ISO → "YYYY-MM-DD" (한국 시간 기준)
export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}
