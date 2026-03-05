import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/postgres",
});

export const db = drizzle({ client: pool, schema });

// We export a helper to verify connection at runtime rather than crash on import
export async function checkDatabaseConnection() {
    if (!process.env.DATABASE_URL) {
        console.warn("WARNING: DATABASE_URL is not set. Database queries will fail.");
        return false;
    }
    return true;
}
