import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!(await verifySessionToken(token))) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

// /admin/dashboard 로 시작하는 모든 경로를 로그인 여부 검사 대상으로 지정
export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
