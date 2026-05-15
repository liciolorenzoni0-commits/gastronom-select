import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

type DrizzleInstance = ReturnType<typeof drizzle<typeof fullSchema>>;

let instance: DrizzleInstance | null = null;

export function getDb(): DrizzleInstance {
  if (!instance) {
    instance = drizzle(env.databaseUrl, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return instance;
}

// Call this after DDL operations to force a new pool on next getDb()
export function resetDb() {
  console.log("[connection] Resetting Drizzle pool");
  instance = null;
}
