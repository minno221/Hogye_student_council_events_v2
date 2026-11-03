// 행사 등록/수정 때 서버에서 입력값을 검사하는 도구

export type EventInput = {
  title: string;
  description: string;
  naverFormUrl: string;
  imageUrl: string | null;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
};

type Result = { ok: true; data: EventInput } | { ok: false; error: string };

function isHttpUrl(value: string, httpsOnly = false): boolean {
  try {
    const u = new URL(value);
    if (httpsOnly) return u.protocol === "https:";
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function parseDay(value: unknown, endOfDay: boolean): Date | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "invalid";
  }
  // 한국 시간(+09:00) 기준으로 하루의 처음/끝
  const d = new Date(
    endOfDay ? `${value}T23:59:59+09:00` : `${value}T00:00:00+09:00`
  );
  return isNaN(d.getTime()) ? "invalid" : d;
}

export function parseEventInput(body: unknown): Result {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "잘못된 요청입니다." };
  }
  const b = body as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title) return { ok: false, error: "제목을 입력해 주세요." };
  if (title.length > 80) {
    return { ok: false, error: "제목은 80자 이하로 입력해 주세요." };
  }

  const description =
    typeof b.description === "string" ? b.description.trim() : "";
  if (description.length > 2000) {
    return { ok: false, error: "설명은 2000자 이하로 입력해 주세요." };
  }

  const naverFormUrl =
    typeof b.naverFormUrl === "string" ? b.naverFormUrl.trim() : "";
  if (!naverFormUrl) {
    return { ok: false, error: "네이버폼 링크를 입력해 주세요." };
  }
  if (naverFormUrl.length > 500 || !isHttpUrl(naverFormUrl)) {
    return {
      ok: false,
      error: "네이버폼 링크가 올바르지 않아요. https:// 로 시작해야 해요.",
    };
  }

  let imageUrl: string | null = null;
  if (typeof b.imageUrl === "string" && b.imageUrl.trim()) {
    imageUrl = b.imageUrl.trim();
    if (imageUrl.length > 500 || !isHttpUrl(imageUrl, true)) {
      return { ok: false, error: "사진 주소가 올바르지 않아요." };
    }
  }

  const startDate = parseDay(b.startDate, false);
  const endDate = parseDay(b.endDate, true);
  if (startDate === "invalid" || endDate === "invalid") {
    return { ok: false, error: "날짜 형식이 올바르지 않아요." };
  }
  if (startDate && endDate && endDate < startDate) {
    return { ok: false, error: "마감일은 시작일보다 늦어야 해요." };
  }

  const isActive = typeof b.isActive === "boolean" ? b.isActive : true;

  return {
    ok: true,
    data: {
      title,
      description,
      naverFormUrl,
      imageUrl,
      isActive,
      startDate,
      endDate,
    },
  };
}
