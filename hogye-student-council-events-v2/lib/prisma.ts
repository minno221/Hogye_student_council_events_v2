import { PrismaClient } from "@prisma/client";

// Next.js 개발 서버에서 핫리로드 될 때마다 PrismaClient가 새로 생성되는 걸 방지하기 위한 코드
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
