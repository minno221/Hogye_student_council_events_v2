import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "호계고 학생회 행사",
  description: "호계고 학생회 행사 목록 및 신청",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
