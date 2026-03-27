// src/lib/prisma.ts
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// 1. Setup the connection pool
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Cloud DBs like Supabase/Neon require SSL in 2026
  ssl: { rejectUnauthorized: false } 
});

const adapter = new PrismaPg(pool);

// 2. Prevent multiple instances in development (The Singleton Pattern)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;