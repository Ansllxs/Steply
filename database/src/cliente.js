import { PrismaClient } from '@prisma/client';

// Una sola instancia de PrismaClient por proceso. En desarrollo se guarda en
// globalThis para que el "hot reload" (nodemon, etc.) no abra conexiones nuevas.
const global = globalThis;

export const prisma =
  global.__steplyPrisma ??
  new PrismaClient({
    log: process.env.PRISMA_LOG ? process.env.PRISMA_LOG.split(',') : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') global.__steplyPrisma = prisma;

export async function desconectar() {
  await prisma.$disconnect();
}
