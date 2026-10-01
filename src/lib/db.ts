import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createClient(connectionString: string) {
  // Serverless functions should hold only a few connections each; Supabase's pooler does the rest.
  const max = Number(process.env.DATABASE_POOL_MAX) || 5;
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max,
      // Retire idle connections before Supabase's pooler closes them on its side,
      // otherwise the next query can land on a dead socket ("Server has closed the connection").
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 30_000,
      keepAlive: true,
    }),
  });
}

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return connectionString;
}

// Reuse one client across hot reloads in development. The URL is remembered so that
// editing DATABASE_URL in .env.local takes effect without restarting `next dev`.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaUrl?: string };

function getClient(): PrismaClient {
  const url = getConnectionString();
  if (globalForPrisma.prisma && globalForPrisma.prismaUrl === url) return globalForPrisma.prisma;
  void globalForPrisma.prisma?.$disconnect();
  const client = createClient(url);
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaUrl = url;
  }
  return client;
}

const productionClient = process.env.NODE_ENV === "production" ? getClient() : undefined;

/** Prisma client. In development it is resolved per access so env changes are picked up. */
export const db: PrismaClient =
  productionClient ??
  new Proxy({} as PrismaClient, {
    get(_target, property) {
      const client = getClient();
      const value = Reflect.get(client, property, client);
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
