import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

type DrizzleInstance = ReturnType<typeof drizzle<typeof fullSchema>>;

let instance: DrizzleInstance | null = null;

// LAZY initialization — pool is only created when first needed
// This ensures boot.ts (DDL migration) runs BEFORE any pool exists
export function getDb(): DrizzleInstance {
  if (!instance) {
    console.log("[connection] Creating new Drizzle instance (mode: default)");
    instance = drizzle(env.databaseUrl, {
      mode: "default",
      schema: fullSchema,
    });
  }
  return instance;
}

export function resetDb() {
  console.log("[connection] Resetting Drizzle instance");
  instance = null;
}
