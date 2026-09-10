import { PrismaClient } from "@prisma/client";

// Prisma client singleton — mencegah connection pool exhaustion di serverless (SRS §6.2).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
