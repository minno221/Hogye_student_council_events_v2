import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { parseEventInput } from "@/lib/validate";

// 전체 행사 목록 조회 (일반 사용자 + 관리자 모두 사용)
export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(events);
}

// 새 행사 등록 (관리자만 가능)
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const parsed = parseEventInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const event = await prisma.event.create({ data: parsed.data });
  return NextResponse.json(event, { status: 201 });
}
