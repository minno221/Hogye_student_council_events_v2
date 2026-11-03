import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "jpg, png, webp, gif 사진만 올릴 수 있어요." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "사진은 5MB 이하만 올릴 수 있어요." },
      { status: 400 }
    );
  }

  // 원래 파일 이름은 쓰지 않고 안전한 이름으로 저장
  const name = `events/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const blob = await put(name, file, { access: "public" });

  return NextResponse.json(blob);
}
